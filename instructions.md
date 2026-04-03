# HealthScan App — Full-Stack Project Instructions

## What We Are Building

A full-stack mobile-first web application called **HealthScan** with:

- A **Django REST API backend** that handles all business logic, product data, health scoring, disease mapping, and Gemini AI calls
- A **React (Vite) frontend** that handles UI, barcode scanning, and communicates with the Django backend via REST API calls

## Architecture Overview

```
[React Frontend — Vite]
        ↓ HTTP API calls (fetch/axios)
[Django REST Framework Backend]
        ├── Product Database (Django ORM + SQLite for dev)
        ├── Health Score Engine (Python)
        ├── Disease Mapping Engine (Python)
        └── Gemini API Proxy (Python → Gemini API)
```

The frontend NEVER calls Gemini directly. All AI calls go through the Django backend, keeping the API key secure on the server side.

## Project Structure

```
healthscan/                          ← root workspace
├── instructions.md
├── rules.md
│
├── backend/                         ← Django project
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                         ← GEMINI_API_KEY, SECRET_KEY, DEBUG
│   ├── healthscan_project/          ← Django project config
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── api/                         ← Django app
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py                ← Product, Ingredient, NutritionInfo models
│       ├── serializers.py           ← DRF serializers
│       ├── urls.py                  ← API route definitions
│       ├── views.py                 ← API view logic
│       ├── score_engine.py          ← Health score calculator
│       ├── disease_mapper.py        ← Ingredient → disease mapping
│       ├── gemini_service.py        ← Gemini API integration
│       └── management/
│           └── commands/
│               └── seed_products.py ← Django management command to seed DB
│
└── frontend/                        ← React + Vite project
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── services/
        │   └── api.js               ← All fetch calls to Django backend
        └── screens/
            ├── WelcomeScreen.jsx
            ├── HealthProfileScreen.jsx
            ├── ScannerScreen.jsx
            ├── ResultsScreen.jsx
            ├── HistoryScreen.jsx
            └── AboutScreen.jsx
```

---

## BACKEND — Django REST Framework

### Setup & Dependencies

`requirements.txt` must include:

```
django>=4.2
djangorestframework>=3.14
django-cors-headers>=4.3
python-dotenv>=1.0
google-generativeai>=0.5
```

### Django Settings (`settings.py`)

Key configurations:

```python
INSTALLED_APPS = [
    ...
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be FIRST
    'django.middleware.common.CommonMiddleware',
    ...
]

# Allow React frontend to call Django
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
]
CORS_ALLOW_ALL_ORIGINS = True  # For development only

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
}

# Load env vars
from dotenv import load_dotenv
load_dotenv()
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
```

---

### Django Models (`api/models.py`)

```python
from django.db import models

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('snack', 'Snack'),
        ('beverage', 'Beverage'),
        ('dairy', 'Dairy'),
        ('cereal', 'Cereal'),
        ('instant_food', 'Instant Food'),
        ('chocolate', 'Chocolate'),
        ('spread', 'Spread'),
    ]
    barcode        = models.CharField(max_length=50, unique=True, db_index=True)
    name           = models.CharField(max_length=200)
    brand          = models.CharField(max_length=100)
    category       = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    emoji          = models.CharField(max_length=10, default='🍴')
    base_score     = models.IntegerField(default=50)

    def __str__(self):
        return f"{self.brand} — {self.name}"


class Ingredient(models.Model):
    TYPE_CHOICES = [
        ('harmful', 'Harmful'),
        ('beneficial', 'Beneficial'),
        ('neutral', 'Neutral'),
    ]
    SEVERITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ingredients')
    name     = models.CharField(max_length=200)
    type     = models.CharField(max_length=20, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, blank=True)
    reason   = models.TextField()

    def __str__(self):
        return f"{self.name} ({self.type})"


class NutritionInfo(models.Model):
    product       = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='nutrition')
    calories      = models.FloatField(default=0)
    sugar         = models.FloatField(default=0)
    sodium        = models.FloatField(default=0)
    fat           = models.FloatField(default=0)
    saturated_fat = models.FloatField(default=0)
    fiber         = models.FloatField(default=0)
    protein       = models.FloatField(default=0)
    carbs         = models.FloatField(default=0)
```

---

### API Endpoints (`api/urls.py`)

