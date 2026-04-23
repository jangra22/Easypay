from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import uuid
# from decimal import Decimal
from django.utils import timezone
from .models import Product, Cart, Coupon, Order, Guard, AppUser
from .serializers import ProductSerializer, ProductShortSerializer
from .score_engine import calculate_base_score, apply_condition_penalties, get_score_label
from .disease_mapper import get_warnings
from .ai_service import get_healthier_alternatives
from .qr_service import generate_order_qr, generate_user_qr
import traceback

# --- Helper Functions ---

def _get_or_fetch_product(barcode):
    """Helper to get product from local DB or fetch from OpenFoodFacts (JSON-first)."""
    try:
        return Product.objects.get(barcode=barcode)
    except Product.DoesNotExist:
        try:
            off_url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
            res = requests.get(off_url, timeout=5).json()
            
            if res.get('status') == 1:
                p_data = res.get('product')
                name = p_data.get('product_name', f"Scanned {barcode}")
                brand = p_data.get('brands', 'Unknown Brand')
                category = p_data.get('main_category', 'snack').split(':')[-1]
                
                # Fetch basic nutrients
                nutrients = p_data.get('nutriments', {})
                nutrition_dict = {
                    'calories': nutrients.get('energy-kcal_100g', 0),
                    'sugar': nutrients.get('sugars_100g', 0),
                    'sodium': nutrients.get('sodium_100g', 0) * 1000, # Converting g to mg
                    'fat': nutrients.get('fat_100g', 0),
                    'saturated_fat': nutrients.get('saturated-fat_100g', 0),
                    'fiber': nutrients.get('fiber_100g', 0),
                    'protein': nutrients.get('proteins_100g', 0),
                    'carbs': nutrients.get('carbohydrates_100g', 0)
                }
                
                # Build simple ingredients list
                ingredients_text = p_data.get('ingredients_text', '')
                ingredients_list = []
                if ingredients_text:
                    ings = [i.strip() for i in ingredients_text.split(',')[:10]]
                    for ing in ings:
                        ingredients_list.append({
                            'name': ing,
                            'type': 'neutral',
                            'severity': 'low',
                            'reason': 'Fetched from OpenFoodFacts'
                        })

                product = Product.objects.create(
                    barcode=barcode,
                    name=name,
                    brand=brand,
                    category=category,
                    price=0.00,
                    ingredients=ingredients_list,
                    nutrition=nutrition_dict
                )
                return product
            else:
                return Product.objects.create(
                    barcode=barcode,
                    name=f"New Product {barcode}",
                    brand="Generic",
                    price=0.00
                )
        except Exception:
            return None

# --- Product & Health Views ---

class ProductByBarcodeView(APIView):
    def get(self, request, barcode):
        product = _get_or_fetch_product(barcode)
        if product:
            serializer = ProductSerializer(product)
            return Response(serializer.data)
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

class ProductListView(APIView):
    def get(self, request):
        products = Product.objects.all()
        serializer = ProductShortSerializer(products, many=True)
        return Response(serializer.data)

class CalculateScoreView(APIView):
    def post(self, request):
        barcode = request.data.get('barcode')
        conditions = request.data.get('conditions', [])
        product = _get_or_fetch_product(barcode)
        if not product:
            return Response({"error": "Product not found"}, status=404)
        
        base_score = calculate_base_score(product)
        personalized_score, penalties = apply_condition_penalties(base_score, product, conditions)
        label, color = get_score_label(personalized_score)
        
        return Response({
            "base_score": base_score,
            "personalized_score": personalized_score,
            "score_breakdown": {"condition_penalties": penalties},
            "score_label": label,
            "score_color": color
        })

class DiseaseWarningsView(APIView):
    def post(self, request):
        barcode = request.data.get('barcode')
        conditions = request.data.get('conditions', [])
        product = _get_or_fetch_product(barcode)
        if not product:
            return Response({"error": "Product not found"}, status=404)
        return Response(get_warnings(product, conditions))

class HealthierAlternativesView(APIView):
    def post(self, request):
        barcode = request.data.get('barcode')
        conditions = request.data.get('conditions', [])
        current_score = request.data.get('current_score', 50)
        product = _get_or_fetch_product(barcode)
        if not product:
            return Response({"error": "Product not found"}, status=404)
        return Response(get_healthier_alternatives(product, conditions, current_score))

