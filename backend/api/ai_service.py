# import os
# import json
# import re
# from django.conf import settings
# from openai import OpenAI

# def extract_json_array(text):
#     """Safely extract a JSON array from a string, ignoring markdown or conversational text."""
#     try:
#         start_idx = text.find('[')
#         end_idx = text.rfind(']')
#         if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
#             json_str = text[start_idx:end_idx + 1]
#             return json.loads(json_str)
#     except Exception:
#         pass
#     return None

# def get_healthier_alternatives(product, conditions, current_score):
#     """Call OpenRouter API and return 3 healthier product alternatives."""
#     # We use OPENROUTER_API_KEY from settings/env
#     api_key_str = getattr(settings, 'OPENROUTER_API_KEY', os.getenv('OPENROUTER_API_KEY'))
#     if not api_key_str:
#         return {'alternatives': [], 'error': 'API_KEY_INVALID: Please add OPENROUTER_API_KEY in .env'}
        
#     client = OpenAI(
#         base_url="https://openrouter.ai/api/v1",
#         api_key=api_key_str,
#     )

#     ingredients = product.ingredients if isinstance(product.ingredients, list) else []
#     harmful_ings = [
#         i.get('name', 'Unknown') for i in ingredients if i.get('type') == 'harmful'
#     ]
    
#     conditions_str = ', '.join(conditions) if conditions else 'none'

#     prompt = (
#         f"Act as a nutritionist. Suggest exactly 3 healthier food alternatives to '{product.name} ({product.brand})' "
#         f"in the category '{product.category}'.\n"
#         f"The user has these health conditions: {conditions_str}.\n"
#         f"The original product contains these bad ingredients: {', '.join(harmful_ings)}.\n"
#         f"The original product score is {current_score} out of 100. Find products with a higher score.\n\n"
#         f"You MUST reply with ONLY a valid JSON array. Do not add any greeting or markdown formatting.\n"
#         f"Use this exact structure:\n"
#         f"[\n"
#         f"  {{\"name\": \"Alternative Name\", \"brand\": \"Alternative Brand\", \"why_healthier\": \"Short reason\", \"estimated_score\": 90}}\n"
#         f"]"
#     )

#     try:
#         print("Trying OpenRouter model: meta-llama/llama-3.3-70b-instruct:free ...")
#         response = client.chat.completions.create(
#             model="meta-llama/llama-3.3-70b-instruct:free",
#             messages=[
#                 {"role": "system", "content": "You are a helpful nutrition assistant that outputs purely valid JSON arrays."},
#                 {"role": "user", "content": prompt}
#             ],
#             temperature=0.2,
#             max_tokens=1000
#         )
        
#         raw_text = response.choices[0].message.content
#         if not raw_text:
#             return {'alternatives': [], 'error': 'AI returned an empty response.'}
            
#         print("OPENAI SUCCESS:", raw_text)
        
#         try:
#             alternatives = json.loads(raw_text)
#             return {'alternatives': alternatives, 'error': None}
#         except json.JSONDecodeError:
#             extracted = extract_json_array(raw_text)
#             if extracted:
#                 return {'alternatives': extracted, 'error': None}
#             else:
#                 return {'alternatives': [], 'error': 'AI response could not be parsed as JSON.'}
                
#     except Exception as e:
#         error_str = str(e)
#         print("OPENAI EXCEPTION:", error_str)
#         return {'alternatives': [], 'error': f'AI service unavailable: {error_str}'}
import os
import json
import re
import time
import logging
from django.conf import settings
from openai import OpenAI
from openai import RateLimitError, APIStatusError, APIConnectionError

# Use logger instead of print for production safety
logger = logging.getLogger(__name__)

def safe_extract_json_array(text):
    """
    Attempt to parse JSON. If raw parse fails, search for the first 
    valid top-level JSON object or array in the text ignoring markdown.
    """
    if not text:
        return None
        
    # 1. Try loading the whole string (often works if model obeys rules)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Try to find the first standalone JSON Array or Object
    # Using regex to find balanced brackets/braces is tricky, 
    # but looking for starting '[' or '{' usually suffices.
    text = text.strip()
    first_bracket = None
    
    if text.startswith('['):
        first_bracket = '['
    elif text.startswith('{'):
        first_bracket = '{'
    else:
        # If it starts with text, try to find the first '[' or '{'
        idx_square = text.find('[')
        idx_curly = text.find('{')
        
        if idx_square != -1 and (idx_curly == -1 or idx_square < idx_curly):
            first_bracket = '['
            text = text[idx_square:]
        elif idx_curly != -1:
            first_bracket = '{'
            text = text[idx_curly:]

    if first_bracket:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    return None

