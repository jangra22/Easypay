from django.core.management.base import BaseCommand
from api.models import Coupon


class Command(BaseCommand):
    help = 'Seed specific coupons'

    def handle(self, *args, **kwargs):
        coupons = [
            {
                'code': 'WELCOME50',
                'discount_type': 'percentage',
                'discount_value': 50.0,
                'active': True,
            },
            {
                'code': 'HEALTH20',
                'discount_type': 'percentage',
                'discount_value': 20.0,
                'active': True,
            },
        ]

        for data in coupons:
            Coupon.objects.update_or_create(code=data['code'], defaults=data)

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(coupons)} coupons!'))
