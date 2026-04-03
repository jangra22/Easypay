import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CartScreen() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
  }, []);

  const updateQuantity = async (barcode, newQty) => {
    if (newQty < 1) return;
    try {
      await api.updateCartItem(barcode, newQty, user?.email);
      fetchCart();
    } catch (err) {
      console.error('Failed to update quantity', err);
    }
  };

  const removeItem = async (barcode) => {
    try {
      await api.removeCartItem(barcode, user?.email);
      fetchCart();
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[70vh]">
        <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <ShoppingCart size={40} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">Scan products in the store to add them to your self-checkout cart.</p>
        <button 
          onClick={() => navigate('/scan')}
          className="bg-primary hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-transform active:scale-95 shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          Start Scanning
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 pb-32 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6 mt-2">
        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary-100">
          <ShoppingCart size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Cart</h1>
          <p className="text-sm text-gray-500 font-medium">{cart.items.length} items ready for checkout</p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode='popLayout'>
          {cart.items.map((item) => (
            <motion.div 
              key={item.barcode}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="text-4xl w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0 shadow-inner">
                {item.emoji || '📦'}
              </div>
              
              <div className="flex-1 min-w-0 py-1">
                <h3 className="font-bold text-gray-900 truncate tracking-tight">{item.name}</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">{item.brand}</p>
                <div className="flex items-center justify-between mt-2">
                   <p className="text-lg font-black text-primary">₹{item.price.toFixed(2)}</p>
                   
                   <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-200">
                     <button 
                       onClick={() => updateQuantity(item.barcode, item.quantity - 1)}
                       className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 active:scale-90 transition-transform"
                     >
                       <Minus size={14} />
                     </button>
                     <span className="w-4 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                     <button 
                       onClick={() => updateQuantity(item.barcode, item.quantity + 1)}
                       className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 active:scale-90 transition-transform"
                     >
                       <Plus size={14} />
                     </button>
                   </div>
                </div>
              </div>

              <div className="h-full flex flex-col justify-start">
                  <button 
                    onClick={() => removeItem(item.barcode)}
                    className="p-2 text-gray-400 hover:text-danger hover:bg-danger-bg rounded-xl transition-colors mt-[-4px] mr-[-4px]"
                  >
                    <Trash2 size={18} />
                  </button>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Checkout Summary */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-7xl mx-auto z-40 bg-white border-t border-gray-100 p-4 pb-6 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-end mb-4 px-2">
          <div className="flex flex-col">
             <span className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Total Amount</span>
             <span className="text-3xl font-black text-gray-900 leading-none">₹{cart.total.toFixed(2)}</span>
          </div>
          <p className="text-xs font-medium text-gray-400 mb-1">Taxes included</p>
        </div>
        <button 
          onClick={() => navigate('/checkout')}
          className="w-full bg-primary hover:bg-primary-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-primary/20 text-lg"
        >
          Checkout Securely
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default CartScreen;
