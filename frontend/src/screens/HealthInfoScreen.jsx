import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, ShoppingCart, Plus, Minus, Info, Sparkles, ShieldCheck, ChevronRight, Activity } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HealthInfoScreen = ({ addToHistory = () => {} }) => {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [conditions, setConditions] = useState(() => {
    if (location.state?.conditions) return location.state.conditions;
    const saved = localStorage.getItem('health_conditions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [product, setProduct] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [warnings, setWarnings] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [alternativesError, setAlternativesError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const p = await api.getProductByBarcode(barcode);
        setProduct(p);
        if (p) addToHistory(p);

        const [scoreRes, warningsRes] = await Promise.all([
          api.calculateScore(barcode, conditions),
          api.getWarnings(barcode, conditions)
        ]);
        setScoreData(scoreRes);
        setWarnings(warningsRes);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    if (barcode) fetchData();
  }, [barcode, conditions]);

  const handleFetchAlternatives = async () => {
    setLoadingAlternatives(true);
    setAlternativesError(null);
    try {
      const altRes = await api.getAlternatives(barcode, conditions, scoreData?.personalized_score || 50);
      if (altRes.error) {
        setAlternativesError(altRes.error);
      } else {
        setAlternatives(altRes.alternatives || []);
      }
    } catch (err) {
      setAlternativesError("Failed to fetch alternatives. Please try again.");
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await api.addToCart(barcode, quantity, user?.email);
      navigate('/cart');
    } catch (err) {
      console.error(err);
    } finally {
      setAddingToCart(false);
    }
  };

  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100vh] bg-white">
        <Activity className="text-primary animate-pulse w-12 h-12 mb-4" />
        <p className="text-gray-500 font-medium">Analyzing product health...</p>
      </div>
    );
  }

  if (!product) return <div className="p-20 text-center text-gray-900 bg-white min-h-screen">Product not found.</div>;

  const score = scoreData?.personalized_score || 0;
  const scoreColor = scoreData?.score_color || 'gray';
  const scoreLabel = scoreData?.score_label || 'Unknown';
  
  const bgColorClass = scoreColor === 'red' ? 'bg-danger' : scoreColor === 'green' ? 'bg-success' : 'bg-warning';
  const textColorClass = scoreColor === 'red' ? 'text-danger' : scoreColor === 'green' ? 'text-success' : 'text-warning';

  return (
    <div className={`relative min-h-screen ${bgColorClass} flex flex-col font-sans transition-colors duration-500 pb-24`}>
      {/* Header Image Area */}
      <div className="h-64 flex flex-col items-center pt-8 relative">
        <div className="w-full px-6 flex justify-between items-center absolute top-6 z-10 text-white">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
             <ArrowLeft size={20} />
          </button>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
             <Heart size={20} />
          </button>
        </div>
        
        {/* Product Emoji / Image Mock */}
        <div className="mt-8 relative z-0">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 text-6xl shadow-xl"
          >
            {product.emoji || '🥤'}
          </motion.div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-gray-bg rounded-t-[2.5rem] w-full mt-[-2rem] relative z-20 px-6 pt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
          <p className="text-gray-500 font-medium">{product.brand}</p>
        </div>

        {/* Score Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col items-center relative overflow-hidden">
           <h2 className="text-sm font-bold text-gray-900 mb-6 w-full text-center tracking-wide">Analysis Result</h2>
           
           <div className="relative flex items-center justify-center w-36 h-36 mb-4">
              {/* Semi-Circle SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-180 absolute inset-0">
                <path d="M 20 80 A 40 40 0 1 1 80 80" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                <motion.path 
                  d="M 20 80 A 40 40 0 1 1 80 80" fill="none" 
                  stroke="currentColor" strokeWidth="8" strokeLinecap="round" 
                  className={textColorClass}
                  strokeDasharray="188.5"
                  initial={{ strokeDashoffset: 188.5 }}
                  animate={{ strokeDashoffset: 188.5 - (188.5 * score) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="flex flex-col items-center mt-4">
                 <span className={`text-5xl font-bold ${textColorClass} tracking-tighter leading-none`}>{score}</span>
              </div>
           </div>
           
           <p className={`text-xl font-bold mt-2 ${textColorClass}`}>
            {scoreLabel}
           </p>
        </div>

        {/* Warnings */}
        {warnings?.triggered_warnings?.length > 0 && (
          <div className="bg-danger-bg border border-danger/20 p-5 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-3 text-danger font-bold text-sm">
              <ShieldCheck size={18} /> Health Profile Alerts
            </div>
            <div className="space-y-3">
              {warnings.triggered_warnings.map((w, idx) => (
                <div key={idx} className="bg-white/60 p-3 rounded-xl">
                  <p className="text-sm font-bold text-gray-900 mb-1">{w.label}</p>
                  <p className="text-xs text-gray-600 mb-2">{w.reason}</p>
                  <div className="flex gap-1 flex-wrap">
                    {w.triggering_ingredients.map((ing, i) => (
                      <span key={i} className="text-[10px] bg-danger text-white px-2 py-0.5 rounded-full font-bold">{ing}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ingredient Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            Ingredient Breakdown
          </h3>
          <div className="space-y-3">
            {product.ingredients.map((ing, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  ing.type === 'harmful' ? 'bg-danger-bg text-danger' : 
                  ing.type === 'beneficial' ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-500'
                }`}>
                  {ing.type === 'harmful' ? '!' : ing.type === 'beneficial' ? '✓' : '•'}
                </div>
                <div className="flex-1">
                   <p className="font-bold text-gray-900">{ing.name}</p>
                   <p className="text-xs text-gray-500 mt-0.5 leading-snug">{ing.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alternatives Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-warning" />
            Healthier Alternatives
          </h3>
          
          {alternatives.length === 0 && !loadingAlternatives && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-4">Discover products grouped by similar taste but with better health scores.</p>
              {alternativesError && <p className="text-xs text-danger font-medium mb-3">{alternativesError}</p>}
              <button 
                onClick={handleFetchAlternatives}
                className="w-full bg-gradient-to-r from-warning to-primary text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles size={18} /> Find Better Alternatives
              </button>
            </div>
          )}

          {loadingAlternatives && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-4">
              <Activity className="text-warning animate-pulse w-8 h-8" />
              <p className="text-sm font-medium text-gray-500">AI is analyzing alternatives...</p>
            </div>
          )}

          {alternatives.length > 0 && !loadingAlternatives && (
            <div className="space-y-4">
              {alternatives.map((alt, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-warning/50 transition-colors">
                   <div className="w-14 h-14 bg-success-bg text-success rounded-xl flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-lg font-bold leading-none">{alt.estimated_score}</span>
                      <span className="text-[8px] font-bold uppercase mt-1">Score</span>
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-gray-900 leading-tight">{alt.name}</p>
                      <p className="text-[10px] text-gray-500 mb-1">{alt.brand}</p>
                      <p className="text-xs text-success font-medium italic">{alt.why_healthier}</p>
                   </div>
                </div>
              ))}
              <button 
                onClick={handleFetchAlternatives}
                className="w-full mt-4 bg-gray-50 text-gray-600 font-bold py-3 px-4 rounded-xl border border-gray-200 transition-colors hover:bg-gray-100 text-sm"
              >
                Refresh Alternatives
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-7xl mx-auto bg-white border-t border-gray-100 p-4 pb-6 flex items-center gap-4 z-50">
         <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-200">
            <button 
               onClick={decrementQuantity}
               className="w-10 h-10 rounded-xl bg-white text-gray-600 flex items-center justify-center shadow-sm active:scale-90 transition-all border border-gray-200"
            >
               <Minus size={18} />
            </button>
            <span className="text-lg font-bold text-gray-900 w-4 text-center">{quantity}</span>
            <button 
               onClick={incrementQuantity}
               className="w-10 h-10 rounded-xl bg-white text-gray-600 flex items-center justify-center shadow-sm active:scale-90 transition-all border border-gray-200"
            >
               <Plus size={18} />
            </button>
         </div>

         <button 
           onClick={handleAddToCart}
           disabled={addingToCart}
           className="flex-1 bg-primary hover:bg-primary-600 text-white py-4 rounded-2xl font-bold text-base flex justify-between items-center px-4 transition-all shadow-lg shadow-primary/20 active:scale-95"
         >
           <div className="flex items-center gap-2">
             {addingToCart ? <Activity className="animate-pulse" size={18} /> : <ShoppingCart size={18} />}
             <span>Add to Cart</span>
           </div>
           <span>₹{(product.price * quantity).toFixed(2)}</span>
         </button>
      </div>

    </div>
  );
};

export default HealthInfoScreen;
