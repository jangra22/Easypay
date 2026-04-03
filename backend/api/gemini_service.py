import os
import json
from django.conf import settings
from google import genai
from google.genai import types

def get_healthier_alternatives(product, conditions, current_score):
    """Call Gemini API and return 3 healthier product alternatives using Gemini 2.5 flash."""
    # Ensure api_key string is fetched 
    api_key_str = settings.GEMINI_API_KEY
    if not api_key_str:
        return {'alternatives': [], 'error': 'API_KEY_INVALID: Please add GEMINI_API_KEY in .env'}
        
    client = genai.Client(api_key=api_key_str)

    ingredients = product.ingredients if isinstance(product.ingredients, list) else []
    harmful_ings = [
        i.get('name', 'Unknown') for i in ingredients if i.get('type') == 'harmful'
    ]
    
    conditions_str = ', '.join(conditions) if conditions else 'none'

    # Optimized prompt to use minimum input tokens and drop unused fields (like key_ingredients, tip)
    prompt = f"Find 3 healthier food alternatives to '{product.name} ({product.brand})' in category '{product.category}'. User conditions: {conditions_str}. Harmful items: {', '.join(harmful_ings)}. Target score > {current_score}. Return ONLY a JSON array with exactly 3 objects. Keys: 'name', 'brand', 'why_healthier' (max 10 words), 'estimated_score' (number > {current_score})."

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.5, # Lower temperature for strictly formatted responses
                max_output_tokens=300, # Much smaller output limit
                response_mime_type="application/json" # Directly requests valid JSON format
            )
        )
        raw = response.text.strip()
        # Fallback in case the model ignores mime_type and outputs markdown
        if raw.startswith("```"):
            raw = raw.replace('```json', '').replace('```', '').strip()
            
        alternatives = json.loads(raw)
        return {'alternatives': alternatives, 'error': None}
    except json.JSONDecodeError:
        return {'alternatives': [], 'error': 'AI response could not be parsed. Please try again.'}
    except Exception as e:
        return {'alternatives': [], 'error': f'AI service unavailable: {str(e)}'}
