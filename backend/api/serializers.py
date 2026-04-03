from rest_framework import serializers
from .models import Product, Cart, Coupon, Order, Guard, AppUser

class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'barcode', 'name', 'brand', 'category', 'emoji', 'price', 
                  'base_score', 'ingredients', 'nutrition']

class ProductShortSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'barcode', 'name', 'brand', 'category', 'emoji', 'price']

class CartSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Cart
        fields = ['id', 'session_id', 'items', 'created_at', 'updated_at']

class OrderSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Order
        fields = '__all__'

class CouponSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Coupon
        fields = '__all__'

class AppUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ['email', 'full_name', 'dob', 'health_conditions', 'qr_code', 'created_at']
