import os
import json
import logging
import requests
import re
from django.conf import settings

logger = logging.getLogger(__name__)

def extract_json(text):
    """Safely extract a JSON array from a string."""
    try:
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
    Call Gemini API and return 3 healthier product alternatives.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY'))
    if not api_key:
        return {'alternatives': [], 'error': 'API_KEY_INVALID: Please add GEMINI_API_KEY in .env'}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"

    # Prepare ingredients text safely
    ingredients = product.ingredients if isinstance(product.ingredients, list) else []
    harmful_ings = [
        i.get('name', 'Unknown') for i in ingredients 
        if isinstance(i, dict) and i.get('type') == 'harmful'
    ]
    
    conditions_str = ', '.join(conditions) if conditions else 'none'

    # Simple paragraph prompt as requested
    prompt = (
        f"Act as a nutritionist. Suggest exactly 3 healthier food alternatives to '{product.name} ({product.brand})' "
        f"in the category '{product.category}'. The user has these health conditions: {conditions_str}. "
        f"The original product contains these bad ingredients: {', '.join(harmful_ings) if harmful_ings else 'none'}. "
        f"The original product score is {current_score} out of 100. Find products with a higher score. "
        f"You MUST reply with ONLY a valid JSON array. Do not add any greeting or markdown formatting. "
        f"Use this exact structure: [ {{\"name\": \"Name\", \"brand\": \"Brand\", \"why_healthier\": \"Reason\", \"estimated_score\": 90}} ]"
    )

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2
        }
    }

    try:
        logger.info("Calling Gemini API...")
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        
        data = response.json()
        raw_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        if not raw_text:
            return {'alternatives': [], 'error': 'AI returned an empty response.'}
            
        # Parse JSON
        try:
            alternatives = json.loads(raw_text)
        except json.JSONDecodeError:
            alternatives = extract_json(raw_text)
            
        if isinstance(alternatives, list) and len(alternatives) > 0:
            # Validate basic structure
            validated = [item for item in alternatives if isinstance(item, dict) and 'name' in item and 'brand' in item]
            if validated:
                return {'alternatives': validated, 'error': None}
                
        return {'alternatives': [], 'error': 'AI response could not be parsed as valid JSON array.'}

    except Exception as e:
        logger.exception("Gemini API Error")
        return {'alternatives': [], 'error': f'AI service error: {str(e)}'}