# --- Cart Views ---

class CartView(APIView):
    def get(self, request):
        # Must be logged in
        user_email = request.GET.get('user_email')
        if not user_email:
            return Response({'error': 'Authentication required. No user_email provided.'}, status=401)
            
        session_id = user_email
        
        cart, _ = Cart.objects.get_or_create(session_id=session_id)
        
        items_with_details = []
        total = 0.0
        for item in cart.items:
            try:
                p = Product.objects.get(barcode=item['barcode'])
                subtotal = p.price * item['quantity']
                items_with_details.append({
                    'barcode': p.barcode,
                    'name': p.name,
                    'brand': p.brand,
                    'emoji': p.emoji,
                    'price': p.price,
                    'quantity': item['quantity'],
                    'subtotal': subtotal
                })
                total += subtotal
            except Product.DoesNotExist:
                continue
        
        return Response({
            'session_id': session_id,
            'items': items_with_details,
            'total': total
        })

class AddToCartView(APIView):
    def post(self, request):
        user_email = request.data.get('user_email')
        if not user_email:
            return Response({'error': 'Authentication required. No user_email provided.'}, status=401)
            
        session_id = user_email
            
        barcode = request.data.get('barcode')
        quantity = int(request.data.get('quantity', 1))
        
        cart, _ = Cart.objects.get_or_create(session_id=session_id)
        
        # Check if exists
        found = False
        for item in cart.items:
            if item['barcode'] == barcode:
                item['quantity'] += quantity
                found = True
                break
        
        if not found:
            cart.items.append({'barcode': barcode, 'quantity': quantity})
            
        cart.save()
        return Response({'message': 'Added to cart', 'session_id': session_id})

class UpdateCartItemView(APIView):
    def patch(self, request, barcode):
        user_email = request.data.get('user_email')
        if not user_email:
            return Response({'error': 'Authentication required. No user_email provided.'}, status=401)
            
        session_id = user_email
        try:
            cart = Cart.objects.get(session_id=session_id)
            for item in cart.items:
                if item['barcode'] == barcode:
                    item['quantity'] = int(request.data.get('quantity', 1))
                    break
            cart.save()
            return Response({'message': 'Cart updated'})
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=404)

class RemoveCartItemView(APIView):
    def delete(self, request, barcode):
        user_email = request.GET.get('user_email')
        if not user_email:
            return Response({'error': 'Authentication required. No user_email provided.'}, status=401)
            
        session_id = user_email
        try:
            cart = Cart.objects.get(session_id=session_id)
            cart.items = [i for i in cart.items if i['barcode'] != barcode]
            cart.save()
            return Response({'message': 'Item removed'})
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=404)

class ClearCartView(APIView):
    def post(self, request):
        user_email = request.data.get('user_email')
        if not user_email:
            return Response({'error': 'Authentication required. No user_email provided.'}, status=401)
            
        session_id = user_email
        try:
            cart = Cart.objects.get(session_id=session_id)
            cart.items = []
            cart.save()
            return Response({'message': 'Cart cleared'})
        except Cart.DoesNotExist:
            return Response({'message': 'Done'})

class ValidateCouponView(APIView):
    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        try:
            coupon = Coupon.objects.get(code=code, active=True)
            return Response({
                'valid': True,
                'discount_type': coupon.discount_type,
                'discount_value': float(coupon.discount_value)
            })
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'error': 'Invalid coupon'}, status=404)

# --- Order & Guard Views ---

