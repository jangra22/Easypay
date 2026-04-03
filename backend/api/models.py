from django.db import models
import uuid
from django.utils import timezone
# from django.contrib.auth.models import User

class Product(models.Model):
    """Product stored in MongoDB with embedded JSON for ingredients/nutrition."""
    # Relying on DEFAULT_AUTO_FIELD in settings for ObjectId
    barcode = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    emoji = models.CharField(max_length=10, default='🍴')
    
    price = models.FloatField(default=0.00)
    base_score = models.IntegerField(default=50)
    
    ingredients = models.JSONField(default=list)  
    nutrition = models.JSONField(default=dict)    
    
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return f"{self.brand} — {self.name}"

class Cart(models.Model):
    session_id = models.CharField(max_length=100, unique=True, db_index=True)
    items = models.JSONField(default=list)  
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20)  
    discount_value = models.FloatField(default=0.00)
    active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'coupons'

class Guard(models.Model):
    guard_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'guards'

    def __str__(self):
        return f"{self.name} ({self.guard_id})"

class AppUser(models.Model):
    email = models.EmailField(unique=True, db_index=True)
    password = models.CharField(max_length=200)
    full_name = models.CharField(max_length=200)
    dob = models.DateField(null=True, blank=True)
    health_conditions = models.JSONField(default=list)
    qr_code = models.TextField(blank=True) # QR containing email
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'app_users'

    def __str__(self):
        return f"{self.full_name} ({self.email})"

class Order(models.Model):
    order_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    session_id = models.CharField(max_length=100)
    items = models.JSONField(default=list)  
    subtotal = models.FloatField(default=0.00)
    discount = models.FloatField(default=0.00)
    total = models.FloatField(default=0.00)
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    payment_status = models.CharField(max_length=20, default='completed')
    qr_code = models.TextField(blank=True)  
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    scanned_by = models.ForeignKey(Guard, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'orders'
