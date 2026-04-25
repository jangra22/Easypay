import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import { ArrowLeft, Flashlight, Store, ArrowRight, HelpCircle, X, ShieldCheck, ShoppingCart, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ScannerScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // Scanned Product State
  const [scannedProduct, setScannedProduct] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [healthScore, setHealthScore] = useState(null);
  const [healthWarnings, setHealthWarnings] = useState(null);

  const readerRef = React.useRef(null);
  const scanningRef = React.useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    api.getProducts().then(setProducts).catch(() => {});
    updateCartCount();
    
    // Auto-start scanner
    startScanner();
    
    return () => {
      if (readerRef.current) readerRef.current.reset();
    };
  }, []);

  const updateCartCount = async () => {
    try {
      const cart = await api.getCart(user?.email);
      const count = cart.items.reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(count);
    } catch (err) {}
  };

  const startScanner = async () => {
    if (!readerRef.current) return;
    setIsScanning(true);
    scanningRef.current = true;
    setLoading(true);
    setError(null);
    setScannedProduct(null);
    
    try {
      const devices = await readerRef.current.listVideoInputDevices();
      if (!devices || devices.length === 0) throw new Error("No camera found.");

      const targetDevice = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('environment')
      ) || devices[0];
      
      readerRef.current.reset();
      readerRef.current.decodeFromConstraints(
        { video: { deviceId: targetDevice.deviceId, facingMode: "environment" } },
        'video',
        (result) => {
          if (result && scanningRef.current) {
            scanningRef.current = false;
            if (window.navigator.vibrate) window.navigator.vibrate(200);
            handleScanSuccess(result.getText());
          }
        }
      );
      setLoading(false);
    } catch (e) {
      setIsScanning(false);
      scanningRef.current = false;
      setLoading(false);
      setError(e.message || "Camera access denied.");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !readerRef.current) return;

    setLoading(true);
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      const result = await readerRef.current.decodeFromImageUrl(url);
      if (result) {
        if (window.navigator.vibrate) window.navigator.vibrate(200);
        handleScanSuccess(result.getText());
      }
    } catch (err) {
      setError("Could not find a valid barcode in the image. Please try again with a clearer photo.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (barcode) => {
    setLoading(true);
    setError(null);
    try {
      const product = await api.getProductByBarcode(barcode);
      setScannedProduct(product);
      setIsScanning(false);
      if (readerRef.current) readerRef.current.reset();

      const conditions = user?.health_conditions || [];
      const [scoreRes, warningsRes] = await Promise.all([
        api.calculateScore(barcode, conditions).catch(() => null),
        api.getWarnings(barcode, conditions).catch(() => null)
      ]);
      setHealthScore(scoreRes);
      setHealthWarnings(warningsRes);
    } catch (err) {
      setError("Product not found or Barcode invalid.");
      setIsScanning(false);
      // Don't auto-restart scanner immediately if there's an error shown
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
      updateCartCount();
      setTimeout(() => {
        setAdded(false);
        setScannedProduct(null);
        startScanner();
      }, 1500);
    } catch (err) {
      setError("Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] bg-black overflow-hidden flex flex-col">
      {/* Background Video */}
      <video id="video" className="absolute inset-0 w-full h-full object-cover" autoPlay muted playsInline></video>
      
      {/* Dark Overlay with Transparent Cutout for Scanner */}
      {!scannedProduct && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Top overlay */}
          <div className="absolute top-0 w-full h-[25%] bg-black/60 backdrop-blur-[2px]"></div>
          {/* Bottom overlay */}
          <div className="absolute bottom-0 w-full h-[45%] bg-black/60 backdrop-blur-[2px]"></div>
          {/* Left overlay */}
          <div className="absolute top-[25%] left-0 w-[15%] h-[30%] bg-black/60 backdrop-blur-[2px]"></div>
          {/* Right overlay */}
          <div className="absolute top-[25%] right-0 w-[15%] h-[30%] bg-black/60 backdrop-blur-[2px]"></div>
          
          {/* Center transparent frame with orange brackets */}
          <div className="absolute top-[25%] left-[15%] w-[70%] h-[30%] flex items-center justify-center">
             {/* Top-Left Corner */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl shadow-[0_0_15px_#f35919]"></div>
             {/* Top-Right Corner */}
             <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl shadow-[0_0_15px_#f35919]"></div>
             {/* Bottom-Left Corner */}
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl shadow-[0_0_15px_#f35919]"></div>
             {/* Bottom-Right Corner */}
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl shadow-[0_0_15px_#f35919]"></div>
             
             {isScanning && (
               <motion.div 
                 animate={{ top: ["0%", "100%", "0%"] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 className="absolute left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_#f35919] z-20"
               />
             )}
          </div>
          
          <div className="absolute top-[58%] w-full text-center">
            <span className="bg-black/50 text-white/90 text-sm px-4 py-2 rounded-full backdrop-blur-md">
              Align QR/Barcode within the frame
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-20 flex justify-between items-center p-6 text-white pt-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Scan to Shop</h1>
        <div className="flex gap-2">
          <label className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 cursor-pointer hover:bg-black/60 transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <RefreshCw size={18} className="text-white" />
          </label>
          <button onClick={startScanner} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
            <Flashlight size={20} />
          </button>
        </div>
      </div>

      {loading && !scannedProduct && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <RefreshCw className="text-primary animate-spin" size={40} />
        </div>
      )}

      {error && !scannedProduct && (
        <div className="absolute top-24 left-6 right-6 z-30 bg-danger text-white p-4 rounded-xl text-center shadow-lg flex flex-col items-center gap-3">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => { setError(null); startScanner(); }} 
            className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {/* Scanned Product Popup */}
      <AnimatePresence>
        {scannedProduct && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 w-full h-[85%] bg-gray-bg rounded-t-[2rem] z-40 p-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
            
            <button onClick={() => { setScannedProduct(null); startScanner(); }} className="absolute top-6 right-6 p-2 bg-gray-100 text-gray-500 rounded-full">
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center">
              <div className="text-6xl mb-4 bg-white shadow-sm w-24 h-24 flex items-center justify-center rounded-3xl border border-gray-100">
                {scannedProduct.emoji || '📦'}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center px-4">{scannedProduct.name}</h2>
              <p className="text-gray-500 font-medium text-sm mb-4">{scannedProduct.brand}</p>
              
              <div className="text-3xl font-bold text-gray-900 mb-6">
                 ₹{(scannedProduct.price || 0).toFixed(2)}
              </div>

              {healthScore && (
                <div onClick={() => navigate(`/health/analysis/${scannedProduct.barcode}`)} className="cursor-pointer mb-6 w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 relative flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className={`w-full h-full transform -rotate-90 ${healthScore.score_color === 'red' ? 'text-danger' : healthScore.score_color === 'green' ? 'text-success' : 'text-warning'}`}>
                        <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="text-current" strokeDasharray={`${healthScore.personalized_score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      <span className="absolute font-bold text-sm text-gray-900">{healthScore.personalized_score}</span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold">Health Score</p>
                      <p className="text-xs text-primary font-medium">View Analysis & Alternatives</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-400" />
                </div>
              )}

              {healthWarnings?.triggered_warnings?.length > 0 && (
                <div className="w-full bg-danger-bg border border-danger/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                   <ShieldCheck size={20} className="text-danger shrink-0 mt-0.5" />
                   <p className="text-sm font-medium text-danger text-left">
                      High Risk Ingredients Detected based on your health profile.
                   </p>
                </div>
              )}
            </div>

            <div className="pt-4 shrink-0">
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart || added}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                  added ? 'bg-success text-white' : 'bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20'
                }`}
              >
                {addingToCart ? <RefreshCw size={22} className="animate-spin" /> : 
                 added ? <Check size={22} /> : <ShoppingCart size={22} />}
                {added ? 'Added to Cart' : `Add to Cart — ₹${(scannedProduct.price * quantity).toFixed(2)}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet for Manual Entry */}
      <div className="absolute bottom-0 left-0 w-full bg-[#2a2420] rounded-t-3xl z-20 pb-8 px-6 pt-4">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
        <div className="flex flex-col gap-4">
          <label className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 font-bold transition-colors cursor-pointer active:scale-95">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              className="hidden" 
            />
            <RefreshCw size={20} className="text-primary" />
            Upload barcode photo instead
          </label>

          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              if (manualBarcode.trim()) {
                  handleScanSuccess(manualBarcode.trim());
                  setManualBarcode('');
              }
            }} 
            className="flex space-x-3"
          >
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-primary transition-colors text-sm">
              <Store size={18} className="text-primary" />
              <input 
                type="text" 
                placeholder="Or type manual barcode..." 
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="bg-transparent text-white w-full outline-none font-medium placeholder:text-white/30"
              />
            </div>
            <button type="submit" className="bg-primary text-white px-5 rounded-xl font-bold flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-primary/20">
              <ArrowRight size={20} />
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 text-white/50 text-[10px] mt-6">
          <HelpCircle size={14} className="text-primary" />
          <span>Need help? <span className="text-white underline decoration-white/30 underline-offset-4 cursor-pointer hover:text-primary transition-colors">Ask store staff</span></span>
        </div>
      </div>
    </div>
  );
};

export default ScannerScreen;