class CreateOrderView(APIView):
    def post(self, request):
        user_email = request.data.get('user_email')
        if not user_email:
            return Response({'error': 'Authentication required. No user_email provided.'}, status=401)
            
        session_id = user_email
            
        try:
            cart = Cart.objects.get(session_id=session_id)
            if not cart.items:
                return Response({'error': 'Cart is empty'}, status=400)
            
            user = None
            if user_email:
                try:
                    user = AppUser.objects.get(email=user_email)
                except AppUser.DoesNotExist:
                    pass

            order_items = []
            subtotal = 0.0
            for item in cart.items:
                p = Product.objects.get(barcode=item['barcode'])
                order_items.append({
                    'barcode': p.barcode,
                    'name': p.name,
                    'price': p.price,
                    'quantity': item['quantity'],
                    'subtotal': p.price * item['quantity']
                })
                subtotal += (p.price * item['quantity'])
            
            # Apply coupon if provided
            discount = 0.0
            coupon_code = request.data.get('coupon_code')
            if coupon_code:
                try:
                    c = Coupon.objects.get(code=coupon_code, active=True)
                    if c.discount_type == 'percentage':
                        discount = subtotal * (c.discount_value / 100)
                    else:
                        discount = c.discount_value
                except Coupon.DoesNotExist:
                    pass
            
            total = subtotal - discount
            order = Order.objects.create(
                order_id=uuid.uuid4(),
                session_id=session_id,
                user=user,
                items=order_items,
                subtotal=subtotal,
                discount=discount,
                total=total,
                coupon_code=coupon_code
            )
            order.qr_code = generate_order_qr(order)
            order.save()
            
            # Clear cart
            cart.items = []
            cart.save()
            
            return Response({
                'order_id': str(order.order_id),
                'total': float(order.total),
                'qr_code': order.qr_code
            }, status=201)
            
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=404)

class OrderListView(APIView):
    def get(self, request):
        session_id = request.session.session_key or request.query_params.get('session_id')
        user_email = request.query_params.get('user_email')
        
        if user_email:
            try:
                user = AppUser.objects.get(email=user_email)
                orders = Order.objects.filter(user=user).order_by('-created_at')
            except AppUser.DoesNotExist:
                return Response({'orders': []})
        elif session_id:
            orders = Order.objects.filter(session_id=session_id).order_by('-created_at')
        else:
            return Response({'orders': []})
        return Response([
            {
                'order_id': str(o.order_id),
                'total': float(o.total),
                'item_count': len(o.items),
                'created_at': o.created_at.isoformat(),
                'payment_status': o.payment_status,
                'is_used': o.is_used,
                'user_name': getattr(o.user, 'name', 'Guest') if o.user else 'Guest',
                'purchase_count': getattr(o.user, 'orders', Order.objects.none()).count() if o.user else 1,
            } for o in orders
        ])

class OrderDetailView(APIView):
    def get(self, request, order_id):
        try:
            order = Order.objects.get(order_id=order_id)
            return Response({
                'order_id': str(order.order_id),
                'items': order.items,
                'total': float(order.total),
                'payment_status': order.payment_status,
                'qr_code': order.qr_code,
                'is_used': order.is_used,
                'used_at': order.used_at.isoformat() if order.used_at else None,
                'created_at': order.created_at.isoformat(),
                'user_name': getattr(order.user, 'full_name', 'Guest') if order.user else 'Guest'
            })
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

class GuardVerifyView(APIView):
    def get(self, request, order_id):
        guard_id = request.query_params.get('guard_id')
        
        try:
            order = Order.objects.get(order_id=order_id)
            
            if order.is_used:
                return Response({
                    'verified': False,
                    'error': 'QR Code already used',
                    'used_at': order.used_at.isoformat() if order.used_at else None
                }, status=400)
            
            # (REMOVED: Automatic mutation of is_used to True)
            
            return Response({
                'verified': True,
                'order_id': str(order.order_id),
                'payment_status': order.payment_status,
                'total_paid': float(order.total),
                'item_count': len(order.items),
                'items': order.items,
                'timestamp': order.created_at.isoformat(),
                'created_at': order.created_at.isoformat(),
                'user_name': getattr(order.user, 'full_name', 'Guest') if order.user else 'Guest'
            })
        except Order.DoesNotExist:
            return Response({'verified': False, 'error': 'Invalid Order ID'}, status=404)

class GuardConfirmView(APIView):
    def post(self, request, order_id):
        guard_id = request.data.get('guard_id')
        
        try:
            order = Order.objects.get(order_id=order_id)
            if order.is_used:
                return Response({'error': 'Order already processed'}, status=400)
                
            order.is_used = True
            order.used_at = timezone.now()
            
            if guard_id:
                try:
                    order.scanned_by = Guard.objects.get(guard_id=guard_id)
                except Guard.DoesNotExist:
                    pass
            
            order.save()
            return Response({'message': 'Order successfully completed'})
        except Order.DoesNotExist:
             return Response({'error': 'Invalid Order ID'}, status=404)

