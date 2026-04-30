from django.core.management.base import BaseCommand
from api.models import Product


class Command(BaseCommand):
    help = 'Seed products WITHOUT prices (you add prices manually in MongoDB Atlas)'

    def handle(self, *args, **kwargs):
        # Clear existing
        Product.objects.all().delete()

        products = [
            {
                'barcode': '8901030865213',
                'name': 'Maggi 2-Minute Noodles',
                'brand': 'Nestle India',
                'category': 'instant_food',
                'emoji': '🍜',
                'base_score': 28,
                'price': 14.00,
                'ingredients': [
                    {'name': 'Maida (Refined Wheat Flour)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Highly refined flour with no fiber, causes blood sugar spikes'},
                    {'name': 'MSG (Monosodium Glutamate)', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Flavor enhancer linked to headaches, hypertension and obesity'},
                    {'name': 'High Sodium', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Very high sodium content linked to hypertension'},
                    {'name': 'Palm Oil', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'High in saturated fats'},
                    {'name': 'Iron', 'type': 'beneficial', 'severity': 'medium',
                     'reason': 'Essential mineral'},
                ],
                'nutrition': {
                    'calories': 388, 'sugar': 2, 'sodium': 1050, 'salt': 2.6,
                    'fat': 14, 'saturated_fat': 6.5, 'fiber': 1.5, 'protein': 8, 'carbs': 56
                }
            },
            {
                'barcode': '8902080002879',
                'name': 'Lays Classic Salted',
                'brand': 'PepsiCo India',
                'category': 'snack',
                'emoji': '🍟',
                'base_score': 22,
                'price': 20.00,
                'ingredients': [
                    {'name': 'Potatoes', 'type': 'neutral', 'severity': 'low', 'reason': 'Natural base'},
                    {'name': 'Refined Vegetable Oil', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Deep frying creates trans fats'},
                    {'name': 'High Salt', 'type': 'harmful', 'severity': 'high',
                     'reason': 'Excessive sodium'},
                    {'name': 'Potassium', 'type': 'beneficial', 'severity': 'low', 'reason': 'From potatoes'},
                ],
                'nutrition': {'calories': 536, 'sugar': 0.5, 'sodium': 618, 'salt': 1.5, 'fat': 34,
                              'saturated_fat': 9, 'fiber': 3.8, 'protein': 5.3, 'carbs': 53}
            },
            {
                'barcode': '8901207003997',
                'name': 'Real Fruit Power Mixed Fruit',
                'brand': 'Dabur',
                'category': 'beverage',
                'emoji': '🧃',
                'base_score': 38,
                'price': 110.00,
                'ingredients': [
                    {'name': 'Added Sugar', 'type': 'harmful', 'severity': 'high',
                     'reason': 'High added sugar'},
                    {'name': 'Sodium Benzoate', 'type': 'harmful', 'severity': 'medium',
                     'reason': 'Preservative'},
                    {'name': 'Vitamin C', 'type': 'beneficial', 'severity': 'high',
                     'reason': 'Antioxidant'},
                ],
                'nutrition': {'calories': 55, 'sugar': 12, 'sodium': 20, 'salt': 0.05, 'fat': 0,
                              'saturated_fat': 0, 'fiber': 0.2, 'protein': 0.3, 'carbs': 13.5}
            },
            {
                'barcode': '5449000000996',
                'name': 'Coca-Cola Classic',
                'brand': 'Coca-Cola India',
                'category': 'beverage',
                'emoji': '🥤',
                'base_score': 12,
                'price': 40.00,
                'ingredients': [
                    {'name': 'Carbonated Water', 'type': 'neutral', 'severity': 'low', 'reason': 'Base'},
                    {'name': 'High Fructose Corn Syrup', 'type': 'harmful', 'severity': 'high', 'reason': 'Pure liquid sugar, weight gain'},
                    {'name': 'Phosphoric Acid', 'type': 'harmful', 'severity': 'medium', 'reason': 'Bone mineral erosion'},
                    {'name': 'Caffeine', 'type': 'neutral', 'severity': 'low', 'reason': 'Stimulant'},
                    {'name': 'Caramel Colour', 'type': 'harmful', 'severity': 'low', 'reason': 'Synthetic additive'}
                ],
                'nutrition': {
                    'calories': 42, 'sugar': 10.6, 'sodium': 4, 'salt': 0.01,
                    'fat': 0, 'saturated_fat': 0, 'fiber': 0, 'protein': 0, 'carbs': 10.6
                }
            },
            {
                'barcode': '8901491101836',
                'name': 'Kissan Mixed Fruit Jam',
                'brand': 'HUL',
                'category': 'spread',
                'emoji': '🍓',
                'base_score': 32,
                'price': 150.00,
                'ingredients': [
                    {'name': 'Sugar', 'type': 'harmful', 'severity': 'high', 'reason': 'Extremely high sugar content'},
                    {'name': 'Mixed Fruit Pulp', 'type': 'beneficial', 'severity': 'medium', 'reason': 'Fruit content'},
                    {'name': 'Pectin', 'type': 'neutral', 'severity': 'low', 'reason': 'Natural thickener'},
                    {'name': 'Citric Acid', 'type': 'neutral', 'severity': 'low', 'reason': 'Acidity regulator'}
                ],
                'nutrition': {
                    'calories': 285, 'sugar': 68, 'sodium': 15, 'salt': 0.04,
                    'fat': 0, 'saturated_fat': 0, 'fiber': 0.5, 'protein': 0.4, 'carbs': 71
                }
            },
            {
                'barcode': '8901058000108',
                'name': 'Amul Pasteurised Butter',
                'brand': 'Amul',
                'category': 'dairy',
                'emoji': '🧈',
                'base_score': 45,
                'price': 58.00,
                'ingredients': [
                    {'name': 'Milk Fat', 'type': 'neutral', 'severity': 'medium', 'reason': 'Pure dairy fat'},
                    {'name': 'Common Salt', 'type': 'harmful', 'severity': 'medium', 'reason': 'High sodium content'},
                    {'name': 'Annatto', 'type': 'neutral', 'severity': 'low', 'reason': 'Natural color'}
                ],
                'nutrition': {
                    'calories': 722, 'sugar': 0, 'sodium': 830, 'salt': 2.1,
                    'fat': 80, 'saturated_fat': 51, 'fiber': 0, 'protein': 0.5, 'carbs': 0
                }
            },
            {
                'barcode': '8901719113108',
                'name': 'Kellogg’s Corn Flakes',
                'brand': 'Kellogg’s',
                'category': 'cereal',
                'emoji': '🥣',
                'base_score': 58,
                'price': 105.00,
                'ingredients': [
                    {'name': 'Corn Scrit', 'type': 'neutral', 'severity': 'low', 'reason': 'Base grain'},
                    {'name': 'Sugar', 'type': 'harmful', 'severity': 'medium', 'reason': 'Added sugar for taste'},
                    {'name': 'Malt Extract', 'type': 'neutral', 'severity': 'low', 'reason': 'Flavor'},
                    {'name': 'Iodized Salt', 'type': 'harmful', 'severity': 'low', 'reason': 'Added sodium'},
                    {'name': 'Iron', 'type': 'beneficial', 'severity': 'high', 'reason': 'Fortified with iron'}
                ],
                'nutrition': {
                    'calories': 378, 'sugar': 8.5, 'sodium': 785, 'salt': 2.0,
                    'fat': 0.8, 'saturated_fat': 0.4, 'fiber': 2.5, 'protein': 7, 'carbs': 84
                }
            },
            {
                'barcode': '7622201140026',
                'name': 'Cadbury Dairy Milk',
                'brand': 'Mondelez',
                'category': 'chocolate',
                'emoji': '🍫',
                'base_score': 25,
                'price': 45.00,
                'ingredients': [
                    {'name': 'Sugar', 'type': 'harmful', 'severity': 'high', 'reason': 'Primary ingredient is sugar'},
                    {'name': 'Milk Solids', 'type': 'neutral', 'severity': 'low', 'reason': 'Dairy base'},
                    {'name': 'Cocoa Butter', 'type': 'neutral', 'severity': 'low', 'reason': 'Chocolate fat'},
                    {'name': 'Cocoa Solids', 'type': 'beneficial', 'severity': 'medium', 'reason': 'Antioxidants'},
                    {'name': 'Emulsifiers', 'type': 'neutral', 'severity': 'low', 'reason': 'Texture'}
                ],
                'nutrition': {
                    'calories': 530, 'sugar': 57, 'sodium': 150, 'salt': 0.3,
                    'fat': 30, 'saturated_fat': 18, 'fiber': 2, 'protein': 7.5, 'carbs': 60
                }
            },
            {
                'barcode': '8901030656002',
                'name': 'Horlicks Classic Malt',
                'brand': 'HUL',
                'category': 'beverage',
                'emoji': '🥛',
                'base_score': 65,
                'price': 260.00,
                'ingredients': [
                    {'name': 'Malted Barley', 'type': 'beneficial', 'severity': 'high', 'reason': 'Rich in vitamins'},
                    {'name': 'Wheat Flour', 'type': 'neutral', 'severity': 'low', 'reason': 'Base'},
                    {'name': 'Sugar', 'type': 'harmful', 'severity': 'medium', 'reason': 'Added sugar'},
                    {'name': 'Milk Solids', 'type': 'neutral', 'severity': 'low', 'reason': 'Dairy'},
                    {'name': 'Minerals & Vitamins', 'type': 'beneficial', 'severity': 'high', 'reason': 'High fortification'}
                ],
                'nutrition': {
                    'calories': 377, 'sugar': 13.5, 'sodium': 450, 'salt': 1.1,
                    'fat': 2, 'saturated_fat': 1.1, 'fiber': 5, 'protein': 11, 'carbs': 79
                }
            },
            {
                'barcode': '8901012330104',
                'name': 'Tata Salt',
                'brand': 'Tata Consumer',
                'category': 'spread',
                'emoji': '🧂',
                'base_score': 30,
                'price': 28.00,
                'ingredients': [
                    {'name': 'Iodized Salt', 'type': 'harmful', 'severity': 'high', 'reason': 'High sodium intake risk'},
                    {'name': 'Potassium Iodate', 'type': 'beneficial', 'severity': 'low', 'reason': 'Iodine source'},
                    {'name': 'Anticaking Agent (551)', 'type': 'neutral', 'severity': 'low', 'reason': 'Standard additive'}
                ],
                'nutrition': {
                    'calories': 0, 'sugar': 0, 'sodium': 38700, 'salt': 97,
                    'fat': 0, 'saturated_fat': 0, 'fiber': 0, 'protein': 0, 'carbs': 0
                }
            },
            {
                'barcode': '8901138833915',
                'name': 'Dabur Honey',
                'brand': 'Dabur India',
                'category': 'spread',
                'emoji': '🍯',
                'base_score': 74,
                'price': 125.00,
                'ingredients': [
                    {'name': 'Pure Honey', 'type': 'beneficial', 'severity': 'high', 'reason': 'Natural sweetener, antibacterial properties'}
                ],
                'nutrition': {
                    'calories': 320, 'sugar': 80, 'sodium': 10, 'salt': 0.02,
                    'fat': 0, 'saturated_fat': 0, 'fiber': 0, 'protein': 0, 'carbs': 80
                }
            },
            {
                'barcode': '8901262010015',
                'name': 'Himalaya Pure Herbs Neem',
                'brand': 'Himalaya Wellness',
                'category': 'dairy',
                'emoji': '🌿',
                'base_score': 88,
                'price': 165.00,
                'ingredients': [
                    {'name': 'Neem Extract', 'type': 'beneficial', 'severity': 'high', 'reason': 'Blood purifier, anti-microbial'}
                ],
                'nutrition': {
                    'calories': 0, 'sugar': 0, 'sodium': 0, 'salt': 0,
                    'fat': 0, 'saturated_fat': 0, 'fiber': 0, 'protein': 0, 'carbs': 0
                }
            },
            {
                'barcode': '8901063142077',
                'name': 'Britannia Good Day Cashew',
                'brand': 'Britannia',
                'category': 'snack',
                'emoji': '🍪',
                'base_score': 35,
                'price': 30.00,
                'ingredients': [
                    {'name': 'Wheat Flour', 'type': 'neutral', 'severity': 'low', 'reason': 'Base'},
                    {'name': 'Sugar', 'type': 'harmful', 'severity': 'high', 'reason': 'High added sugar'},
                    {'name': 'Vegetable Oil', 'type': 'harmful', 'severity': 'medium', 'reason': 'Refined fats'},
                    {'name': 'Cashew Bits', 'type': 'beneficial', 'severity': 'low', 'reason': 'Nuts benefit'}
                ],
                'nutrition': {
                    'calories': 495, 'sugar': 22, 'sodium': 340, 'salt': 0.8,
                    'fat': 23, 'saturated_fat': 11, 'fiber': 1.5, 'protein': 7, 'carbs': 65
                }
            }
        ]

        for data in products:
            Product.objects.create(**data)

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {len(products)} products! NOW GO TO MONGODB ATLAS AND UPDATE PRICES MANUALLY.'
        ))
