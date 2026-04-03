import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Tag, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CheckoutScreen() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
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
    fetchCart();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const data = await api.validateCoupon(couponCode);
      if (data.valid) {
        setAppliedCoupon(couponCode);
        const discAmount = data.discount_type === 'percentage' 
          ? (cart.total * data.discount_value / 100) 
          : data.discount_value;
        setDiscount(discAmount);
        setError(null);
      }
    } catch (err) {
      setError('Invalid or expired coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      const order = await api.createOrder(appliedCoupon, user?.email);
      navigate(`/receipt/${order.order_id}`);
    } catch (err) {
      setError('Checkout failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Preparing checkout...</p>
    </div>
  );
  
  if (!cart) return <div className="p-12 text-center text-danger font-medium mt-safe">Error loading checkout details.</div>;

  const totalFinal = cart.total - discount;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 animate-in fade-in duration-300 pb-32">
      <button 
        onClick={() => navigate('/cart')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 mt-2 transition-colors font-medium w-fit"
      >
        <ArrowLeft size={20} />
        Back to Cart
      </button>

      <h1 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3 tracking-tight">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary border border-primary-100">
           <CreditCard size={20} />
        </div>
        Checkout Securely
      </h1>

      {/* Order Summary */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 mb-6 shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Order Summary</h2>
        <div className="space-y-4">
          {cart.items.map(item => (
            <div key={item.barcode} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 font-medium">{item.name} <span className="text-gray-400 ml-1">x{item.quantity}</span></span>
              <span className="font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          
          <div className="h-px bg-gray-100 my-4"></div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-bold text-gray-900">₹{cart.total.toFixed(2)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between items-center text-sm text-success">
              <span className="flex items-center gap-1.5 font-medium"><Tag size={16} /> Discount</span>
              <span className="font-bold">-₹{discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center text-xl font-black pt-4 mt-2 border-t border-gray-100">
            <span className="text-gray-900">Total</span>
            <span className="text-primary tracking-tight">₹{totalFinal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Coupon Section */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm">
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Coupon Code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
          />
          <button 
            onClick={handleApplyCoupon}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-2xl transition-all active:scale-95"
          >
            Apply
          </button>
        </div>
        {error && <p className="text-danger text-xs mt-2 ml-2 font-medium">{error}</p>}
        {appliedCoupon && (
          <p className="text-success text-xs mt-2 ml-2 flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={14} /> Coupon "{appliedCoupon}" applied!
          </p>
        )}
      </div>

      {/* Payment simulated */}
      <div className="bg-success-bg border border-success/20 rounded-2xl p-4 mb-8 flex items-start gap-4 shadow-sm">
        <div className="bg-white p-2 rounded-xl shadow-sm mt-0.5">
           <ShieldCheck className="text-success shrink-0" size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 mb-0.5">Secure One-Tap Payment</p>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">Self-checkout simulation environment. Processing directly from wallet.</p>
        </div>
      </div>

      {/* Checkout Button Footer */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-7xl mx-auto z-40 bg-white border-t border-gray-100 p-4 pb-6 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
         <button 
           onClick={handlePlaceOrder}
           disabled={processing}
           className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-lg shadow-lg ${
             processing 
               ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
               : 'bg-primary hover:bg-primary-600 text-white shadow-primary/20 active:scale-[0.98]'
           }`}
         >
           {processing ? (
             <>
               <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-500 rounded-full animate-spin"></div>
               Processing...
             </>
           ) : (
             <>
               Pay ₹{totalFinal.toFixed(2)} & Get QR
               <CheckCircle2 size={20} />
             </>
           )}
         </button>
      </div>
      
    </div>
  );
}

export default CheckoutScreen;