```python
from django.urls import path
from . import views

urlpatterns = [
    # Product lookup by barcode
    path('products/barcode/<str:barcode>/', views.ProductByBarcodeView.as_view()),

    # All products (for the supported products list)
    path('products/', views.ProductListView.as_view()),

    # Personalized health score calculation
    path('score/', views.CalculateScoreView.as_view()),

    # Disease warnings for a product + user conditions
    path('warnings/', views.DiseaseWarningsView.as_view()),

    # Gemini-powered alternatives
    path('alternatives/', views.HealthierAlternativesView.as_view()),
]
```

Main project `urls.py`:

```python
path('api/', include('api.urls')),
```

---

### API Views (`api/views.py`)

#### GET `/api/products/barcode/<barcode>/`

Returns full product data for a given barcode.

- If found: return product + ingredients + nutrition as JSON
- If not found: return `{"error": "Product not found", "supported_barcodes": [...]}` with HTTP 404

#### GET `/api/products/`

Returns list of all products (id, barcode, name, brand, category, emoji only — no ingredients).
Used for the "supported products" helper list in the scanner screen.

#### POST `/api/score/`

Request body:

```json
{
  "barcode": "8901030865213",
  "conditions": ["diabetes", "hypertension"]
}
```

Response:

```json
{
  "base_score": 45,
  "personalized_score": 18,
  "score_breakdown": {
    "harmful_deductions": -32,
    "beneficial_additions": +15,
    "nutrition_deductions": -8,
    "condition_penalties": {
      "diabetes": -15,
      "hypertension": -20
    }
  },
  "score_label": "Poor",
  "score_color": "red"
}
```

#### POST `/api/warnings/`

Request body:

```json
{
  "barcode": "8901030865213",
  "conditions": ["diabetes", "hypertension"]
}
```

Response:

```json
{
  "triggered_warnings": [
    {
      "condition": "diabetes",
      "triggered": true,
      "reason": "Contains refined flour and MSG which spike blood sugar",
      "triggering_ingredients": ["Maida", "MSG"],
      "user_has_condition": true
    }
  ],
  "overall_safe": false,
  "user_risk_level": "high"
}
```

#### POST `/api/alternatives/`

Request body:

```json
{
  "barcode": "8901030865213",
  "conditions": ["diabetes"],
  "current_score": 18
}
```

Calls Gemini API server-side, returns:

```json
{
  "alternatives": [
    {
      "name": "Whole Wheat Pasta",
      "brand": "Borges",
      "why_healthier": "Made from whole wheat with much lower glycemic index",
      "key_ingredients": ["Whole wheat flour", "Fiber", "Iron"],
      "estimated_score": 72,
      "tip": "Cook al dente to keep glycemic index lower"
    }
  ]
}
```

---

### Score Engine (`api/score_engine.py`)

