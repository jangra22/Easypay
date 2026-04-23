import os
import json
import re
from django.conf import settings
from google import genai
from google.genai import types

def extract_json_array(text):
    """Safely extract a JSON array from a string, ignoring markdown or conversational text."""
    try:
        # Find the first '[' and the last ']'
        start_idx = text.find('[')
        end_idx = text.rfind(']')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = text[start_idx:end_idx + 1]
            return json.loads(json_str)
    except Exception:
        pass
    return None

def get_healthier_alternatives(product, conditions, current_score):
    """Call Gemini API and return 3 healthier product alternatives."""
    api_key_str = settings.GEMINI_API_KEY
    if not api_key_str:
        return {'alternatives': [], 'error': 'API_KEY_INVALID: Please add GEMINI_API_KEY in .env'}
        
    client = genai.Client(api_key=api_key_str)

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

    models_to_try = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash-latest', 'gemini-1.5-pro']
    
    last_error = None
    for model_name in models_to_try:
        try:
            print(f"Trying model: {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2, 
                    max_output_tokens=1000,
                    response_mime_type="application/json"
                )
            )
            
            raw_text = response.text
            if not raw_text:
                continue # Try next model if empty response
                
            print(f"GEMINI SUCCESS ({model_name}):", raw_text)
            
            try:
                alternatives = json.loads(raw_text)
                return {'alternatives': alternatives, 'error': None}
            except json.JSONDecodeError:
                extracted = extract_json_array(raw_text)
                if extracted:
                    return {'alternatives': extracted, 'error': None}
                
        except Exception as e:
            error_str = str(e)
            print(f"GEMINI EXCEPTION ({model_name}):", error_str)
            last_error = error_str
            # If the error is a 429 Quota Exceeded with limit > 0, we should stop and wait. 
            # But if limit is 0, it means the model is locked, so we try the next one.
            if "RESOURCE_EXHAUSTED" in error_str and "limit: 0" not in error_str:
                return {'alternatives': [], 'error': 'You have exceeded your free tier rate limit (Too many requests per minute). Please wait 30 seconds and try again.'}

    # If all models failed
    return {'alternatives': [], 'error': f'AI models unavailable on this free tier account. Last error: {last_error}'}

