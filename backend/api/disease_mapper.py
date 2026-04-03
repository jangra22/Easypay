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
    """Map product ingredients to triggered disease warnings using JSON data."""
    ingredients = product.ingredients if isinstance(product.ingredients, list) else []
    ingredient_names = [i.get('name', '').lower() for i in ingredients]
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
