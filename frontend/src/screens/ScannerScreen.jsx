import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import { 
  ArrowLeft, Flashlight, Camera, RefreshCw, X, ShieldCheck, 
  ShoppingCart, Plus, Minus, ChevronRight, Sparkles, Check, 
  Keyboard, Image as ImageIcon, AlertTriangle, 
  Store, QrCode, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SAMPLE_BARCODES = [
  { name: 'Maggi Noodles', barcode: '8901030865213', emoji: '🍜' },
  { name: 'Lays Classic Salted', barcode: '8902080002879', emoji: '🍟' },
  { name: 'Real Mixed Fruit', barcode: '8901207003997', emoji: '🧃' },
  { name: 'Amul Butter', barcode: '8901058000108', emoji: '🧈' },
];

const ScannerScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setProducts] = useState([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  
  // Scanned Product State
  const [scannedProduct, setScannedProduct] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [healthScore, setHealthScore] = useState(null);
  const [healthWarnings, setHealthWarnings] = useState(null);
  const [alternative, setAlternative] = useState(null);

  const webcamRef = useRef(null);
  const readerRef = useRef(new BrowserMultiFormatReader());
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {});
    updateCartCount();
    startScanner();

    return () => {
      // Clean up camera stream and torch on unmount
      if (webcamRef.current?.video?.srcObject) {
        const stream = webcamRef.current.video.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Continuous auto-scan loop while camera is active
  useEffect(() => {
    if (!isScanning || scannedProduct || loading) return;

    const interval = setInterval(async () => {
      if (!webcamRef.current || !isScanning || scannedProduct) return;
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;
        const result = await readerRef.current.decodeFromImageUrl(imageSrc);
        if (result && result.getText()) {
          if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
          await handleScanSuccess(result.getText());
        }
      } catch {
        // No barcode detected in this frame tick, silently wait for next
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isScanning, scannedProduct, loading]);

  const updateCartCount = async () => {
    try {
      if (user?.email) {
        const cart = await api.getCart(user.email);
        const count = cart.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;
        setCartCount(count);
      }
    } catch {
      // Ignore background cart count errors
    }
  };

  const startScanner = () => {
    setIsScanning(true);
    setError(null);
    setScannedProduct(null);
    setQuantity(1);
    setAdded(false);
    setAlternative(null);
  };

  // Hardware torch toggle with fallback
  const toggleTorch = async () => {
    try {
      const track = webcamRef.current?.video?.srcObject?.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn }]
          });
          setTorchOn(!torchOn);
        } else {
          setTorchOn(!torchOn);
        }
      } else {
        setTorchOn(!torchOn);
      }
    } catch {
      setTorchOn(!torchOn);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const captureAndScan = async () => {
    if (!webcamRef.current) return;
    
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
    setLoading(true);
    setError(null);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Could not capture image from camera");
      
      const result = await readerRef.current.decodeFromImageUrl(imageSrc);
      if (result) {
        if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
        await handleScanSuccess(result.getText());
      }
    } catch {
      setError("No barcode detected in frame. Align the barcode within the coral reticle and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      const result = await readerRef.current.decodeFromImageUrl(url);
      if (result) {
        if (window.navigator?.vibrate) window.navigator.vibrate(200);
        setShowManualModal(false);
        await handleScanSuccess(result.getText());
      }
    } catch {
      setError("Could not read a valid barcode from the image. Please try a clearer photo or enter manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (barcode) => {
    setLoading(true);
    setError(null);
    setShowManualModal(false);
    try {
      const product = await api.getProductByBarcode(barcode);
      setScannedProduct(product);
      setIsScanning(false);

      const conditions = user?.health_conditions || [];
      const [scoreRes, warningsRes, altRes] = await Promise.all([
        api.calculateScore(barcode, conditions).catch(() => null),
        api.getWarnings(barcode, conditions).catch(() => null),
        api.getAlternatives(barcode, conditions, product?.base_score || 50).catch(() => null)
      ]);
      setHealthScore(scoreRes);
      setHealthWarnings(warningsRes);
      if (altRes?.alternatives?.length > 0) {
        setAlternative(altRes.alternatives[0]);
      }
    } catch {
      setError(`Product with barcode "${barcode}" not found in store database.`);
      setIsScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!scannedProduct) return;
    setAddingToCart(true);
    try {
      await api.addToCart(scannedProduct.barcode, quantity, user?.email);
      setAdded(true);
      await updateCartCount();
      setTimeout(() => {
        setAdded(false);
        setScannedProduct(null);
        startScanner();
      }, 1400);
    } catch {
      setError("Failed to add product to cart. Please check your connection.");
    } finally {
      setAddingToCart(false);
    }
  };

  const getScoreMeta = (score = 50) => {
    if (score >= 70) {
      return {
        stroke: '#10B981',
        bg: 'bg-emerald-50 text-emerald-950 border-emerald-200/80',
        badgeBg: 'bg-emerald-600 text-white',
        grade: 'Grade A',
        title: 'Nutrient Dense & Clean',
        desc: `EasyPay Wellness Score: Optimal (${score}/100)`,
        isAlert: false,
      };
    }
    if (score >= 40) {
      return {
        stroke: '#F59E0B',
        bg: 'bg-amber-50 text-amber-950 border-amber-200/80',
        badgeBg: 'bg-amber-500 text-white',
        grade: 'Grade C',
        title: 'Moderate Health Profile',
        desc: `EasyPay Wellness Score: Fair (${score}/100)`,
        isAlert: false,
      };
    }
    return {
      stroke: '#EF4444',
      bg: 'bg-rose-50 text-rose-950 border-rose-200/80',
      badgeBg: 'bg-rose-600 text-white',
      grade: 'Grade E',
      title: 'High Health Risk Detected',
      desc: `EasyPay Wellness Score: Poor (${score}/100)`,
      isAlert: true,
    };
  };

  const scoreValue = healthScore?.personalized_score ?? (scannedProduct?.base_score || 50);
  const scoreMeta = getScoreMeta(scoreValue);
  const primaryWarning = healthWarnings?.triggered_warnings?.[0];

  return (
    <div className="relative min-h-screen md:min-h-[844px] bg-slate-950 overflow-hidden flex flex-col select-none">
      
      {/* 1. Header Bar (Stitch Design: Clean Frosted Surface Header) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 h-16 flex items-center justify-between text-slate-900 shadow-sm transition-all">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          
          <div className="flex flex-col min-w-0">
            <h1 className="font-display font-bold text-lg text-slate-900 tracking-tight truncate flex items-center gap-2">
              <span>Live Scanner</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <span className="text-[11px] text-slate-500 font-medium truncate">EasyPay • Supermarket AI</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/cart"
            aria-label="View shopping cart"
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center relative transition-transform active:scale-95"
          >
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <Link
            to="/user"
            aria-label="View user profile"
            className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/20 bg-primary-50 text-primary font-bold flex items-center justify-center text-xs transition-transform active:scale-95"
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </Link>
        </div>
      </header>

      {/* 2. Full-Screen Camera Viewport Area */}
      <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-slate-950 min-h-[460px]">
        
        {/* Ambient Supermarket Viewport Background (Realistic store underlay) */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-35 scale-105 pointer-events-none" 
          style={{ 
            backgroundImage: "radial-gradient(ellipse at center, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%), url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80')" 
          }}
        />

        {/* Live Camera Stream */}
        {isScanning && !scannedProduct && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode }}
            className="absolute inset-0 w-full h-full object-cover z-0"
            onUserMediaError={() => setError("Camera access denied or unavailable. Please use manual entry or upload a photo below.")}
          />
        )}

        {/* Soft Vignette & Scan Contrast Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none z-10" />

        {/* Floating Top Utility HUD */}
        <div className="relative z-20 flex items-center justify-between w-full p-4 pt-3">
          {/* Store Location Micro Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/10 shadow-sm">
            <Store size={15} className="text-primary-300" />
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              {scannedProduct?.category ? `Aisle 4 • ${scannedProduct.category}` : 'Aisle 4 • Snacks'}
            </span>
          </div>

          {/* Action HUD Cluster */}
          <div className="flex items-center gap-2">
            {/* Torch Toggle */}
            <button
              onClick={toggleTorch}
              aria-label="Toggle flashlight"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                torchOn 
                  ? 'bg-primary text-white shadow-coral ring-2 ring-white/60' 
                  : 'bg-white/20 backdrop-blur-md text-white border border-white/15 hover:bg-white/30'
              }`}
            >
              <Flashlight size={19} />
            </button>

            {/* Flip Camera */}
            <button
              onClick={toggleFacingMode}
              aria-label="Flip camera lens"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/15 flex items-center justify-center hover:bg-white/30 active:scale-90 transition-transform"
            >
              <RefreshCw size={18} />
            </button>

            {/* Manual Barcode Input */}
            <button
              onClick={() => setShowManualModal(true)}
              aria-label="Enter barcode manually"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/15 flex items-center justify-center hover:bg-white/30 active:scale-90 transition-transform"
            >
              <Keyboard size={18} />
            </button>

            {/* Upload Barcode Image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload photo"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/15 flex items-center justify-center hover:bg-white/30 active:scale-90 transition-transform"
            >
              <ImageIcon size={18} />
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </div>
        </div>

        {/* Central Interactive Scanner Reticle */}
        {!scannedProduct && (
          <div className="relative z-20 self-center my-auto flex flex-col items-center">
            {/* Outer Reticle Box */}
            <div className="relative w-64 h-48 sm:w-72 sm:h-52 rounded-2xl flex items-center justify-center">
              
              {/* Four Chunky Corner Brackets (Google Stitch Sunset Coral) */}
              <div className="absolute top-0 left-0 w-9 h-9 border-t-[5px] border-l-[5px] border-primary rounded-tl-2xl shadow-[0_0_14px_rgba(243,89,25,0.7)]" />
              <div className="absolute top-0 right-0 w-9 h-9 border-t-[5px] border-r-[5px] border-primary rounded-tr-2xl shadow-[0_0_14px_rgba(243,89,25,0.7)]" />
              <div className="absolute bottom-0 left-0 w-9 h-9 border-b-[5px] border-l-[5px] border-primary rounded-bl-2xl shadow-[0_0_14px_rgba(243,89,25,0.7)]" />
              <div className="absolute bottom-0 right-0 w-9 h-9 border-b-[5px] border-r-[5px] border-primary rounded-br-2xl shadow-[0_0_14px_rgba(243,89,25,0.7)]" />

              {/* Animated Sweeping Laser Beam */}
              {isScanning && (
                <motion.div
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-3 right-3 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_14px_3px_rgba(243,89,25,0.85)] rounded-full z-20 pointer-events-none"
                />
              )}

              {/* Simulated Barcode Silhouette in Viewport */}
              <div className="flex items-center gap-1.5 opacity-25 px-6 py-4 pointer-events-none">
                <div className="w-1 h-14 bg-white rounded-full" />
                <div className="w-2.5 h-14 bg-white rounded-full" />
                <div className="w-0.5 h-14 bg-white rounded-full" />
                <div className="w-3 h-14 bg-white rounded-full" />
                <div className="w-1.5 h-14 bg-white rounded-full" />
                <div className="w-0.5 h-14 bg-white rounded-full" />
                <div className="w-2.5 h-14 bg-white rounded-full" />
                <div className="w-1 h-14 bg-white rounded-full" />
                <div className="w-3 h-14 bg-white rounded-full" />
              </div>

              {/* Detected Micro Ping Dot */}
              <div className="absolute w-3 h-3 rounded-full bg-primary animate-ping pointer-events-none opacity-60" />
            </div>

            {/* Instructional Micro-Label */}
            <div className="mt-4 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">
                Align barcode inside frame
              </span>
            </div>
          </div>
        )}

        {/* Bottom Status Pill & Shutter Trigger */}
        {!scannedProduct && (
          <div className="relative z-20 flex flex-col items-center gap-3 p-4 pb-6">
            {/* Status Line */}
            <div className="flex items-center justify-between w-full text-slate-200 text-xs px-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-primary-300" />
                <span className="font-medium text-[11px]">AI Vision v3.4 Active • Instant Match</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-white border border-white/10">
                60 FPS
              </span>
            </div>

            {/* Shutter Capture Button */}
            <div className="w-full flex items-center justify-center gap-3">
              <button
                onClick={captureAndScan}
                disabled={loading}
                className="w-full max-w-xs bg-white hover:bg-slate-50 text-slate-900 font-display font-bold py-3.5 px-6 rounded-full shadow-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-all disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin text-primary" />
                    <span>Scanning frame...</span>
                  </>
                ) : (
                  <>
                    <Camera size={19} className="text-primary" />
                    <span>Capture Barcode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Error Banner */}
      {error && !scannedProduct && (
        <div className="absolute top-20 left-4 right-4 z-40 bg-rose-950/90 backdrop-blur-md border border-rose-500/30 text-rose-100 p-3.5 rounded-2xl shadow-2xl flex items-start gap-3 animate-fade-in">
          <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium leading-relaxed text-rose-200">{error}</p>
            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={startScanner} 
                className="text-xs font-bold text-primary-300 hover:text-white flex items-center gap-1"
              >
                <RefreshCw size={12} /> Retry Camera
              </button>
              <button 
                onClick={() => { setError(null); setShowManualModal(true); }} 
                className="text-xs font-bold text-white hover:underline"
              >
                Type Barcode
              </button>
            </div>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white p-1">
            <X size={15} />
          </button>
        </div>
      )}

      {/* 4. Instant Scan Result Slide-up Bottom Sheet (Exact Google Stitch Design) */}
      <AnimatePresence>
        {scannedProduct && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute bottom-0 left-0 w-full max-h-[88vh] bg-white rounded-t-[2.5rem] z-40 p-4 pt-3 flex flex-col shadow-2xl border-t border-slate-100 overflow-hidden"
          >
            {/* Sheet Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

            {/* Success Match Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check size={13} strokeWidth={3} />
                </div>
                <span className="font-display font-bold text-xs text-emerald-700">Barcode Verified</span>
                <span className="text-[11px] font-mono text-slate-400">• {scannedProduct.barcode}</span>
              </div>
              <button 
                onClick={() => { setScannedProduct(null); startScanner(); }}
                aria-label="Dismiss scan result"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-2">
              
              {/* Product Card Header Bento */}
              <div className="flex items-start gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                {/* Thumbnail with Image Support & Emoji Fallback */}
                <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-white shadow-xs border border-slate-100 flex items-center justify-center p-1 text-4xl">
                  {scannedProduct.image_url ? (
                    <img 
                      src={scannedProduct.image_url} 
                      alt={scannedProduct.name}
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
                    style={{ display: scannedProduct.image_url ? 'none' : 'flex' }}
                    className="text-4xl items-center justify-center"
                  >
                    {scannedProduct.emoji || '📦'}
                  </span>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/75 text-white text-[9px] font-bold">
                    Unit
                  </span>
                </div>

                {/* Title, Brand & Price Meta */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                      {scannedProduct.brand || 'Supermarket'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-semibold text-primary">
                      {scannedProduct.category || 'Product'}
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {scannedProduct.name}
                  </h2>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-slate-900 text-xl tabular-nums">
                        ₹{(scannedProduct.price || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        In Stock
                      </span>
                    </div>
                    
                    {/* Stepper Modifier */}
                    <div className="flex items-center gap-1.5 bg-white rounded-full p-1 border border-slate-200 shadow-xs">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="text-xs font-bold text-slate-900 tabular-nums px-1">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Instant Assessment Score Badge */}
              <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${scoreMeta.bg}`}>
                <div className="flex items-center gap-3">
                  {/* Radial Gauge */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-12 h-12 -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" fill="none" />
                      <circle 
                        cx="24" 
                        cy="24" 
                        r="20" 
                        stroke={scoreMeta.stroke} 
                        strokeWidth="4" 
                        strokeDasharray="125.6" 
                        strokeDashoffset={125.6 - (125.6 * (scoreValue / 100))} 
                        strokeLinecap="round" 
                        fill="none" 
                      />
                    </svg>
                    <span className="absolute font-display font-extrabold text-slate-900 text-sm">
                      {scoreValue}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      {scoreMeta.isAlert ? (
                        <AlertTriangle size={15} className="text-rose-600" />
                      ) : (
                        <ShieldCheck size={15} style={{ color: scoreMeta.stroke }} />
                      )}
                      <span className="font-display font-bold text-xs tracking-tight">
                        {scoreMeta.title}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-80 font-medium">
                      {scoreMeta.desc}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scoreMeta.badgeBg}`}>
                  {scoreMeta.grade}
                </span>
              </div>

              {/* Personalized Health Profile Callout */}
              {primaryWarning ? (
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200/80">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Heart size={16} className="fill-primary" />
                    </div>
                    <div className="flex flex-col text-xs min-w-0">
                      <span className="font-display font-bold text-slate-900">
                        Violates your {primaryWarning.label || 'Health'} Profile
                      </span>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        {primaryWarning.reason || 'Contains ingredients conflicting with your selected conditions.'}
                      </p>
                      {primaryWarning.triggering_ingredients?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mt-2">
                          <span className="flex items-center gap-1 font-semibold text-rose-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            {primaryWarning.triggering_ingredients[0]}
                          </span>
                          {primaryWarning.triggering_ingredients.slice(1).map((ing) => (
                            <React.Fragment key={ing}>
                              <span className="text-slate-400">•</span>
                              <span className="font-medium text-slate-600">{ing}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : user?.health_conditions?.length > 0 ? (
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <div className="flex flex-col text-xs">
                    <span className="font-display font-bold text-emerald-900">
                      Matches Your Health Profile
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      No dietary conflicts detected for your active health conditions.
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Healthier Swap Available Card */}
              <Link 
                to={`/health/analysis/${scannedProduct.barcode}`}
                className="flex items-center justify-between p-3 pl-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl hover:bg-emerald-50 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles size={18} className="text-emerald-600 shrink-0" />
                  <div className="flex flex-col truncate">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Healthier Swap Available
                    </span>
                    <span className="text-xs text-slate-800 truncate font-medium">
                      {alternative?.name 
                        ? `Try ${alternative.name} (Score ${alternative.estimated_score || 85})` 
                        : 'Tap to view AI nutritional breakdown & alternatives'}
                    </span>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-white text-emerald-700 font-display font-bold text-xs shadow-xs border border-emerald-200/80 hover:bg-emerald-50 shrink-0 active:scale-95 transition-all">
                  View
                </span>
              </Link>

            </div>

            {/* Bottom Actions */}
            <div className="pt-2 shrink-0 flex flex-col gap-2">
              {/* Primary Add to Cart Action */}
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart || added}
                className={`w-full py-3.5 px-4 rounded-full font-display font-bold text-base flex items-center justify-center gap-2 shadow-coral transition-transform active:scale-[0.98] ${
                  added 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-primary hover:bg-primary-600 text-white'
                }`}
              >
                {addingToCart ? (
                  <>
                    <RefreshCw size={19} className="animate-spin" />
                    <span>Adding to Cart...</span>
                  </>
                ) : added ? (
                  <>
                    <Check size={20} strokeWidth={2.5} />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={19} strokeWidth={2.5} />
                    <span>Add to Cart — ₹{((scannedProduct.price || 0) * quantity).toFixed(2)}</span>
                  </>
                )}
              </button>

              {/* Secondary Deep Health Analysis Action */}
              <Link 
                to={`/health/analysis/${scannedProduct.barcode}`}
                className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
              >
                <Sparkles size={15} className="text-primary" />
                <span>View Full AI Health Analysis</span>
              </Link>

              {/* Dismiss / Scan Another */}
              <button
                onClick={() => { setScannedProduct(null); startScanner(); }}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 text-center py-1 flex items-center justify-center gap-1.5 mx-auto active:scale-95 transition-colors"
              >
                <QrCode size={13} />
                <span>Scan Another Item</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Manual Barcode Input & Test Sheet */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-3">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
                    <Keyboard size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Enter Barcode</h3>
                    <p className="text-[11px] text-slate-400">Type digits or choose a sample product</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualBarcode.trim()) {
                    handleScanSuccess(manualBarcode.trim());
                    setManualBarcode('');
                  }
                }}
                className="flex gap-2 mb-4"
              >
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 focus-within:border-primary text-sm">
                  <QrCode size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. 8901030865213"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    className="bg-transparent text-slate-900 w-full outline-none font-medium placeholder:text-slate-400 text-xs"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!manualBarcode.trim()}
                  className="bg-primary hover:bg-primary-600 disabled:opacity-50 text-white px-4 rounded-xl font-bold text-xs flex items-center justify-center active:scale-95 transition-all shadow-coral-sm"
                >
                  Look Up
                </button>
              </form>

              {/* Quick Sample Barcode Pills */}
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Sample Store Barcodes
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_BARCODES.map((item) => (
                    <button
                      key={item.barcode}
                      onClick={() => handleScanSuccess(item.barcode)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl p-2.5 text-left flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-xs truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{item.barcode}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload photo button */}
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <ImageIcon size={15} />
                <span>Upload barcode photo from gallery</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ScannerScreen;
