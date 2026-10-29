import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ScanLine, Activity, History, Plus, Minus, ChevronRight, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: '🛒' },
  { id: 'instant_food', label: 'Instant Food', icon: '🍜' },
  { id: 'snack', label: 'Snacks', icon: '🍟' },
  { id: 'beverage', label: 'Beverages', icon: '🧃' },
  { id: 'dairy', label: 'Dairy', icon: '🧈' },
  { id: 'spread', label: 'Spreads', icon: '🍯' },
];

const HomeScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchInitialData = async () => {
    try {
      if (user?.email) {
        const cartData = await api.getCart(user.email);
        setCart(cartData);
        const count = cartData.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;
        setCartCount(count);
      }

      const productsData = await api.getProducts();
      setProducts(productsData || []);
    } catch (err) {
      console.error("Error fetching initial data:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const handleAddToCart = async (product) => {
    setAddingToCart(product.barcode);
    try {
      await api.addToCart(product.barcode, 1, user?.email);
      const updatedCart = await api.getCart(user?.email);
      setCart(updatedCart);
      const count = updatedCart.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;
      setCartCount(count);
      setTimeout(() => setAddingToCart(null), 400);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setAddingToCart(null);
    }
  };

  const handleUpdateQuantity = async (barcode, newQty) => {
    try {
      if (newQty <= 0) {
        await api.removeCartItem(barcode, user?.email);
      } else {
        await api.updateCartItem(barcode, newQty, user?.email);
      }
      const updatedCart = await api.getCart(user?.email);
      setCart(updatedCart);
      const count = updatedCart.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;
      setCartCount(count);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const getProductCartQuantity = (barcode) => {
    if (!cart?.items) return 0;
    const item = cart.items.find(i => i.barcode === barcode);
    return item ? item.quantity : 0;
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  const getScoreBadge = (score = 50) => {
    if (score >= 75) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        ring: '#10B981',
        label: 'Optimal',
      };
    }
    if (score >= 40) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        ring: '#F59E0B',
        label: 'Moderate',
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      ring: '#EF4444',
      label: 'Caution',
    };
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-12">
      
      {/* 1. Shopper Greeting & Quick Status */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Welcome Back</p>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight">
            {user?.full_name || 'Shopper'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full text-emerald-700 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>In Store</span>
        </div>
      </div>

      {/* 2. Hero Scan & Go Retail Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-500 to-primary-700 p-5 text-white shadow-coral mb-6">
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-black/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase">
              ⚡ Instant Queue-less
            </span>
            <span className="bg-black/15 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1">
              <Sparkles size={11} className="text-amber-300" />
              AI Nutrition
            </span>
          </div>

          <div>
            <h2 className="text-xl font-display font-black tracking-tight text-white leading-tight">
              Scan & Go Checkout
            </h2>
            <p className="text-xs text-primary-100 font-medium mt-1 leading-relaxed max-w-[280px]">
              Scan barcodes in aisles for live personalized nutrition ratings and direct digital pass checkout.
            </p>
          </div>

          <div className="pt-1 flex items-center gap-3">
            <button
              onClick={() => navigate('/scan')}
              className="bg-white hover:bg-slate-50 text-primary font-display font-bold text-sm px-5 py-2.5 rounded-full shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <ScanLine size={18} strokeWidth={2.5} />
              <span>Open Scanner</span>
            </button>
            <span className="text-[11px] text-primary-100 font-medium">Point & tap</span>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Chips */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aisles & Categories</span>
          <span className="text-[11px] font-semibold text-slate-500">{filteredProducts.length} items</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Featured Supermarket Product Grid */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3 px-0.5">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900 tracking-tight">Supermarket Shelf</h2>
            <p className="text-[11px] text-slate-500 font-medium">Tap any item for AI ingredient analysis</p>
          </div>
          <Link to="/scan" className="text-primary text-xs font-bold flex items-center gap-0.5 hover:underline">
            Scan barcode <ChevronRight size={14} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-56 bg-white rounded-2xl border border-slate-200/80 animate-pulse p-3 flex flex-col justify-between">
                <div className="w-full h-24 bg-slate-100 rounded-xl mb-2" />
                <div className="w-2/3 h-3 bg-slate-100 rounded mb-1" />
                <div className="w-1/2 h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 my-2">
            <p className="text-3xl mb-2">🛒</p>
            <p className="font-display font-bold text-slate-800 text-sm">No items found</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting another aisle or scan a custom product.</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-3 text-xs font-bold text-primary hover:underline"
            >
              View all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const cartQty = getProductCartQuantity(product.barcode);
              const scoreBadge = getScoreBadge(product.base_score);

              return (
                <div 
                  key={product.barcode}
                  className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-card flex flex-col justify-between group hover:border-slate-300 transition-all"
                >
                  {/* Thumbnail & Score Link */}
                  <Link
                    to={`/health/analysis/${product.barcode}`}
                    className="flex flex-col relative"
                    aria-label={`View analysis for ${product.name}`}
                  >
                    {/* Thumbnail container with Image Support & Emoji Fallback */}
                    <div className="w-full h-24 rounded-xl bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center p-2 mb-2 relative overflow-hidden transition-colors">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain mix-blend-multiply"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <span 
                        style={{ display: product.image_url ? 'none' : 'flex' }}
                        className="text-4xl items-center justify-center"
                      >
                        {product.emoji || '📦'}
                      </span>
                      
                      {/* Floating Mini Health Badge */}
                      <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-xs ${scoreBadge.bg}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreBadge.ring }} />
                        {product.base_score || 50}
                      </span>
                    </div>

                    {/* Metadata */}
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">
                      {product.brand}
                    </p>
                    <h3 className="font-display font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price & Action Row */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display font-extrabold text-slate-900 text-sm sm:text-base tabular-nums">
                        ₹{(product.price || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">incl. tax</span>
                    </div>

                    {cartQty > 0 ? (
                      /* Interactive Pill Stepper */
                      <div className="flex items-center justify-between bg-primary-50 rounded-full p-0.5 border border-primary-200">
                        <button 
                          onClick={() => handleUpdateQuantity(product.barcode, cartQty - 1)}
                          aria-label="Decrease quantity"
                          className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                        >
                          <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <span className="text-xs font-bold text-primary tabular-nums px-2">{cartQty}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(product.barcode, cartQty + 1)}
                          aria-label="Increase quantity"
                          className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      /* Add Button */
                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={addingToCart === product.barcode}
                        className="w-full bg-primary hover:bg-primary-600 text-white rounded-full py-1.5 px-2 text-xs font-bold flex items-center justify-center gap-1 shadow-coral-sm active:scale-95 transition-all"
                      >
                        {addingToCart === product.barcode ? (
                          <span className="text-[10px]">Adding...</span>
                        ) : (
                          <>
                            <Plus size={13} strokeWidth={2.5} />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Health Guard Intake Summary */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Radial Composite Health Score */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#E2E8F0"
                strokeWidth="3.5"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeDasharray="125.6"
                strokeDashoffset="10"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute font-display font-extrabold text-slate-900 text-xs">92</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-slate-900 text-sm">HealthGuard AI</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px]">Active</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Personalized condition analysis active</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/profile')}
          aria-label="View health profile"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-transform active:scale-95"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 6. Quick Navigation Tray */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <Link 
          to="/cart" 
          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3 active:bg-slate-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <ShoppingCart size={18} />
          </div>
          <div>
            <p className="font-display font-bold text-slate-900 text-xs">View Cart</p>
            <p className="text-[10px] text-slate-400 font-medium">{cartCount} items selected</p>
          </div>
        </Link>
        <Link 
          to="/history" 
          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3 active:bg-slate-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <History size={18} />
          </div>
          <div>
            <p className="font-display font-bold text-slate-900 text-xs">Past Orders</p>
            <p className="text-[10px] text-slate-400 font-medium">Exit pass records</p>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default HomeScreen;


