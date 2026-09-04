import os
import json
import logging
import requests
import re
from django.conf import settings

logger = logging.getLogger(__name__)

def extract_json(text):
    """Safely extract alternatives list from any LLM response format."""
    if not text:
        return None
    try:
        # Strip reasoning / thinking tags (<think>...</think>)
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        if '<think>' in cleaned and '</think>' not in cleaned:
            idx = cleaned.rfind('[')
            if idx != -1:
                cleaned = cleaned[idx:]

        # Strip code fences
        cleaned = re.sub(r'```(?:json)?\s*', '', cleaned)
        cleaned = re.sub(r'```', '', cleaned).strip()

        # 1. Try direct parse
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for k in ['alternatives', 'suggestions', 'data', 'products', 'results']:
                    if k in parsed and isinstance(parsed[k], list):
                        return parsed[k]
        except Exception:
            pass

        # 2. Extract array [ ... ]
        start = cleaned.find('[')
        end = cleaned.rfind(']')
        if start != -1 and end != -1 and end > start:
            arr_str = cleaned[start:end + 1]
            try:
                parsed = json.loads(arr_str)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass

        # 3. Extract JSON object { ... }
        start_obj = cleaned.find('{')
        end_obj = cleaned.rfind('}')
        if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
            obj_str = cleaned[start_obj:end_obj + 1]
            try:
                parsed = json.loads(obj_str)
                if isinstance(parsed, dict):
                    for k in ['alternatives', 'suggestions', 'data', 'products', 'results']:
                        if k in parsed and isinstance(parsed[k], list):
                            return parsed[k]
            except Exception:
                pass

        # 4. Fallback: match individual JSON objects { "name": ..., ... }
        items = []
        obj_matches = re.findall(r'\{[^{}]*?"name"[^{}]*?\}', cleaned)
        for obj_str in obj_matches:
            try:
                item = json.loads(obj_str)
                if isinstance(item, dict) and 'name' in item and 'brand' in item:
                    items.append(item)
            except Exception:
                continue
        if items:
            return items

    except Exception as e:
        logger.warning(f"Error in extract_json: {e}")
    return None

def get_healthier_alternatives(product, conditions, current_score):
    """
    Call Groq API exactly ONCE and return 3 healthier product alternatives.
    """
    api_key = (
        getattr(settings, 'GROQ_API_KEY', None)
        or os.getenv('groq_api')
        or os.getenv('GROQ_API_KEY')
        or os.getenv('GROK_API_KEY')
        or getattr(settings, 'GEMINI_API_KEY', None)
        or os.getenv('GEMINI_API_KEY')
    )

    if not api_key:
        return {'alternatives': [], 'error': 'API_KEY_INVALID: Please add groq_api (or GROQ_API_KEY) in .env'}

    # Prepare ingredients text safely
    ingredients = product.ingredients if isinstance(product.ingredients, list) else []
    harmful_ings = [
        i.get('name', 'Unknown') for i in ingredients 
        if isinstance(i, dict) and i.get('type') == 'harmful'
    ]
    
    # Generate a hash for the health conditions
    conditions_list = sorted(conditions) if conditions else []
    conditions_hash = ','.join(conditions_list).lower()
    conditions_str = ', '.join(conditions) if conditions else 'none'

    # Check Database Cache first (0 API calls if cached)
    from .models import SuggestionCache
    try:
        cached = SuggestionCache.objects.filter(product=product, health_conditions_hash=conditions_hash).first()
        if cached:
            logger.info("Serving suggestions from DB Cache (0 API calls)")
            return {'alternatives': cached.suggestions, 'error': None}
    except Exception as e:
        logger.warning(f"Cache check error: {e}")

    # Prompt
    prompt = (
        f"Act as a nutritionist. Suggest exactly 3 healthier food alternatives available in the market to replace '{product.name} ({product.brand})' "
        f"in the category '{product.category}'. The user has these health conditions: {conditions_str}. "
        f"The original product contains these harmful ingredients: {', '.join(harmful_ings) if harmful_ings else 'none'}. "
        f"The original product score is {current_score} out of 100. Find products with a higher score. "
        f"You MUST reply with ONLY a valid JSON array. Do not add any greeting, markdown formatting, or text outside the JSON. "
        f"Use this exact structure: [ {{\"name\": \"Product Name\", \"brand\": \"Brand Name\", \"why_healthier\": \"Reason why it is healthier\", \"estimated_score\": 90}} ]"
    )

    # Groq OpenAI-compatible Chat Completions endpoint
    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    groq_model = os.getenv("GROQ_MODEL", "qwen/qwen3.6-27b")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": groq_model,
        "messages": [
            {
                "role": "system",
                "content": "You are a clinical nutritionist. Return a JSON object with a key 'alternatives' containing exactly 3 healthier food alternatives."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "response_format": {"type": "json_object"},
        "reasoning_effort": "none",
        "temperature": 0.3,
        "max_completion_tokens": 500,
        "top_p": 0.95
    }

    try:
        logger.info(f"Calling Groq API (single request) with model {groq_model}...")
        response = requests.post(groq_url, json=payload, headers=headers, timeout=15)
        
        if response.status_code != 200:
            logger.error(f"Groq API error {response.status_code}: {response.text}")
            return {'alternatives': [], 'error': f'Groq API error ({response.status_code}): {response.text[:120]}'}

        data = response.json()
        raw_text = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        if not raw_text:
            return {'alternatives': [], 'error': 'AI returned an empty response.'}

        # Parse JSON
        alternatives = extract_json(raw_text)
            
        if isinstance(alternatives, list) and len(alternatives) > 0:
            # Validate basic structure
            validated = [item for item in alternatives if isinstance(item, dict) and 'name' in item and 'brand' in item]
            if validated:
                # Save to cache so future lookups take 0 API calls
                try:
                    SuggestionCache.objects.create(
                        product=product,
                        health_conditions_hash=conditions_hash,
                        suggestions=validated
                    )
                except Exception as db_e:
                    logger.error(f"Failed to cache suggestions: {db_e}")
                
                return {'alternatives': validated, 'error': None}
        
        return {'alternatives': [], 'error': 'AI response could not be parsed as valid JSON array.'}

    except Exception as e:
        logger.exception(f"Groq API call failed: {e}")
        return {'alternatives': [], 'error': f'AI service error: {str(e)}'}