```python
def calculate_base_score(product):
    """Calculate base health score from ingredients and nutrition."""
    score = 100
    severity_deductions = {'high': -12, 'medium': -7, 'low': -3}
    benefit_additions   = {'high': +8,  'medium': +5,  'low': +2}

    for ingredient in product.ingredients.all():
        if ingredient.type == 'harmful':
            score += severity_deductions.get(ingredient.severity, -5)
        elif ingredient.type == 'beneficial':
            score += benefit_additions.get(ingredient.severity, +3)

    nutrition = product.nutrition
    if nutrition.sugar > 20:       score -= 10
    if nutrition.sodium > 800:     score -= 10
    if nutrition.saturated_fat > 5: score -= 8
    if nutrition.calories > 450:   score -= 5
    if nutrition.fiber > 3:        score += 8
    if nutrition.protein > 10:     score += 5

    return max(0, min(100, score))


def apply_condition_penalties(base_score, product, conditions):
    """Apply health condition-specific deductions."""
    ingredient_names = [i.name.lower() for i in product.ingredients.all()]
    nutrition = product.nutrition
    penalties = {}

    CONDITION_RULES = {
        'thyroid': {
            'triggers': ['soy', 'iodized salt', 'goitrogen'],
            'penalty': -15
        },
        'diabetes': {
            'triggers': ['sugar', 'refined flour', 'maida', 'high fructose', 'glucose syrup'],
            'nutrition_check': lambda n: n.sugar > 15,
            'penalty': -20
        },
        'hypertension': {
            'triggers': ['msg', 'monosodium glutamate', 'sodium', 'salt'],
            'nutrition_check': lambda n: n.sodium > 600,
            'penalty': -18
        },
        'asthma': {
            'triggers': ['sulfite', 'tartrazine', 'sodium benzoate', 'artificial color'],
            'penalty': -15
        },
        'obesity': {
            'triggers': ['saturated fat', 'trans fat', 'sugar', 'high fructose'],
            'nutrition_check': lambda n: n.calories > 400 and n.saturated_fat > 4,
            'penalty': -12
        },
        'heart_disease': {
            'triggers': ['trans fat', 'hydrogenated', 'palm oil', 'saturated fat'],
            'nutrition_check': lambda n: n.saturated_fat > 4,
            'penalty': -20
        },
        'digestive': {
            'triggers': ['artificial sweetener', 'lactose', 'sorbitol', 'high fat'],
            'penalty': -10
        },
        'kidney': {
            'triggers': ['sodium', 'potassium chloride', 'phosphate', 'phosphoric acid'],
            'nutrition_check': lambda n: n.sodium > 500,
            'penalty': -15
        },
        'migraine': {
            'triggers': ['msg', 'caffeine', 'tyramine', 'artificial color', 'nitrate'],
            'penalty': -12
        },
        'lactose_intolerance': {
            'triggers': ['milk', 'lactose', 'whey', 'casein', 'milk solids'],
            'penalty': -20
        },
        'gluten_intolerance': {
            'triggers': ['wheat', 'maida', 'gluten', 'barley', 'wheat flour'],
            'penalty': -20
        },
        'pregnancy': {
            'triggers': ['caffeine', 'artificial sweetener', 'raw additive', 'nitrate'],
            'nutrition_check': lambda n: False,
            'penalty': -15
        },
    }

    score = base_score
    for condition in conditions:
        rule = CONDITION_RULES.get(condition)
        if not rule:
            continue
        triggered = any(
            any(trigger in ing for ing in ingredient_names)
            for trigger in rule['triggers']
        )
        nutrition_triggered = rule.get('nutrition_check', lambda n: False)(nutrition)
        if triggered or nutrition_triggered:
            penalties[condition] = rule['penalty']
            score += rule['penalty']

    return max(0, min(100, score)), penalties


def get_score_label(score):
    if score >= 80: return ('Excellent', 'green')
    if score >= 60: return ('Good', 'yellow')
    if score >= 40: return ('Moderate', 'orange')
    return ('Poor', 'red')
```

---

### Disease Mapper (`api/disease_mapper.py`)

