import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ScanLine, Activity, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const HomeScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cart = await api.getCart(user?.email);
        const count = cart.items.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(count);
      } catch (err) {}
    };
    fetchCart();
  }, [user]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-6 py-8 pb-24">
      
      {/* Header Greeting */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-gray-500 font-medium text-sm mb-1">Good morning,</p>
          <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Shopper'}!</h1>
        </div>
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 relative">
          <ShoppingCart className="text-gray-900" size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      {/* Main Scan Button */}
      <div className="flex justify-center mb-10 mt-4">
        <button 
          onClick={() => navigate('/scan')}
          className="relative w-48 h-48 rounded-full bg-primary flex flex-col items-center justify-center shadow-xl shadow-primary/30 text-white transform active:scale-95 transition-all outline-none"
        >
          {/* Subtle outer rings */}
          <div className="absolute inset-0 rounded-full border border-primary/40 scale-[1.15] pointer-events-none"></div>
          <div className="absolute inset-0 rounded-full border border-primary/20 scale-[1.3] pointer-events-none"></div>
          
          <ScanLine size={48} className="mb-3" />
          <span className="font-bold text-lg">Tap to Scan</span>
          <span className="text-primary-100 text-sm mt-1">Product</span>
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link to="/cart" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors">
          <div className="w-10 h-10 bg-success-bg text-success rounded-full flex items-center justify-center">
            <ShoppingCart size={20} />
          </div>
          <span className="font-semibold text-gray-800 text-sm">Cart Summary</span>
        </Link>
        <Link to="/history" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <History size={20} />
          </div>
          <span className="font-semibold text-gray-800 text-sm">Order History</span>
        </Link>
      </div>

      {/* Recently Added Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Health Dashboard</h2>
          <span className="text-success font-medium text-sm">Great shape!</span>
        </div>
        
        {/* Placeholder for recent items, would list cart items actually */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-3">
            <div className="w-12 h-12 bg-success-bg rounded-xl flex items-center justify-center text-success">
              <Activity size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">92 Score</p>
              <p className="text-xs text-gray-500 font-medium">Cart Health Rating</p>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} className="text-primary text-sm font-bold pt-1 text-center w-full active:text-primary-600 transition-colors">
            View full analysis →
          </button>
        </div>
      </div>

    </div>
  );
};

export default HomeScreen;
