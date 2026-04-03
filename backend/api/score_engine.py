def calculate_base_score(product):
    """Calculate base health score from ingredients and nutrition (JSON fields)."""
    score = 100
    severity_deductions = {'high': -12, 'medium': -7, 'low': -3}
    benefit_additions   = {'high': +8,  'medium': +5,  'low': +2}

    ingredients = product.ingredients if isinstance(product.ingredients, list) else []
    for ingredient in ingredients:
        itype = ingredient.get('type')
        severity = ingredient.get('severity')
        if itype == 'harmful':
            score += severity_deductions.get(severity, -5)
        elif itype == 'beneficial':
            score += benefit_additions.get(severity, +3)

    nutrition = product.nutrition if isinstance(product.nutrition, dict) else {}
    if nutrition.get('sugar', 0) > 20:       score -= 10
    if nutrition.get('sodium', 0) > 800:     score -= 10
    if nutrition.get('saturated_fat', 0) > 5: score -= 8
    if nutrition.get('calories', 0) > 450:   score -= 5
    if nutrition.get('fiber', 0) > 3:        score += 8
    if nutrition.get('protein', 0) > 10:     score += 5

    return max(0, min(100, score))


def apply_condition_penalties(base_score, product, conditions):
    """Apply health condition-specific deductions."""
    ingredients = product.ingredients if isinstance(product.ingredients, list) else []
    ingredient_names = [i.get('name', '').lower() for i in ingredients]
    nutrition = product.nutrition if isinstance(product.nutrition, dict) else {}
    penalties = {}

    CONDITION_RULES = {
        'thyroid': {
            'triggers': ['soy', 'iodized salt', 'goitrogen'],
            'penalty': -15
        },
        'diabetes': {
            'triggers': ['sugar', 'refined flour', 'maida', 'high fructose', 'glucose syrup'],
            'nutrition_check': lambda n: n.get('sugar', 0) > 15,
            'penalty': -20
        },
        'hypertension': {
            'triggers': ['msg', 'monosodium glutamate', 'sodium', 'salt'],
            'nutrition_check': lambda n: n.get('sodium', 0) > 600,
            'penalty': -18
        },
        'asthma': {
            'triggers': ['sulfite', 'tartrazine', 'sodium benzoate', 'artificial color'],
            'penalty': -15
        },
        'obesity': {
            'triggers': ['saturated fat', 'trans fat', 'sugar', 'high fructose'],
            'nutrition_check': lambda n: n.get('calories', 0) > 400 and n.get('saturated_fat', 0) > 4,
            'penalty': -12
        },
        'heart_disease': {
            'triggers': ['trans fat', 'hydrogenated', 'palm oil', 'saturated fat'],
            'nutrition_check': lambda n: n.get('saturated_fat', 0) > 4,
            'penalty': -20
        },
        'digestive': {
            'triggers': ['artificial sweetener', 'lactose', 'sorbitol', 'high fat'],
            'penalty': -10
        },
        'kidney': {
            'triggers': ['sodium', 'potassium chloride', 'phosphate', 'phosphoric acid'],
            'nutrition_check': lambda n: n.get('sodium', 0) > 500,
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
