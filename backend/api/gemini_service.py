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

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash', # Using 1.5-flash as it is highly stable on free tiers
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2, # Very low temperature for highly deterministic JSON output
                max_output_tokens=1000,
                response_mime_type="application/json"
            )
        )
        
        raw_text = response.text
        if not raw_text:
            return {'alternatives': [], 'error': 'AI returned an empty response. It might have been blocked by safety filters.'}
            
        print("GEMINI RAW RESPONSE:", raw_text) # For debugging in Render logs
        
        # Try direct parse first
        try:
            alternatives = json.loads(raw_text)
            return {'alternatives': alternatives, 'error': None}
        except json.JSONDecodeError:
            # Fallback to regex extraction if the AI added markdown or text
            extracted = extract_json_array(raw_text)
            if extracted:
                return {'alternatives': extracted, 'error': None}
            else:
                return {'alternatives': [], 'error': 'AI response could not be parsed as JSON.'}
                
    except Exception as e:
        print("GEMINI EXCEPTION:", str(e))
        return {'alternatives': [], 'error': f'AI service unavailable: {str(e)}'}

