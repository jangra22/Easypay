import os
import json
import re
from django.conf import settings
from openai import OpenAI

def extract_json_array(text):
    """Safely extract a JSON array from a string, ignoring markdown or conversational text."""
    try:
        start_idx = text.find('[')
        end_idx = text.rfind(']')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = text[start_idx:end_idx + 1]
            return json.loads(json_str)
    except Exception:
        pass
    return None

def get_healthier_alternatives(product, conditions, current_score):
    """Call OpenAI API and return 3 healthier product alternatives."""
    # We use OPENAI_API_KEY from settings/env
    api_key_str = getattr(settings, 'OPENAI_API_KEY', os.getenv('OPENAI_API_KEY'))
    if not api_key_str:
        return {'alternatives': [], 'error': 'API_KEY_INVALID: Please add OPENAI_API_KEY in .env'}
        
    client = OpenAI(api_key=api_key_str)

    ingredients = product.ingredients if isinstance(product.ingredients, list) else []
    harmful_ings = [
        i.get('name', 'Unknown') for i in ingredients if i.get('type') == 'harmful'
    ]
    
    conditions_str = ', '.join(conditions) if conditions else 'none'

    prompt = (
        f"Act as a nutritionist. Suggest exactly 3 healthier food alternatives to '{product.name} ({product.brand})' "
        f"in the category '{product.category}'.\n"
        f"The user has these health conditions: {conditions_str}.\n"
        f"The original product contains these bad ingredients: {', '.join(harmful_ings)}.\n"
        f"The original product score is {current_score} out of 100. Find products with a higher score.\n\n"
        f"You MUST reply with ONLY a valid JSON array. Do not add any greeting or markdown formatting.\n"
        f"Use this exact structure:\n"
        f"[\n"
        f"  {{\"name\": \"Alternative Name\", \"brand\": \"Alternative Brand\", \"why_healthier\": \"Short reason\", \"estimated_score\": 90}}\n"
        f"]"
    )

    try:
        print("Trying OpenAI model: gpt-4o-mini...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful nutrition assistant that outputs purely valid JSON arrays."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1000
        )
        
        raw_text = response.choices[0].message.content
        if not raw_text:
            return {'alternatives': [], 'error': 'AI returned an empty response.'}
            
        print("OPENAI SUCCESS:", raw_text)
        
        try:
            alternatives = json.loads(raw_text)
            return {'alternatives': alternatives, 'error': None}
        except json.JSONDecodeError:
            extracted = extract_json_array(raw_text)
            if extracted:
                return {'alternatives': extracted, 'error': None}
            else:
                return {'alternatives': [], 'error': 'AI response could not be parsed as JSON.'}
                
    except Exception as e:
        error_str = str(e)
        print("OPENAI EXCEPTION:", error_str)
        return {'alternatives': [], 'error': f'AI service unavailable: {error_str}'}