class GuardLoginView(APIView):
    def post(self, request):
        guard_id = request.data.get('guard_id')
        password = request.data.get('password')
        
        try:
            guard = Guard.objects.get(guard_id=guard_id, password=password)
            return Response({
                'success': True,
                'guard_id': guard.guard_id,
                'name': guard.name
            })
        except Guard.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Invalid Guard ID or Password'
            }, status=401)

class GuardScanStatsView(APIView):
    def get(self, request, guard_id):
        try:
            guard = Guard.objects.get(guard_id=guard_id)
            count = Order.objects.filter(scanned_by=guard).count()
            return Response({
                'guard_id': guard_id,
                'scan_count': count
            })
        except Guard.DoesNotExist:
            return Response({'error': 'Guard not found'}, status=404)

class GuardOrderListView(APIView):
    def get(self, request):
        # Fetch all orders to be shown in the Guard's live feed
        orders = Order.objects.all().order_by('-created_at')
        return Response([
            {
                'order_id': str(o.order_id),
                'total': float(o.total),
                'item_count': len(o.items),
                'items': o.items, # Adding items so guards can see what was ordered without scanning
                'created_at': o.created_at.isoformat(),
                'payment_status': o.payment_status,
                'is_used': o.is_used,
                'used_at': o.used_at.isoformat() if o.used_at else None,
                'user_name': getattr(o.user, 'name', 'Guest') if o.user else 'Guest',
                'purchase_count': getattr(o.user, 'orders', Order.objects.none()).count() if o.user else 1,
            } for o in orders
        ])

# --- User Auth Views ---

class UserRegisterView(APIView):
    def post(self, request):
        full_name = request.data.get('full_name')
        email = request.data.get('email')
        password = request.data.get('password')
        dob = request.data.get('dob')
        
        if not all([full_name, email, password]):
            return Response({'error': 'All fields are required'}, status=400)
            
        if AppUser.objects.filter(email=email).exists():
            return Response({'error': 'User already exists'}, status=400)
            
        qr_code = generate_user_qr(email)
        
        user = AppUser.objects.create(
            full_name=full_name,
            email=email,
            password=password, # Simple password for dev project
            dob=dob,
            qr_code=qr_code
        )
        
        return Response({
            'success': True,
            'user': {
                'full_name': user.full_name,
                'email': user.email,
                'dob': user.dob,
                'qr_code': user.qr_code
            }
        }, status=201)

class UserLoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = AppUser.objects.get(email=email, password=password)
            return Response({
                'success': True,
                'user': {
                    'full_name': user.full_name,
                    'email': user.email,
                    'dob': user.dob,
                    'health_conditions': user.health_conditions,
                    'qr_code': user.qr_code
                }
            })
        except AppUser.DoesNotExist:
            return Response({'error': 'Invalid email or password'}, status=401)

class UserHealthProfileView(APIView):
    def get(self, request, email):
        try:
            user = AppUser.objects.get(email=email)
            return Response({'health_conditions': user.health_conditions})
        except AppUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
            
    def patch(self, request, email):
        try:
            user = AppUser.objects.get(email=email)
            user.health_conditions = request.data.get('health_conditions', [])
            user.save()
            return Response({'success': True, 'health_conditions': user.health_conditions})
        except AppUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

class UserProfileUpdateView(APIView):
    def patch(self, request, email):
        try:
            user = AppUser.objects.get(email=email)
            
            if 'full_name' in request.data:
                user.full_name = request.data['full_name']
            if 'dob' in request.data:
                user.dob = request.data['dob']
                
            return Response({
                'success': True,
                'user': {
                    'full_name': user.full_name,
                    'email': user.email,
                    'dob': user.dob,
                    'health_conditions': user.health_conditions,
                    'qr_code': user.qr_code
                }
            })
        except AppUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

# --- Admin Views ---

