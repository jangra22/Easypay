import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShoppingCart, Plus, Minus, Sparkles, ShieldCheck, 
  AlertTriangle, Check, CheckCircle2, Store, Flame, Zap, 
  Activity, Heart, TrendingDown, Scale, Info, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HealthInfoScreen = ({ addToHistory = () => {} }) => {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const conditions = user?.health_conditions || [];
  
  const [product, setProduct] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [warnings, setWarnings] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [alternativesError, setAlternativesError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const p = await api.getProductByBarcode(barcode);
        setProduct(p);
        if (p) addToHistory(p);

        const [scoreRes, warningsRes, altRes] = await Promise.all([
          api.calculateScore(barcode, conditions).catch(() => null),
          api.getWarnings(barcode, conditions).catch(() => null),
          api.getAlternatives(barcode, conditions, p?.base_score || 50).catch(() => null)
        ]);

        setScoreData(scoreRes);
        setWarnings(warningsRes);
        if (altRes?.alternatives?.length > 0) {
          setAlternatives(altRes.alternatives);
        }
      } catch (err) {
        console.error('Failed to load health info:', err);
      } finally {
        setLoading(false);
      }
    };

    if (barcode) fetchData();
  }, [barcode, conditions]);

  const handleFetchAlternatives = async () => {
    setLoadingAlternatives(true);
    setAlternativesError(null);
    try {
      const altRes = await api.getAlternatives(barcode, conditions, scoreData?.personalized_score || product?.base_score || 50);
      if (altRes.error) {
        setAlternativesError(altRes.error);
      } else {
        setAlternatives(altRes.alternatives || []);
      }
    } catch {
      setAlternativesError("Could not fetch alternatives at this time.");
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await api.addToCart(barcode, quantity, user?.email);
      setAdded(true);
      setToastMessage(`Added ${quantity}x ${product.name} to cart!`);
      setTimeout(() => {
        setAdded(false);
      }, 1500);
    } catch {
      setToastMessage("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSelectAlternative = (alt) => {
    setSelectedAlternative(alt);
    setToastMessage(`Selected switch: ${alt.name}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Analyzing product health profile...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center text-slate-800 bg-slate-50 min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle size={48} className="text-amber-500 mb-3" />
        <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-xs">We could not retrieve nutritional details for barcode {barcode}.</p>
        <button 
          onClick={() => navigate('/scan')}
          className="bg-primary text-white font-display font-bold px-6 py-3 rounded-full text-sm shadow-coral active:scale-95 transition-all"
        >
          Scan Another Product
        </button>
      </div>
    );
  }

  // Derive Health Score Metadata
  const score = scoreData?.personalized_score ?? (product.base_score || 50);

  const getScoreMeta = (val) => {
    if (val >= 70) {
      return {
        stroke: '#10B981',
        bg: 'bg-emerald-50 text-emerald-950 border-emerald-200/80',
        badgeBg: 'bg-emerald-600 text-white',
        grade: 'Grade A',
        label: 'Optimal / Clean Score',
        glow: 'bg-emerald-500/10',
        isHighRisk: false,
      };
    }
    if (val >= 40) {
      return {
        stroke: '#F59E0B',
        bg: 'bg-amber-50 text-amber-950 border-amber-200/80',
        badgeBg: 'bg-amber-500 text-white',
        grade: 'Grade C',
        label: 'Moderate Wellness Score',
        glow: 'bg-amber-500/10',
        isHighRisk: false,
      };
    }
    return {
      stroke: '#EF4444',
      bg: 'bg-rose-50 text-rose-950 border-rose-200/80',
      badgeBg: 'bg-rose-600 text-white',
      grade: 'Grade E',
      label: 'Poor / High Risk Score',
      glow: 'bg-rose-500/10',
      isHighRisk: true,
    };
  };

  const scoreMeta = getScoreMeta(score);
  const nutrition = product.nutrition || {};
  const triggeredList = warnings?.triggered_warnings || [];

  // Derived impact pills
  const heartImpact = (nutrition.sodium > 600 || nutrition.saturated_fat > 5) ? 'Poor' : 'Healthy';
  const sugarImpact = (nutrition.sugar > 10 || (nutrition.carbs > 40 && nutrition.fiber < 2)) ? 'High Spike' : 'Stable';
  const digestiveImpact = (nutrition.fiber && nutrition.fiber >= 3) ? 'High Fiber' : 'Low Fiber';

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 pb-32 animate-fade-in select-none">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between backdrop-blur-md border border-white/10"
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Top Ambient Store & Barcode Bar */}
      <div className="flex items-center justify-between mb-3 px-1 text-slate-500 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <Store size={15} className="text-primary" />
          <span className="capitalize">
            Aisle 4 • {product.category ? product.category.replace('_', ' ') : 'Grocery'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px] text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">Verified Barcode</span>
        </div>
      </div>

      {/* 2. Header Card: Product Info Bento */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 flex items-center gap-3.5 mb-3.5">
        <div className="relative shrink-0 w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 text-4xl shadow-xs overflow-hidden">
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
          <span className="absolute bottom-1 right-1 bg-slate-900/80 text-[9px] font-bold px-1.5 py-0.5 rounded text-white">
            Unit
          </span>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {product.brand || 'Supermarket'}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-semibold text-primary capitalize truncate">
              {product.category ? product.category.replace('_', ' ') : 'Food'}
            </span>
          </div>

          <h1 className="font-display font-extrabold text-base text-slate-900 truncate tracking-tight mt-0.5">
            {product.name}
          </h1>

          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-display font-black text-xl text-slate-900 tabular-nums">
              ₹{(product.price || 0).toFixed(2)}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              In Stock
            </span>
          </div>
        </div>
      </div>

      {/* 3. Prominent Circular Health Gauge Section (Stitch Reference Lines 16-17) */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 flex flex-col items-center text-center relative overflow-hidden mb-3.5">
        {/* Soft Ambient Background Glow */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 ${scoreMeta.glow} rounded-full blur-2xl pointer-events-none`} />

        {/* Circular SVG Gauge */}
        <div className="relative w-40 h-40 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
            {/* Background Track Circle */}
            <circle 
              cx="60" 
              cy="60" 
              r="48" 
              fill="transparent" 
              stroke="#F1F5F9" 
              strokeWidth="9" 
            />
            {/* Animated Score Progress Arc */}
            <circle 
              cx="60" 
              cy="60" 
              r="48" 
              fill="transparent" 
              stroke={scoreMeta.stroke} 
              strokeWidth="9" 
              strokeDasharray="301.6" 
              strokeDashoffset={301.6 - (301.6 * score) / 100} 
              strokeLinecap="round" 
              className="transition-all duration-1000 ease-out" 
            />
          </svg>

          {/* Score Counter in Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-black text-4xl leading-none text-slate-900 tracking-tight">
              {score}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 mt-1">
              out of 100
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 mt-2 rounded-full ${scoreMeta.badgeBg} uppercase tracking-wider shadow-xs`}>
              {scoreMeta.grade}
            </span>
          </div>
        </div>

        {/* High Risk / Optimal Banner */}
        <div className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full ${scoreMeta.bg} shadow-xs text-xs font-bold`}>
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: scoreMeta.stroke }} />
          <span>
            {scoreMeta.isHighRisk 
              ? `High Risk (${conditions.length > 0 ? conditions.join(', ') : 'Nutritional Alert'})` 
              : scoreMeta.label}
          </span>
        </div>

        <p className="text-xs font-medium text-slate-500 mt-2">
          {triggeredList.length > 0 
            ? triggeredList.map(w => w.triggering_ingredients?.slice(0, 2).join(' • ')).filter(Boolean).join(' • ')
            : 'Nutrient-rich profile with balanced glycemic index.'}
        </p>

        {/* 3-Column Micro Impacts Grid */}
        <div className="w-full grid grid-cols-3 gap-1 mt-4 bg-slate-50 rounded-2xl p-2.5 border border-slate-200/70">
          <div className="flex flex-col items-center py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Heart Impact</span>
            <span className={`font-display font-bold text-xs flex items-center gap-0.5 mt-0.5 ${heartImpact === 'Poor' ? 'text-rose-600' : 'text-emerald-700'}`}>
              <Heart size={13} className="shrink-0" /> {heartImpact}
            </span>
          </div>

          <div className="flex flex-col items-center py-1 border-x border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sugar Spike</span>
            <span className={`font-display font-bold text-xs flex items-center gap-0.5 mt-0.5 ${sugarImpact === 'High Spike' ? 'text-amber-600' : 'text-emerald-700'}`}>
              <Zap size={13} className="shrink-0" /> {sugarImpact}
            </span>
          </div>

          <div className="flex flex-col items-center py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digestive</span>
            <span className="font-display font-bold text-xs text-slate-700 flex items-center gap-0.5 mt-0.5">
              <Scale size={13} className="shrink-0" /> {digestiveImpact}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Targeted Health Warnings & Health Profile Callouts (Stitch Reference Lines 18-19) */}
      <div className="flex flex-col gap-2.5 mb-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-slate-900 font-display font-bold text-sm">
            <ShieldCheck size={17} className="text-primary" />
            <span>Targeted Health Warnings</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            {triggeredList.length} critical {triggeredList.length === 1 ? 'flag' : 'flags'}
          </span>
        </div>

        {triggeredList.length > 0 ? (
          triggeredList.map((w, idx) => (
            <div 
              key={idx}
              className="bg-rose-50/90 border border-rose-200/80 rounded-2xl p-3.5 shadow-xs flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <AlertTriangle size={16} />
              </div>

              <div className="flex flex-col min-w-0 flex-1 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-display font-bold text-rose-950 text-xs">
                    {w.label} Alert
                  </span>
                  <span className="text-[9px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full uppercase border border-rose-200">
                    High Risk
                  </span>
                </div>

                <p className="text-rose-800 text-[11px] leading-relaxed mt-0.5 font-medium">
                  {w.reason || 'Contains ingredients conflicting with your selected conditions.'}
                </p>

                {w.triggering_ingredients?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {w.triggering_ingredients.map((ing, i) => (
                      <span 
                        key={i} 
                        className="text-[9px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-xs"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check size={16} strokeWidth={3} />
            </div>
            <div className="flex flex-col text-xs">
              <span className="font-display font-bold text-emerald-950">
                Matches Your Health Profile
              </span>
              <span className="text-emerald-700 text-[11px] mt-0.5">
                No high-risk allergen or condition conflict detected for your active health conditions.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Nutritional Ledger: Macro Nutrients Grid (Stitch Reference Lines 20-84) */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 mb-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h2 className="font-display font-bold text-slate-900 text-sm">
            Nutritional Ledger
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Per serving (70g)
          </span>
        </div>

        {/* 2x2 Macro Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Energy */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider">Energy</span>
              <Flame size={15} className="text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="font-display font-extrabold text-slate-900 text-lg tabular-nums">
                {nutrition.calories || 310}
              </span>
              <span className="text-xs text-slate-400 font-semibold ml-1">kcal</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, ((nutrition.calories || 310) / 600) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider">Total Carbs</span>
              <Activity size={15} className="text-primary" />
            </div>
            <div className="mt-2">
              <span className="font-display font-extrabold text-slate-900 text-lg tabular-nums">
                {nutrition.carbs || 42}
              </span>
              <span className="text-xs text-slate-400 font-semibold ml-1">g</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, ((nutrition.carbs || 42) / 60) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Protein */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider">Protein</span>
              <Scale size={15} className="text-emerald-600" />
            </div>
            <div className="mt-2">
              <span className="font-display font-extrabold text-slate-900 text-lg tabular-nums">
                {nutrition.protein || 6.2}
              </span>
              <span className="text-xs text-slate-400 font-semibold ml-1">g</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, ((nutrition.protein || 6.2) / 20) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Sodium */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between ${nutrition.sodium > 600 ? 'bg-rose-50/80 border-rose-200 text-rose-950' : 'bg-slate-50 border-slate-200/60'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider">
                Sodium {nutrition.sodium > 600 ? '(Critical)' : ''}
              </span>
              <AlertTriangle size={15} className="text-rose-600" />
            </div>
            <div className="mt-2">
              <span className="font-display font-extrabold text-lg tabular-nums">
                {nutrition.sodium || 840}
              </span>
              <span className="text-xs opacity-75 font-semibold ml-1">mg</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-rose-600 h-full rounded-full" 
                style={{ width: `${Math.min(100, ((nutrition.sodium || 840) / 1000) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Ingredient Health Breakdown */}
      {product.ingredients?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 mb-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 className="font-display font-bold text-slate-900 text-sm">
              Ingredient Breakdown
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {product.ingredients.length} items
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {product.ingredients.map((ing, i) => {
              const isHarmful = ing.type === 'harmful';
              const isBeneficial = ing.type === 'beneficial';
              return (
                <div 
                  key={i} 
                  className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-start gap-3"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs ${
                    isHarmful 
                      ? 'bg-rose-100 text-rose-700' 
                      : isBeneficial 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isHarmful ? '!' : isBeneficial ? '✓' : '•'}
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-slate-900 truncate">
                        {ing.name}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isHarmful 
                          ? 'bg-rose-100 text-rose-700' 
                          : isBeneficial 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-200 text-slate-600'
                      }`}>
                        {ing.type || 'Standard'}
                      </span>
                    </div>
                    {ing.reason && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                        {ing.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Gemini AI Healthier Alternatives Carousel (Stitch Reference Lines 87-178) */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <div className="flex items-center gap-1.5 text-slate-900 font-display font-bold text-sm">
            <Sparkles size={16} className="text-primary" />
            <span>Gemini AI Alternatives</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            In-Stock Nearby
          </span>
        </div>

        {/* Carousel Container */}
        {alternatives.length > 0 ? (
          <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar snap-x snap-mandatory">
            {alternatives.map((alt, idx) => (
              <div 
                key={idx}
                className="w-[280px] shrink-0 snap-start bg-white rounded-2xl p-4 shadow-xs border border-emerald-200/80 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-sm"
              >
                {/* Top Badge */}
                <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1">
                  <Check size={11} strokeWidth={3} />
                  <span>{idx === 0 ? 'Top Match' : 'Alternative'}</span>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 shadow-xs">
                      🍜
                    </div>
                    <div className="min-w-0 pr-10">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Aisle 4 • Top Shelf
                      </span>
                      <h3 className="font-display font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                        {alt.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {alt.brand}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 py-1.5">
                    {/* Health score badge */}
                    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-display font-black text-sm shrink-0">
                      {alt.estimated_score || 85}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        Optimal Healthy Fit
                      </span>
                      <span className="font-display font-bold text-slate-900 text-xs">
                        Better Nutrition
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-medium mt-2">
                    {alt.why_healthier || 'Cleaner whole grain alternative with reduced sodium and no refined starch.'}
                  </p>
                </div>

                <button 
                  onClick={() => handleSelectAlternative(alt)}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs py-2.5 px-3 rounded-full shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Switch to {alt.name.split(' ')[0]}</span>
                </button>
              </div>
            ))}
          </div>
        ) : loadingAlternatives ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 text-center flex flex-col items-center justify-center">
            <RefreshCw size={24} className="text-primary animate-spin mb-2" />
            <p className="text-xs font-semibold text-slate-600">AI is analyzing healthier alternatives in your aisle...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 text-center">
            <p className="text-xs text-slate-500 mb-3 font-medium">Discover similar supermarket items with higher wellness scores.</p>
            {alternativesError && <p className="text-[11px] text-rose-600 mb-2 font-medium">{alternativesError}</p>}
            <button 
              onClick={handleFetchAlternatives}
              className="px-5 py-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary font-display font-bold text-xs rounded-full transition-all active:scale-95 flex items-center justify-center gap-1.5 mx-auto"
            >
              <Sparkles size={14} /> Find Healthy Alternatives
            </button>
          </div>
        )}
      </div>

      {/* 8. Sticky Bottom Action Dock (Stitch Reference Lines 179-181) */}
      <aside 
        aria-label="Quick Pay Checkout Dock" 
        className="fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-floating"
      >
        <div className="max-w-md mx-auto flex items-center gap-2.5">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 border border-slate-200/80">
            <button 
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-xs active:scale-90 transition-transform disabled:opacity-40"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <span className="font-display font-bold text-sm text-slate-900 w-5 text-center tabular-nums">
              {quantity}
            </span>
            <button 
              onClick={incrementQuantity}
              aria-label="Increase quantity"
              className="w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-xs active:scale-90 transition-transform"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Primary Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            disabled={addingToCart}
            className={`flex-1 py-3 px-4 rounded-full font-display font-bold text-sm shadow-coral transition-transform active:scale-[0.98] flex items-center justify-between text-white ${
              added 
                ? 'bg-emerald-600' 
                : 'bg-primary hover:bg-primary-600'
            }`}
          >
            <div className="flex items-center gap-2">
              {addingToCart ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : added ? (
                <Check size={18} strokeWidth={2.5} />
              ) : (
                <ShoppingCart size={17} strokeWidth={2.5} />
              )}
              <span>{added ? 'Added to Cart!' : addingToCart ? 'Adding...' : selectedAlternative ? `Add ${selectedAlternative.name.split(' ')[0]}` : 'Add to Cart'}</span>
            </div>
            <span className="font-display font-extrabold text-base tabular-nums">
              ₹{((selectedAlternative ? (selectedAlternative.price || product.price) : product.price) * quantity).toFixed(2)}
            </span>
          </button>
        </div>
      </aside>

    </div>
  );
};

export default HealthInfoScreen;
