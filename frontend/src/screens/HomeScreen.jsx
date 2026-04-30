import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ScanLine, Activity, History, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const HomeScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch Cart Count
        const cart = await api.getCart(user?.email);
        const count = cart.items.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(count);

        // Fetch All Products
        const productsData = await api.getProducts();
        setProducts(productsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchInitialData();
  }, [user]);

  const handleAddToCart = async (product) => {
    setAddingToCart(product.barcode);
    try {
      await api.addToCart(product.barcode, 1, user?.email);
      const cart = await api.getCart(user?.email);
      const count = cart.items.reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(count);
      
      // Reset adding state after a brief moment for feedback
      setTimeout(() => setAddingToCart(null), 600);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setAddingToCart(null);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-6 py-8 pb-24">
      
      {/* Header Greeting */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-gray-500 font-medium text-sm mb-1">Good morning,</p>
          <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Shopper'}!</h1>
        </div>
        <Link to="/cart" className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 relative active:scale-95 transition-transform">
          <ShoppingCart className="text-gray-900" size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Main Scan Button */}
      <div className="flex justify-center mb-10 mt-4">
        <button 
          onClick={() => navigate('/scan')}
          className="relative w-48 h-48 rounded-full bg-primary flex flex-col items-center justify-center shadow-xl shadow-primary/30 text-white transform active:scale-95 transition-all outline-none"
        >
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

      {/* Products Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Featured Products</h2>
          <Link to="/scan" className="text-primary text-xs font-bold flex items-center">
            Scan New <ChevronRight size={14} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {[1, 2, 3].map(i => (
              <div key={i} className="min-w-[140px] w-[140px] h-48 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2">
            {products.map((product) => (
              <div 
                key={product.barcode}
                className="min-w-[150px] w-[150px] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative group"
              >
                <Link to={`/health/analysis/${product.barcode}`} className="flex flex-col items-center">
                  <div className="text-4xl mb-2 bg-gray-50 w-16 h-16 rounded-xl flex items-center justify-center group-active:scale-95 transition-transform">
                    {product.emoji || '📦'}
                  </div>
                  <h3 className="font-bold text-gray-900 text-xs text-center line-clamp-1">{product.name}</h3>
                  <p className="text-[10px] text-gray-500 mb-2">{product.brand}</p>
                  <p className="text-sm font-bold text-primary">₹{product.price}</p>
                </Link>
                
                <button 
                  onClick={() => handleAddToCart(product)}
                  disabled={addingToCart === product.barcode}
                  className={`mt-2 w-full py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 ${
                    addingToCart === product.barcode 
                    ? 'bg-success text-white' 
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {addingToCart === product.barcode ? (
                    <span className="text-[10px] font-bold">Added!</span>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span className="text-[10px] font-bold">Add</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Dashboard Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Health Dashboard</h2>
          <span className="text-success font-medium text-sm">Great shape!</span>
        </div>
        
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

