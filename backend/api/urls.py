from django.urls import path
from . import views

urlpatterns = [
    # Products
    path('products/', views.ProductListView.as_view()),
    path('products/barcode/<str:barcode>/', views.ProductByBarcodeView.as_view()),
    
    # Health analysis
    path('score/', views.CalculateScoreView.as_view()),
    path('warnings/', views.DiseaseWarningsView.as_view()),
    path('alternatives/', views.HealthierAlternativesView.as_view()),
    
    # Cart
    path('cart/', views.CartView.as_view()),
    path('cart/add/', views.AddToCartView.as_view()),
    path('cart/update/<str:barcode>/', views.UpdateCartItemView.as_view()),
    path('cart/remove/<str:barcode>/', views.RemoveCartItemView.as_view()),
    path('cart/clear/', views.ClearCartView.as_view()),
    
    # Coupon
    path('coupon/validate/', views.ValidateCouponView.as_view()),
    
    # Order
    path('order/create/', views.CreateOrderView.as_view()),
    path('order/history/', views.OrderListView.as_view()),
    path('order/<uuid:order_id>/', views.OrderDetailView.as_view()),
    
    # Security Guard Verification
    path('guard/login/', views.GuardLoginView.as_view()),
    path('guard/verify/<uuid:order_id>/', views.GuardVerifyView.as_view()),
    path('guard/confirm/<uuid:order_id>/', views.GuardConfirmView.as_view()),
    path('guard/stats/<str:guard_id>/', views.GuardScanStatsView.as_view()),
    path('guard/orders/', views.GuardOrderListView.as_view()),

    # User Auth & Profile
    path('user/register/', views.UserRegisterView.as_view()),
    path('user/login/', views.UserLoginView.as_view()),
    path('user/health-profile/<str:email>/', views.UserHealthProfileView.as_view()),
    path('user/profile-update/<str:email>/', views.UserProfileUpdateView.as_view()),

    # Admin Portal
    path('admin/stats/', views.AdminDashboardStatsView.as_view()),
    path('admin/product/add/', views.AdminProductCreateView.as_view()),
    path('admin/users/', views.AdminUsersListView.as_view()),
    path('admin/guards/', views.AdminGuardsListView.as_view()),
    path('admin/guard/add/', views.AdminGuardCreateView.as_view()),
]