class AdminDashboardStatsView(APIView):
    def get(self, request):
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 1. Guards and their scan counts for today
        guards = Guard.objects.all()
        guard_stats = []
        for guard in guards:
            count = Order.objects.filter(scanned_by=guard, used_at__gte=today_start).count()
            guard_stats.append({
                'guard_id': guard.guard_id,
                'name': guard.name,
                'scan_count': count
            })
            
        # 2. Today's Revenue
        todays_orders = Order.objects.filter(created_at__gte=today_start)
        today_revenue = sum(order.total for order in todays_orders)
        
        # 3. Orders Today
        orders_today_count = todays_orders.count()
        
        # 4. Health Insights Adoption (Users with conditions vs total)
        total_users = AppUser.objects.count()
        users_with_insights = sum(1 for u in AppUser.objects.all() if u.health_conditions and len(u.health_conditions) > 0)
        
        # Monthly Calendar Stats
        import calendar
        from collections import defaultdict
        
        start_date = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        now = timezone.now()
        
        month_orders = Order.objects.filter(created_at__gte=start_date)
        daily_sales = defaultdict(float)
        for order in month_orders:
            daily_sales[order.created_at.day] += float(order.total)
            
        month_users = AppUser.objects.filter(created_at__gte=start_date)
        daily_users = defaultdict(int)
        for user in month_users:
            daily_users[user.created_at.day] += 1
            
        days_in_month = calendar.monthrange(now.year, now.month)[1]
        calendar_stats = []
        for d in range(1, days_in_month + 1):
            calendar_stats.append({
                'date': f"{now.year}-{now.month:02d}-{d:02d}",
                'day': d,
                'sales': daily_sales[d],
                'new_users': daily_users[d]
            })
        
        # 5. Recent Orders (limit 15)
        recent_orders = Order.objects.all().order_by('-created_at')[:15]
        recent_orders_data = [
            {
                'order_id': str(o.order_id),
                'total': float(o.total),
                'item_count': len(o.items),
                'payment_status': o.payment_status,
                'is_used': o.is_used,
                'created_at': o.created_at.isoformat(),
                'user_name': getattr(o.user, 'full_name', 'Guest') if o.user else 'Guest',
            } for o in recent_orders
        ]
        
        return Response({
            'guard_stats': guard_stats,
            'today_revenue': today_revenue,
            'orders_today_count': orders_today_count,
            'health_insights': {
                'total_users': total_users,
                'users_with_insights': users_with_insights
            },
            'recent_orders': recent_orders_data,
            'calendar_stats': calendar_stats
        })

class AdminProductCreateView(APIView):
    def post(self, request):
        data = request.data
        barcode = data.get('barcode', '').strip()
        
        if not barcode:
            return Response({'error': 'Barcode is required'}, status=400)
            
        if Product.objects.filter(barcode=barcode).exists():
            return Response({'error': f'Product with barcode {barcode} already exists'}, status=400)
            
        try:
            product = Product.objects.create(
                barcode=barcode,
                name=data.get('name', 'Unknown Product'),
                brand=data.get('brand', 'Unknown Brand'),
                category=data.get('category', 'uncategorized'),
                emoji=data.get('emoji', '📦'),
                price=float(data.get('price', 0.0)),
                base_score=int(data.get('base_score', 50)),
                ingredients=data.get('ingredients', []),
                nutrition=data.get('nutrition', {})
            )
            return Response({
                'success': True, 
                'message': 'Product created successfully', 
                'barcode': product.barcode
            }, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class AdminUsersListView(APIView):
    def get(self, request):
        users = AppUser.objects.all().order_by('-id') # Ordering by creation/default sequential
        users_data = []
        for u in users:
            purchase_count = getattr(u, 'orders', Order.objects.none()).count()
            users_data.append({
                'full_name': u.full_name,
                'email': u.email,
                'purchase_count': purchase_count,
            })
        return Response({'users': users_data})

class AdminGuardsListView(APIView):
    def get(self, request):
        guards = Guard.objects.all().order_by('name')
        guards_data = [
            {
                'name': g.name,
                'guard_id': g.guard_id
            } for g in guards
        ]
        return Response({'guards': guards_data})

class AdminGuardCreateView(APIView):
    def post(self, request):
        guard_id = request.data.get('guard_id')
        name = request.data.get('name')
        password = request.data.get('password')
        
        if not all([guard_id, name, password]):
            return Response({'error': 'All fields are required'}, status=400)
            
        if Guard.objects.filter(guard_id=guard_id).exists():
            return Response({'error': 'Guard ID already exists'}, status=400)
            
        Guard.objects.create(guard_id=guard_id, name=name, password=password)
        return Response({'success': True, 'message': 'Guard added successfully'})