```python
DISEASE_INGREDIENT_MAP = {
    'thyroid': {
        'label': 'Thyroid (Hypo/Hyperthyroidism)',
        'triggers': ['soy', 'iodized salt', 'goitrogen', 'soybean'],
        'explanation': 'These ingredients may interfere with thyroid hormone production or absorption.'
    },
    'diabetes': {
        'label': 'Type 2 Diabetes / High Blood Sugar',
        'triggers': ['sugar', 'refined flour', 'maida', 'glucose syrup', 'high fructose corn syrup', 'dextrose'],
        'explanation': 'High sugar or refined carbohydrate content can spike blood glucose levels.'
    },
    'hypertension': {
        'label': 'High Blood Pressure (Hypertension)',
        'triggers': ['msg', 'monosodium glutamate', 'sodium chloride', 'baking soda', 'sodium benzoate'],
        'explanation': 'High sodium content may elevate blood pressure.'
    },
    'asthma': {
        'label': 'Asthma / Respiratory Issues',
        'triggers': ['sulfite', 'sodium metabisulphite', 'tartrazine', 'artificial color', 'e102', 'e220'],
        'explanation': 'Sulfites and certain artificial colors are known asthma triggers.'
    },
    'obesity': {
        'label': 'Obesity / Weight Management',
        'triggers': ['saturated fat', 'trans fat', 'sugar', 'high fructose', 'palm oil', 'hydrogenated'],
        'explanation': 'High calorie density with excess sugar and fat may contribute to weight gain.'
    },
    'heart_disease': {
        'label': 'Heart Disease / High Cholesterol',
        'triggers': ['trans fat', 'hydrogenated oil', 'palm oil', 'saturated fat', 'cholesterol'],
        'explanation': 'Trans fats and saturated fats raise bad cholesterol and increase cardiovascular risk.'
    },
    'digestive': {
        'label': 'Stomach / Digestive Problems',
        'triggers': ['artificial sweetener', 'sorbitol', 'lactose', 'high fat', 'acesulfame'],
        'explanation': 'Artificial sweeteners and high fat content may cause digestive discomfort.'
    },
    'kidney': {
        'label': 'Kidney Disease',
        'triggers': ['sodium', 'potassium chloride', 'phosphate', 'phosphoric acid', 'calcium phosphate'],
        'explanation': 'High sodium and phosphate levels place strain on kidneys.'
    },
    'migraine': {
        'label': 'Headache / Migraine',
        'triggers': ['msg', 'caffeine', 'artificial color', 'sodium nitrate', 'tyramine', 'aspartame'],
        'explanation': 'MSG, caffeine, and certain additives are well-known migraine triggers.'
    },
    'lactose_intolerance': {
        'label': 'Lactose Intolerance',
        'triggers': ['milk', 'lactose', 'whey', 'casein', 'milk solids', 'cream', 'butter'],
        'explanation': 'Contains dairy-derived ingredients that lactose-intolerant individuals cannot digest.'
    },
    'gluten_intolerance': {
        'label': 'Gluten Intolerance / Celiac Disease',
        'triggers': ['wheat', 'maida', 'gluten', 'barley', 'wheat flour', 'semolina', 'rye'],
        'explanation': 'Contains gluten-containing grains that trigger immune reactions in celiac patients.'
    },
    'pregnancy': {
        'label': 'Pregnancy',
        'triggers': ['caffeine', 'artificial sweetener', 'sodium nitrate', 'raw additive', 'aspartame'],
        'explanation': 'Certain additives and high caffeine may not be recommended during pregnancy.'
    },
}


def get_warnings(product, user_conditions):
    """Map product ingredients to triggered disease warnings."""
    ingredient_names = [i.name.lower() for i in product.ingredients.all()]
    warnings = []

    for condition_key, condition_data in DISEASE_INGREDIENT_MAP.items():
        triggered_ingredients = []
        for trigger in condition_data['triggers']:
            for ing in ingredient_names:
                if trigger in ing:
                    triggered_ingredients.append(ing.title())
                    break

        is_triggered = len(triggered_ingredients) > 0
        user_has_condition = condition_key in user_conditions

        warnings.append({
            'condition': condition_key,
            'label': condition_data['label'],
            'triggered': is_triggered,
            'reason': condition_data['explanation'] if is_triggered else None,
            'triggering_ingredients': list(set(triggered_ingredients)),
            'user_has_condition': user_has_condition,
        })

    triggered = [w for w in warnings if w['triggered']]
    user_at_risk = any(w['user_has_condition'] and w['triggered'] for w in warnings)

    return {
        'triggered_warnings': triggered,
        'all_warnings': warnings,
        'overall_safe': len(triggered) == 0,
        'user_risk_level': 'high' if user_at_risk else 'low',
    }
```

---

### Gemini Service (`api/gemini_service.py`)

````python
import os
import json
import google.generativeai as genai
from django.conf import settings


def get_healthier_alternatives(product, conditions, current_score):
    """Call Gemini API and return 3 healthier product alternatives."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')

    harmful_ings = [
        i.name for i in product.ingredients.all() if i.type == 'harmful'
    ]
    conditions_str = ', '.join(conditions) if conditions else 'none'

    prompt = f"""
You are a certified nutritionist and food scientist AI.

A user with these health conditions: {conditions_str}
scanned this product:
- Name: {product.name} by {product.brand}
- Category: {product.category}
- Harmful ingredients found: {', '.join(harmful_ings)}
- Health score: {current_score}/100

Suggest exactly 3 healthier alternatives that:
1. Belong to the same food category ({product.category})
2. Have a similar taste or purpose to {product.name}
3. Are better suited for someone with: {conditions_str}
4. Are realistically available in India (prefer Indian brands or widely available international brands)

For each alternative provide:
- name: full product name
- brand: brand name
- why_healthier: one clear sentence explaining why it is better
- key_ingredients: array of exactly 3 beneficial ingredients it contains
- estimated_score: realistic health score out of 100
- tip: one short practical tip for buying or using this product