def get_healthier_alternatives(product, conditions, current_score, max_retries=3):
    """
    Call OpenRouter API and return 3 healthier product alternatives.
    Includes retry logic for Rate Limits (429) and Network issues.
    """
    api_key_str = getattr(settings, 'OPENROUTER_API_KEY', os.getenv('OPENROUTER_API_KEY'))
    if not api_key_str:
        return {'alternatives': [], 'error': 'API_KEY_INVALID: Please add OPENROUTER_API_KEY in .env'}

    # Allow easy swap of models in settings (default to the free one for now)
    model_name = getattr(settings, 'OPENROUTER_API_MODEL', 'mistralai/mistral-7b-instruct-v0.2:free')

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key_str,
    )

    # --- Defensive Checks for Product Object ---
    if not hasattr(product, 'name') or not hasattr(product, 'brand') or not hasattr(product, 'category'):
        return {'alternatives': [], 'error': 'Invalid product object: missing name, brand, or category'}

    ingredients = product.ingredients if isinstance(product.ingredients, list) else []
    
    harmful_ings = []
    for i in ingredients:
        # Ensure 'i' is a dict before calling .get
        if isinstance(i, dict) and i.get('type') == 'harmful':
            harmful_ings.append(i.get('name', 'Unknown'))
    
    conditions_str = ', '.join(conditions) if conditions else 'none specified'

    prompt = (
        f"Act as a nutritionist. Suggest exactly 3 healthier food alternatives to '{product.name} ({product.brand})' "
        f"in the category '{product.category}'.\n"
        f"The user has these health conditions: {conditions_str}.\n"
        f"The original product contains these bad ingredients: {', '.join(harmful_ings) if harmful_ings else 'none'}.\n"
        f"The original product score is {current_score} out of 100. Find products with a higher score.\n\n"
        f"You MUST reply with ONLY a valid JSON array. Do not add any greeting or markdown formatting.\n"
        f"Use this exact structure:\n"
        f"[\n"
        f"  {{\"name\": \"Alternative Name\", \"brand\": \"Alternative Brand\", \"why_healthier\": \"Short reason\", \"estimated_score\": 90}}\n"
        f"]"
    )

    # --- Retry Logic ---
    last_error = None
    for attempt in range(max_retries):
        try:
            logger.info(f"Trying OpenRouter model: {model_name} (Attempt {attempt + 1}/{max_retries})")
            
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful nutrition assistant that outputs purely valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=1000
            )
            
            raw_text = response.choices[0].message.content
            if not raw_text:
                # Don't retry immediately on empty, might be model issue
                return {'alternatives': [], 'error': 'AI returned an empty response.'}
            
            logger.debug("AI RAW RESPONSE: %s", raw_text[:200]) # Log start of response
            
            # --- Parse Logic ---
            alternatives = safe_extract_json_array(raw_text)

            if isinstance(alternatives, list):
                # Quality Check: Ensure exactly 3 items requested
                if len(alternatives) == 0:
                    return {'alternatives': [], 'error': 'AI returned an empty JSON array.'}
                
                # Strict requirement check (optional)
                if len(alternatives) != 3:
                    # You can choose to log this as a warning instead of error if flexibility is ok
                    logger.warning(f"AI returned {len(alternatives)} items instead of 3.")
                
                # Validate structure roughly (ensure dicts have name/brand)
                validated_list = []
                for item in alternatives:
                    if isinstance(item, dict) and 'name' in item and 'brand' in item:
                        validated_list.append(item)
                
                if len(validated_list) == 0:
                     return {'alternatives': [], 'error': 'AI returned JSON but format is invalid (missing name/brand).'}

                return {'alternatives': validated_list, 'error': None}
            else:
                # Parsing failed, treat as fatal for this attempt (no retry on format issues usually)
                return {'alternatives': [], 'error': 'AI response could not be parsed as JSON.'}
                
        except RateLimitError as e:
            # Specific handling for 429
            wait_time = 2 ** attempt  # 1, 2, 4 seconds
            logger.warning(f"Rate limited (429). Retrying in {wait_time}s. Detail: {str(e)}")
            time.sleep(wait_time)
            last_error = 'Rate limit exceeded. Retrying...'

        except APIConnectionError as e:
            # Network issue, retry
            wait_time = 2 ** attempt
            logger.error(f"Network error: {str(e)}. Retrying in {wait_time}s.")
            time.sleep(wait_time)
            last_error = 'Network error.'

        except APIStatusError as e:
            # Other 4xx/5xx errors (e.g., 500, 401)
            status_code = e.status_code
            logger.error(f"OpenRouter API Error {status_code}: {str(e)}")
            # Do not retry on 4xx Client errors except 429
            if 400 <= status_code < 500 and status_code != 429:
                return {'alternatives': [], 'error': f'API Client Error {status_code}: {str(e)}'}
            else:
                last_error = f'Server Error {status_code}'
                time.sleep(2 ** attempt)

        except Exception as e:
            logger.exception("Unexpected error in get_healthier_alternatives")
            return {'alternatives': [], 'error': f'Unexpected error: {str(e)}'}

    # If loop finishes, we exhausted retries
    return {'alternatives': [], 'error': f'Failed after {max_retries} attempts. Last issue: {last_error}'}