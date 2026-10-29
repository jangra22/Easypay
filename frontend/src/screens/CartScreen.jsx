import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag, 
  Sparkles, CheckCircle2, Store, Camera, ShieldCheck, 
  Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_PROMOS = [
  { code: 'HEALTH20', label: '20% OFF', desc: 'Wellness discount' },
  { code: 'WELCOME50', label: '50% OFF', desc: 'First order special' }
];

function CartScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingBarcode, setUpdatingBarcode] = useState(null);

  // Coupon & Discount states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [couponSuccess, setCouponSuccess] = useState(null);

  const fetchCart = async () => {
    try {
      const data = await api.getCart(user?.email);
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user?.email]);

  const updateQuantity = async (barcode, newQty) => {
    if (newQty < 1) {
      await removeItem(barcode);
      return;
    }
    setUpdatingBarcode(barcode);
    try {
      await api.updateCartItem(barcode, newQty, user?.email);
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity', err);
    } finally {
      setUpdatingBarcode(null);
    }
  };

  const removeItem = async (barcode) => {
    setUpdatingBarcode(barcode);
    try {
      await api.removeCartItem(barcode, user?.email);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item', err);
    } finally {
      setUpdatingBarcode(null);
    }
  };

  const handleApplyCoupon = async (codeToApply = couponCode) => {
    const cleanCode = (codeToApply || '').trim().toUpperCase();
    if (!cleanCode) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const data = await api.validateCoupon(cleanCode, user?.email);
      if (data.valid) {
        setAppliedCoupon(cleanCode);
        const subtotal = cart?.total || 0;
        const discAmount = data.discount_type === 'percentage' 
          ? (subtotal * data.discount_value / 100) 
          : data.discount_value;
        setDiscount(discAmount);
        setCouponSuccess(`Promo "${cleanCode}" applied successfully!`);
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid or expired coupon code');
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponSuccess(null);
    setCouponError(null);
  };

  // Tax and Total calculations
  const subtotal = cart?.total || 0;
  const netAmount = Math.max(0, subtotal - discount);
  const gstAmount = netAmount * 0.18;
  const totalFinal = netAmount + gstAmount;
  const totalItemsCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  // Approximate wellness score from items
  const averageHealthScore = cart?.items?.length > 0 ? 88 : 100;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading your smart cart...</p>
      </div>
    );
  }

  // Empty Cart State
  if (!cart || cart.items.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
        {/* Animated Empty Cart Visual */}
        <div className="relative w-28 h-28 rounded-3xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-6 shadow-coral-sm">
          <ShoppingCart size={48} className="text-primary" />
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-primary">
            <Sparkles size={18} />
          </div>
        </div>

        <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight mb-2">
          Your Smart Cart is Empty
        </h2>
        <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed font-medium">
          Scan item barcodes on shelves in supermarket aisles to build your self-checkout cart.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={() => navigate('/scan')}
            className="w-full bg-primary hover:bg-primary-600 text-white py-4 px-6 rounded-full font-display font-bold text-base flex items-center justify-center gap-2.5 shadow-coral active:scale-95 transition-all"
          >
            <Camera size={20} />
            <span>Open Live Barcode Scanner</span>
          </button>

          <Link
            to="/"
            className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 py-3.5 px-6 rounded-full font-display font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
          >
            <Store size={18} className="text-slate-500" />
            <span>Browse Supermarket Aisles</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 pb-8 animate-fade-in select-none">
      
      {/* 1. SECTION: Smart Cart Header & Health Score Badge */}
      <div className="flex items-center justify-between mb-4 mt-1">
        <div className="flex items-center gap-2">
          <h1 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
            Smart Cart
          </h1>
          <span className="font-display font-bold text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full shadow-xs">
          <Sparkles size={14} className="text-emerald-600" />
          <span className="font-display font-bold text-xs text-emerald-700">
            Health Score {averageHealthScore}/100
          </span>
        </div>
      </div>

      {/* 2. SECTION: Product Item Bento Cards */}
      <div className="flex flex-col gap-2.5 mb-4">
        <AnimatePresence mode="popLayout">
          {cart.items.map((item) => (
            <motion.div 
              key={item.barcode}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Product Thumbnail with Unit Indicator & Image Support */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-1 text-3xl shadow-xs">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
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
                    style={{ display: item.image_url ? 'none' : 'flex' }}
                    className="text-2xl items-center justify-center"
                  >
                    {item.emoji || '📦'}
                  </span>
                  <div className="absolute bottom-1 right-1 px-1 rounded bg-slate-900/80 font-bold text-[9px] text-white">
                    x{item.quantity}
                  </div>
                </div>

                {/* Info Column */}
                <div className="flex flex-col min-w-0 flex-1">
                  <h3 className="font-display font-bold text-slate-900 text-sm truncate tracking-tight">
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      {item.brand || 'Supermarket'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                      88 Health
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 mt-1">
                    ₹{item.price.toFixed(2)} each
                  </span>
                </div>
              </div>

              {/* Right: Item Subtotal & Interactive Stepper */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="font-display font-extrabold text-slate-900 text-base tabular-nums">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>

                {/* Stepper Modifier */}
                <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-200 shadow-xs">
                  <button 
                    onClick={() => updateQuantity(item.barcode, item.quantity - 1)}
                    disabled={updatingBarcode === item.barcode}
                    aria-label={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                    className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-xs text-slate-700 hover:bg-slate-100 active:scale-90 transition-transform disabled:opacity-50"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 size={12} className="text-rose-500" />
                    ) : (
                      <Minus size={12} strokeWidth={2.5} />
                    )}
                  </button>

                  <span className="w-5 text-center text-xs font-bold text-slate-900 tabular-nums">
                    {updatingBarcode === item.barcode ? (
                      <RefreshCw size={10} className="animate-spin text-primary inline" />
                    ) : (
                      item.quantity
                    )}
                  </span>

                  <button 
                    onClick={() => updateQuantity(item.barcode, item.quantity + 1)}
                    disabled={updatingBarcode === item.barcode}
                    aria-label="Increase quantity"
                    className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded-lg shadow-xs hover:bg-primary-600 active:scale-90 transition-transform disabled:opacity-50"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. SECTION: Coupon & Promo Code Section */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={15} className="text-primary" />
          <span className="font-display font-bold text-xs text-slate-800 uppercase tracking-wide">
            Promotions & Discounts
          </span>
        </div>

        {/* Applied Coupon Banner */}
        {appliedCoupon ? (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check size={12} strokeWidth={3} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-xs text-emerald-900 truncate">
                  {appliedCoupon} Applied!
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Saved ₹{discount.toFixed(2)} on this order
                </span>
              </div>
            </div>
            <button 
              onClick={handleRemoveCoupon}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            {/* Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyCoupon();
              }} 
              className="flex gap-2"
            >
              <input 
                type="text" 
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold tracking-wide placeholder:font-normal placeholder:text-slate-400 text-slate-900 outline-none focus:border-primary focus:bg-white transition-all uppercase"
              />
              <button 
                type="submit"
                disabled={!couponCode.trim() || couponLoading}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-display font-bold active:scale-95 transition-all shadow-xs"
              >
                {couponLoading ? 'Checking...' : 'Apply'}
              </button>
            </form>

            {/* Error or Success Feedback */}
            {couponError && (
              <p className="text-[11px] font-semibold text-rose-600 mt-2 flex items-center gap-1">
                <AlertCircle size={13} /> {couponError}
              </p>
            )}

            {/* Quick Promo Pills */}
            <div className="flex items-center gap-2 mt-2.5 overflow-x-auto hide-scrollbar">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                Offers:
              </span>
              {AVAILABLE_PROMOS.map((promo) => (
                <button
                  key={promo.code}
                  type="button"
                  onClick={() => handleApplyCoupon(promo.code)}
                  className="px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 border border-primary-200/70 text-primary font-display font-bold text-[10px] shrink-0 active:scale-95 transition-all flex items-center gap-1"
                >
                  <span>{promo.code}</span>
                  <span className="text-primary-700 font-normal">({promo.label})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. SECTION: Summary Bill Breakdown (Matching Stitch Reference Lines 18) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-2.5 mb-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-display font-bold text-slate-900 text-sm">
            Summary
          </span>
          {appliedCoupon && (
            <span className="font-display font-bold text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {appliedCoupon} (-₹{discount.toFixed(2)})
            </span>
          )}
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Subtotal ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</span>
          <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
            ₹{subtotal.toFixed(2)}
          </span>
        </div>

        {/* Discount Line if Applied */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span className="flex items-center gap-1">
              <Tag size={13} />
              <span>Coupon Savings</span>
            </span>
            <span className="font-display font-bold text-sm tabular-nums">
              -₹{discount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Taxes & Fees (18% GST) */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Taxes & Fees (18% GST)</span>
          <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
            ₹{gstAmount.toFixed(2)}
          </span>
        </div>

        {/* Total Line */}
        <div className="pt-2.5 mt-1 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Payable
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">
              Instant Settlement • Self-Checkout
            </span>
          </div>
          <span className="font-display font-black text-2xl text-primary tabular-nums tracking-tight">
            ₹{totalFinal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 5. SECTION: Action Controls (Stitch Reference Section 3) */}
      <div className="flex flex-col gap-2.5">
        {/* Primary Checkout Button */}
        <button 
          onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon, discount } })}
          className="w-full py-4 px-6 rounded-full bg-primary hover:bg-primary-600 text-white font-display font-bold text-base flex items-center justify-center gap-2.5 shadow-coral active:scale-[0.98] transition-transform"
        >
          <span>Proceed to Checkout — ₹{totalFinal.toFixed(2)}</span>
          <ArrowRight size={19} strokeWidth={2.5} />
        </button>

        {/* Secondary Scan More Items Button */}
        <button 
          onClick={() => navigate('/scan')}
          className="w-full py-3 px-6 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 font-display font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all"
        >
          <Camera size={16} className="text-primary" />
          <span>Scan More Items with Live Scanner</span>
        </button>

        {/* Tertiary Return Link */}
        <div className="text-center pt-1 pb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 active:scale-95 transition-all py-1 px-3"
          >
            <Store size={14} />
            <span>Done & Return to Store Feed</span>
          </Link>
        </div>
      </div>

    </div>
  );
}

export default CartScreen;