Return ONLY a valid JSON array. No markdown, no explanation text, just the raw JSON array.
"""

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024,
            )
        )
        raw = response.text.strip()
        # Strip any markdown code fences if present
        raw = raw.replace('```json', '').replace('```', '').strip()
        alternatives = json.loads(raw)
        return {'alternatives': alternatives, 'error': None}
    except json.JSONDecodeError:
        return {'alternatives': [], 'error': 'AI response could not be parsed. Please try again.'}
    except Exception as e:
        return {'alternatives': [], 'error': f'AI service unavailable: {str(e)}'}
````

---

### Database Seeder (`api/management/commands/seed_products.py`)

Create a Django management command that seeds the database with all 13 products:

```python
from django.core.management.base import BaseCommand
from api.models import Product, Ingredient, NutritionInfo

class Command(BaseCommand):
    help = 'Seed the database with HealthScan product data'

    def handle(self, *args, **kwargs):
        # Clear existing data
        Product.objects.all().delete()

        products_data = [
            {
                'barcode': '8901030865213',
                'name': 'Maggi 2-Minute Noodles',
                'brand': 'Nestle India',
                'category': 'instant_food',
                'emoji': '🍜',
                'base_score': 28,
                'ingredients': [
                    {'name': 'Maida (Refined Wheat Flour)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Highly refined flour with no fiber, causes blood sugar spikes'},
                    {'name': 'MSG (Monosodium Glutamate)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Flavor enhancer linked to headaches, hypertension and obesity'},
                    {'name': 'Sodium (High)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Very high sodium content linked to hypertension and kidney strain'},
                    {'name': 'Palm Oil', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'High in saturated fats, raises LDL cholesterol'},
                    {'name': 'Artificial Flavors', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Synthetic additives with limited nutritional value'},
                    {'name': 'Iron', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Essential mineral that supports red blood cell production'},
                    {'name': 'Vitamin B2', 'type': 'beneficial', 'severity': 'low',
                     'reason': 'Supports energy metabolism and cell growth'},
                    {'name': 'Protein', 'type': 'beneficial', 'severity': 'low',
                     'reason': 'Small amount of protein from wheat'},
                ],
                'nutrition': {'calories': 388, 'sugar': 2, 'sodium': 1050, 'fat': 14,
                              'saturated_fat': 6.5, 'fiber': 1.5, 'protein': 8, 'carbs': 56}
            },
            {
                'barcode': '8902080002879',
                'name': 'Lays Classic Salted',
                'brand': 'PepsiCo India',
                'category': 'snack',
                'emoji': '🍟',
                'base_score': 22,
                'ingredients': [
                    {'name': 'Potatoes', 'type': 'neutral', 'severity': 'low',
                     'reason': 'Base ingredient — natural but deep fried'},
                    {'name': 'Refined Vegetable Oil', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Deep frying creates trans fats and oxidized lipids'},
                    {'name': 'High Sodium Salt', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Excessive sodium raises blood pressure and causes water retention'},
                    {'name': 'Acrylamide (from frying)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Carcinogenic compound formed when starchy foods are fried at high heat'},
                    {'name': 'Artificial Flavor', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Synthetic additives with no nutritional benefit'},
                    {'name': 'Potassium', 'type': 'beneficial', 'severity': 'low',
                     'reason': 'From potatoes — supports muscle and nerve function'},
                    {'name': 'Vitamin C', 'type': 'beneficial', 'severity': 'low',
                     'reason': 'Trace amounts from potatoes'},
                ],
                'nutrition': {'calories': 536, 'sugar': 0.5, 'sodium': 618, 'fat': 34,
                              'saturated_fat': 9, 'fiber': 3.8, 'protein': 5.3, 'carbs': 53}
            },
            {
                'barcode': '8901207003997',
                'name': 'Real Fruit Power Mixed Fruit',
                'brand': 'Dabur',
                'category': 'beverage',
                'emoji': '🧃',
                'base_score': 38,
                'ingredients': [
                    {'name': 'Added Sugar', 'type': 'harmful', 'severity': 'high',
                     'reason': 'High added sugar contributes to obesity and diabetes'},
                    {'name': 'Sodium Benzoate (Preservative)', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Preservative that may trigger allergic reactions and hyperactivity'},
                    {'name': 'Artificial Flavors', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Synthetic additives masking low fruit content'},
                    {'name': 'Vitamin C (Ascorbic Acid)', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Antioxidant that boosts immunity and aids iron absorption'},
                    {'name': 'Vitamin A', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Essential for vision, immune function and skin health'},
                    {'name': 'Natural Fruit Pulp', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Provides some natural vitamins and antioxidants'},
                ],
                'nutrition': {'calories': 55, 'sugar': 12, 'sodium': 20, 'fat': 0,
                              'saturated_fat': 0, 'fiber': 0.2, 'protein': 0.3, 'carbs': 13.5}
            },
            {
                'barcode': '8901063019249',
                'name': 'Amul Taaza Toned Milk',
                'brand': 'Amul',
                'category': 'dairy',
                'emoji': '🥛',
                'base_score': 78,
                'ingredients': [
                    {'name': 'Calcium', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Essential for strong bones, teeth and muscle function'},
                    {'name': 'Protein (Casein & Whey)', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Complete protein with all essential amino acids'},
                    {'name': 'Vitamin D', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Critical for calcium absorption and immune health'},
                    {'name': 'Vitamin B12', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Essential for nerve function and red blood cell formation'},
                    {'name': 'Lactose', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Natural milk sugar — problematic for lactose intolerant individuals'},
                    {'name': 'Saturated Fat (Low)', 'type': 'neutral', 'severity': 'low',
                     'reason': 'Toned milk has reduced fat compared to full cream'},
                ],
                'nutrition': {'calories': 58, 'sugar': 4.8, 'sodium': 44, 'fat': 3,
                              'saturated_fat': 1.9, 'fiber': 0, 'protein': 3.2, 'carbs': 4.9}
            },
            {
                'barcode': '8901719114014',
                'name': 'Parle-G Original Gluco Biscuits',
                'brand': 'Parle',
                'category': 'snack',
                'emoji': '🍪',
                'base_score': 30,
                'ingredients': [
                    {'name': 'Refined Wheat Flour (Maida)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Highly refined flour stripped of all fiber and nutrients'},
                    {'name': 'Sugar', 'type': 'harmful', 'severity': 'high',
                     'reason': 'High sugar content leads to blood sugar spikes and insulin resistance'},
                    {'name': 'Hydrogenated Vegetable Fat', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Contains trans fats that raise LDL cholesterol and increase heart disease risk'},
                    {'name': 'Artificial Flavors', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Synthetic vanilla flavoring with no nutritional value'},
                    {'name': 'Iron (Added)', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Fortification adds iron to support red blood cell production'},
                    {'name': 'Vitamin B1 (Thiamine)', 'type': 'beneficial', 'severity': 'low',
                     'reason': 'Added vitamin supports energy metabolism'},
                ],
                'nutrition': {'calories': 462, 'sugar': 22, 'sodium': 370, 'fat': 12,
                              'saturated_fat': 5.5, 'fiber': 1.2, 'protein': 6.7, 'carbs': 75}
            },
            {
                'barcode': '8901016002021',
                'name': 'Britannia Marie Gold Biscuits',
                'brand': 'Britannia',
                'category': 'snack',
                'emoji': '🍪',
                'base_score': 42,
                'ingredients': [
                    {'name': 'Wheat Flour', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Mostly refined flour with low fiber content'},
                    {'name': 'Sugar', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Added sugar — better than Parle-G but still significant'},
                    {'name': 'Edible Vegetable Oil', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Partially hydrogenated — may contain some trans fats'},
                    {'name': 'Calcium', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Fortified with calcium for bone health'},
                    {'name': 'Iron', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Added iron helps prevent anaemia'},
                    {'name': 'Vitamin A', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Added vitamin A supports vision and immune function'},
                    {'name': 'Folic Acid', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Essential B-vitamin especially important during pregnancy'},
                ],
                'nutrition': {'calories': 420, 'sugar': 14, 'sodium': 360, 'fat': 9.5,
                              'saturated_fat': 4.5, 'fiber': 2.5, 'protein': 8, 'carbs': 71}
            },
            {
                'barcode': '8906001200028',
                'name': "Kellogg's Chocos",
                'brand': "Kellogg's",
                'category': 'cereal',
                'emoji': '🌾',
                'base_score': 32,
                'ingredients': [
                    {'name': 'Sugar (High)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Very high sugar content — one of the first ingredients, bad for children'},
                    {'name': 'Refined Flour', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Low fiber refined grain base despite the "whole grain" marketing'},
                    {'name': 'Cocoa Solids', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Only 2.6% cocoa — mostly sugar and flavoring'},
                    {'name': 'Artificial Chocolate Flavor', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Synthetic flavoring to simulate chocolate taste'},
                    {'name': 'Iron', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Fortified with iron to support children\'s development'},
                    {'name': 'Vitamin B Complex', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'B vitamins support energy metabolism and brain function'},
                    {'name': 'Calcium', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Supports bone development in growing children'},
                ],
                'nutrition': {'calories': 385, 'sugar': 35, 'sodium': 290, 'fat': 3.5,
                              'saturated_fat': 1.2, 'fiber': 3, 'protein': 6.5, 'carbs': 82}
            },
            {
                'barcode': '9002490100070',
                'name': 'Red Bull Energy Drink',
                'brand': 'Red Bull',
                'category': 'beverage',
                'emoji': '⚡',
                'base_score': 18,
                'ingredients': [
                    {'name': 'Caffeine (High — 80mg/can)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'High caffeine causes anxiety, palpitations, and disrupts sleep'},
                    {'name': 'Sugar (27g/can)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Extremely high sugar contributes to diabetes and weight gain'},
                    {'name': 'Sodium Citrate', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Acidifying agent that may cause gastrointestinal irritation'},
                    {'name': 'Artificial Colors', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Synthetic colors linked to hyperactivity and allergic reactions'},
                    {'name': 'Taurine', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Amino acid that supports cardiovascular health and athletic performance'},
                    {'name': 'Vitamin B3 (Niacin)', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Supports energy production and brain function'},
                    {'name': 'Vitamin B6', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Essential for protein metabolism and immune function'},
                ],
                'nutrition': {'calories': 112, 'sugar': 27, 'sodium': 105, 'fat': 0,
                              'saturated_fat': 0, 'fiber': 0, 'protein': 0, 'carbs': 28}
            },
            {
                'barcode': '5449000000996',
                'name': 'Coca-Cola Classic',
                'brand': 'Coca-Cola',
                'category': 'beverage',
                'emoji': '🥤',
                'base_score': 12,
                'ingredients': [
                    {'name': 'High Fructose Corn Syrup / Sugar', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Rapidly absorbed sugar directly linked to obesity and type 2 diabetes'},
                    {'name': 'Phosphoric Acid', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Erodes tooth enamel and may interfere with calcium absorption'},
                    {'name': 'Caffeine (34mg/can)', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Stimulant that causes dependency and disrupts sleep'},
                    {'name': 'Caramel Color (E150d)', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Contains 4-MEI, a potential carcinogen at high doses'},
                    {'name': 'Carbonated Water', 'type': 'neutral', 'severity': 'low',
                     'reason': 'Adds fizz — not harmful in itself'},
                    {'name': 'Natural Flavors', 'type': 'neutral', 'severity': 'low',
                     'reason': 'The famous "secret formula" — contributes no nutrition'},
                ],
                'nutrition': {'calories': 42, 'sugar': 10.6, 'sodium': 10, 'fat': 0,
                              'saturated_fat': 0, 'fiber': 0, 'protein': 0, 'carbs': 10.6}
            },
            {
                'barcode': '8901963039013',
                'name': 'Tropicana 100% Orange Juice',
                'brand': 'PepsiCo',
                'category': 'beverage',
                'emoji': '🍊',
                'base_score': 55,
                'ingredients': [
                    {'name': 'Natural Orange Juice', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Real fruit juice provides natural vitamins and antioxidants'},
                    {'name': 'Vitamin C (Natural)', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'High natural Vitamin C content boosts immunity'},
                    {'name': 'Folate', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Essential B-vitamin important for cell division and DNA synthesis'},
                    {'name': 'Potassium', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Supports heart health and blood pressure regulation'},
                    {'name': 'Natural Sugars (Fructose)', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Even natural fruit sugars spike blood sugar when juice form (no fiber)'},
                    {'name': 'No Added Fiber', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Juicing removes fiber — eating the whole fruit is always healthier'},
                ],
                'nutrition': {'calories': 45, 'sugar': 9, 'sodium': 1, 'fat': 0.2,
                              'saturated_fat': 0, 'fiber': 0.2, 'protein': 0.7, 'carbs': 10.4}
            },
            {
                'barcode': '8901030015440',
                'name': 'Quaker Oats Instant',
                'brand': 'PepsiCo',
                'category': 'cereal',
                'emoji': '🌾',
                'base_score': 82,
                'ingredients': [
                    {'name': 'Whole Grain Oats', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Rich in beta-glucan fiber that lowers cholesterol and stabilizes blood sugar'},
                    {'name': 'Beta-Glucan Fiber', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Clinically proven to reduce LDL cholesterol and improve gut health'},
                    {'name': 'Protein (Plant-based)', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Good quality plant protein for sustained energy and muscle repair'},
                    {'name': 'Iron', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Natural iron content prevents anaemia'},
                    {'name': 'Magnesium', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Supports muscle function, nerve health and energy production'},
                    {'name': 'Processing (Rolled/Instant)', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Processing slightly raises glycemic index compared to steel-cut oats'},
                ],
                'nutrition': {'calories': 379, 'sugar': 1.1, 'sodium': 49, 'fat': 6.9,
                              'saturated_fat': 1.3, 'fiber': 10, 'protein': 13, 'carbs': 67}
            },
            {
                'barcode': '7613035898226',
                'name': 'KitKat Milk Chocolate',
                'brand': 'Nestle',
                'category': 'chocolate',
                'emoji': '🍫',
                'base_score': 25,
                'ingredients': [
                    {'name': 'Sugar (High)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Sugar is the first ingredient — high content risks diabetes and obesity'},
                    {'name': 'Refined Wheat Flour', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Low-fiber refined flour in the wafer contributes to blood sugar spikes'},
                    {'name': 'Palm Oil', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Saturated fat raises LDL cholesterol levels'},
                    {'name': 'Artificial Vanillin', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Synthetic vanilla substitute with no nutritional value'},
                    {'name': 'Cocoa Solids', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Real cocoa contains flavonoids that support heart and brain health'},
                    {'name': 'Milk Solids', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Provides some calcium and protein'},
                    {'name': 'Iron', 'type': 'beneficial', 'severity': 'low',
                     'reason': 'Trace iron from cocoa content'},
                ],
                'nutrition': {'calories': 515, 'sugar': 53, 'sodium': 75, 'fat': 26.5,
                              'saturated_fat': 16, 'fiber': 1.5, 'protein': 6.3, 'carbs': 63}
            },
            {
                'barcode': '3017620422003',
                'name': 'Nutella Hazelnut Spread',
                'brand': 'Ferrero',
                'category': 'spread',
                'emoji': '🫙',
                'base_score': 20,
                'ingredients': [
                    {'name': 'Sugar (First Ingredient)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Sugar is 56% of Nutella — extremely high amount causes metabolic damage'},
                    {'name': 'Palm Oil', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Second ingredient after sugar — very high saturated fat content'},
                    {'name': 'Hazelnuts (Only 13%)', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Heart-healthy monounsaturated fats and Vitamin E — but only 13% of product'},
                    {'name': 'Cocoa (Only 7.4%)', 'type': 'beneficial', 'severity': 'low',
                     'reason': 'Small amount of flavonoids from cocoa'},
                    {'name': 'Skimmed Milk Powder', 'type': 'beneficial', 'severity': 'low',
                     'reason': 'Provides small amounts of calcium and protein'},
                    {'name': 'Soy Lecithin (Emulsifier)', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Derived from soy — problematic for thyroid patients and soy-allergic individuals'},
                    {'name': 'Vanillin (Artificial)', 'type': 'harmful', 'severity': 'low',
                     'reason': 'Synthetic flavor additive'},
                ],
                'nutrition': {'calories': 539, 'sugar': 56.3, 'sodium': 41, 'fat': 30.9,
                              'saturated_fat': 10.6, 'fiber': 3.4, 'protein': 6.3, 'carbs': 57.5}
            },
        ]

        for data in products_data:
            product = Product.objects.create(
                barcode=data['barcode'],
                name=data['name'],
                brand=data['brand'],
                category=data['category'],
                emoji=data['emoji'],
                base_score=data['base_score'],
            )
            for ing in data['ingredients']:
                Ingredient.objects.create(product=product, **ing)
            NutritionInfo.objects.create(product=product, **data['nutrition'])

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded {len(products_data)} products!'
        ))
```

---

### Backend Setup Commands

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_products   # Run the seeder
python manage.py runserver       # Starts at http://localhost:8000
```
