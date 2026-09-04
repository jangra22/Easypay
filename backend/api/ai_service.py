import os
import json
import logging
import requests
import re
from django.conf import settings

logger = logging.getLogger(__name__)

def extract_json(text):
    """Safely extract a JSON array from a string, handling markdown and raw text."""
    if not text:
        return None
    try:
        # Strip potential markdown formatting
        cleaned = re.sub(r'```(?:json)?\s*', '', text)
        cleaned = re.sub(r'```', '', cleaned).strip()
        
        # Try direct parse
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass

        # Find the first '[' and last ']'
        start = text.find('[')
        end = text.rfind(']')
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end + 1]
            return json.loads(json_str)
    except Exception:
        pass
    return None

def get_healthier_alternatives(product, conditions, current_score):
    """
    Call Groq API and return 3 healthier product alternatives.
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

    # Check Cache
    from .models import SuggestionCache
    try:
        cached = SuggestionCache.objects.filter(product=product, health_conditions_hash=conditions_hash).first()
        if cached:
            logger.info("Serving suggestions from DB Cache")
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
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": groq_model,
        "messages": [
            {
                "role": "system",
                "content": "You are a professional clinical nutritionist. You respond ONLY with raw JSON arrays without markdown wrappers."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 1024,
        "top_p": 1
    }

    try:
        logger.info(f"Calling Groq API with model {groq_model}...")
        response = requests.post(groq_url, json=payload, headers=headers, timeout=15)
        
        # If model is not found or fails, try fallback to active account models
        if response.status_code == 404 or response.status_code == 400:
            fallback_models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "groq/compound-mini"]
            for fb_model in fallback_models:
                if fb_model != payload["model"]:
                    logger.info(f"Retrying Groq API with fallback model {fb_model}...")
                    payload["model"] = fb_model
                    response = requests.post(groq_url, json=payload, headers=headers, timeout=15)
                    if response.status_code == 200:
                        break

        if response.status_code != 200:
            logger.error(f"Groq API returned error status {response.status_code}: {response.text}")
            response.raise_for_status()
        
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
                # Save to cache
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
        logger.exception("Groq API Error")
        return {'alternatives': [], 'error': f'AI service error: {str(e)}'}