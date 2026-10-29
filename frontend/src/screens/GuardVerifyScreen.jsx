import React, { useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  ShieldCheck, XCircle, CheckCircle2, Ticket, ArrowLeft, 
  RefreshCw, KeyRound, User, QrCode, LogOut, ChevronRight, 
  Package, Image as ImageIcon, Check, AlertTriangle, 
  Store, Clock, FileCheck, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { BrowserMultiFormatReader } from '@zxing/library';
import { AnimatePresence, motion } from 'framer-motion';

function GuardVerifyScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guardInfo, setGuardInfo] = useState(null);
  const [loginForm, setLoginForm] = useState({ guard_id: '', password: '' });
  const [scanCount, setScanCount] = useState(0);
  
  // App views: 'LOGIN' -> 'DASHBOARD' -> 'SCANNER' -> 'RESULT' 
  const [currentView, setCurrentView] = useState('LOGIN');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liveOrders, setLiveOrders] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load guard session on mount
  useEffect(() => {
    const saved = localStorage.getItem('guard_session');
    if (saved) {
      try {
        const info = JSON.parse(saved);
        setGuardInfo(info);
        setIsLoggedIn(true);
        setCurrentView('DASHBOARD');
        fetchScanCount(info.guard_id);
        fetchLiveOrders();
      } catch {
        localStorage.removeItem('guard_session');
      }
    }
  }, []);

  const fetchScanCount = async (guardId) => {
    try {
      const data = await api.getGuardScanCount(guardId);
      setScanCount(data.scan_count);
    } catch (err) {
      console.error("Failed to fetch scan count", err);
    }
  };

  const fetchLiveOrders = async () => {
    setIsRefreshing(true);
    try {
      const orders = await api.getGuardOrders();
      setLiveOrders(orders);
    } catch (err) {
      console.error("Failed to fetch live orders", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let html5QrCode;
    
    const startScanning = async () => {
      if (currentView === 'SCANNER') {
        try {
          html5QrCode = new Html5Qrcode("guard-qr-reader");
          const config = { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [ 
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E
            ]
          };

          await html5QrCode.start(
            { facingMode: "environment" }, 
            config,
            (decodedText) => {
              html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
              }).catch(() => {
                onScanSuccess(decodedText);
              });
            },
            () => {
              // Ignore frame decode errors
            }
          );
        } catch (err) {
          console.error("Camera start error", err);
          setError("Could not start camera. Please verify device permissions or upload a QR image.");
        }
      }
    };

    startScanning();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Stop failed", err));
      }
    };
  }, [currentView]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new BrowserMultiFormatReader();
      const url = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(url);
      if (result) {
        if (window.navigator?.vibrate) window.navigator.vibrate(200);
        onScanSuccess(result.getText());
      }
    } catch (err) {
      alert("Could not find a valid QR code in the image. Please try again with a clearer photo.");
      setLoading(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    setCurrentView('RESULT');
    setLoading(true);
    try {
      const orderIdToVerify = decodedText.trim();
      const data = await api.guardVerifyOrder(orderIdToVerify, guardInfo?.guard_id);
      setOrderData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Invalid QR code or order not found');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!orderData?.order_id || !guardInfo?.guard_id) return;
    setLoading(true);
    try {
      await api.confirmGuardOrder(orderData.order_id, guardInfo.guard_id);
      setOrderData(prev => ({ ...prev, is_used: true }));
      fetchScanCount(guardInfo.guard_id);
      fetchLiveOrders();
      setError(null);
      setTimeout(() => setCurrentView('SCANNER'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to confirm order clearance');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (orderId) => {
    setCurrentView('RESULT');
    setLoading(true);
    try {
      const order = await api.getOrder(orderId);
      setOrderData({
        order_id: order.order_id,
        items: order.items || [],
        total_paid: order.total,
        is_used: order.is_used,
        user_name: order.user_name,
        created_at: order.created_at
      });
      setError(null);
    } catch (err) {
      setError('Could not load order details');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.guardLogin(loginForm.guard_id, loginForm.password);
      setGuardInfo(data);
      setIsLoggedIn(true);
      setCurrentView('DASHBOARD');
      localStorage.setItem('guard_session', JSON.stringify(data));
      fetchScanCount(data.guard_id);
      fetchLiveOrders();
    } catch (err) {
      setError("Invalid Guard ID or Password. Try guard1 / 123");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('guard_session');
    setIsLoggedIn(false);
    setGuardInfo(null);
    setCurrentView('LOGIN');
  };

  const resetToDashboard = () => {
    setOrderData(null);
    setError(null);
    setCurrentView('DASHBOARD');
    fetchLiveOrders();
  };

  // --- 1. Login View ---
  if (currentView === 'LOGIN') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 py-8 w-full max-w-md mx-auto animate-fade-in select-none">
        
        {/* Guard Portal Branding */}
        <div className="flex flex-col items-center mt-6 mb-8 text-center">
          <div className="w-16 h-16 bg-primary-50 text-primary rounded-2xl flex items-center justify-center shadow-xs border border-primary-200/60 mb-4">
            <ShieldCheck size={36} />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-primary font-display font-extrabold bg-primary-50 px-2.5 py-0.5 rounded-full mb-1 border border-primary-100">
            Security Clearance Terminal
          </span>
          <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
            Guard Portal
          </h1>
          <p className="text-slate-500 text-xs mt-1 max-w-[280px]">
            Authorized personnel login for supermarket exit gate clearance and receipt verification.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex-1 flex flex-col justify-between">
          <div className="space-y-3.5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mb-4">
            <div>
              <label className="block text-xs font-display font-bold text-slate-700 mb-1.5">
                Personnel Guard ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input 
                  type="text"
                  required
                  placeholder="e.g. guard1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary outline-none transition-all"
                  value={loginForm.guard_id}
                  onChange={(e) => setLoginForm({...loginForm, guard_id: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-slate-700 mb-1.5">
                Terminal Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary outline-none transition-all"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
            </div>

            {/* Test Credentials Helper */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Demo login:</span>
              <button 
                type="button"
                onClick={() => setLoginForm({ guard_id: 'guard1', password: '123' })}
                className="font-mono font-bold text-primary hover:underline"
              >
                guard1 / 123 (Auto-fill)
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-rose-700 text-xs text-center bg-rose-50 py-2.5 px-3 rounded-xl border border-rose-200 font-semibold animate-fade-in flex items-center justify-center gap-1.5">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-600 active:scale-95 text-white py-3.5 rounded-full font-display font-bold text-sm transition-all shadow-coral disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin" size={17} />
                  <span>Authenticating...</span>
                </span>
              ) : (
                <span>Log In to Terminal</span>
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => window.location.href = '/'}
              className="w-full mt-3 text-xs text-slate-500 hover:text-slate-800 font-display font-bold flex items-center justify-center gap-1.5 py-2 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Customer Store Feed
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- 2. Dashboard View ---
  if (currentView === 'DASHBOARD') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 py-4 w-full max-w-md mx-auto animate-fade-in select-none pb-28">
        
        {/* Guard Header & Stats Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 mb-4 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-emerald-400">
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-300 font-display font-extrabold uppercase tracking-wider">
                    Gate Station Active
                  </span>
                </div>
                <h2 className="text-lg font-display font-extrabold text-white tracking-tight">
                  {guardInfo?.name || 'Gate Officer'}
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: #{guardInfo?.guard_id || 'guard1'} • Gate B
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout} 
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-slate-300 hover:text-white"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
          
          {/* Bento Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Verified Passes</span>
              <span className="text-2xl font-display font-black text-white tabular-nums">{scanCount}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Store Hub</span>
              <span className="text-xs font-display font-bold text-white block mt-1.5 truncate">HyperMarket #104</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button: Launch Scanner */}
        <button 
          onClick={() => setCurrentView('SCANNER')}
          className="w-full bg-primary hover:bg-primary-600 text-white rounded-3xl p-5 mb-4 flex items-center justify-between shadow-coral active:scale-[0.98] transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 bg-white/20 rounded-2xl flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <QrCode size={28} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-base text-white">
                  Scan Exit QR Pass
                </span>
                <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                  Live
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium mt-0.5">
                Verify customer exit pass & bag items
              </p>
            </div>
          </div>
          <ChevronRight className="text-white/80 group-hover:translate-x-1 transition-transform" size={22} />
        </button>

        {/* Recent System Orders Feed */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-slate-400" />
              <h3 className="text-xs font-display font-bold text-slate-900 uppercase tracking-wider">
                Recent Store Orders
              </h3>
            </div>
            <button 
              onClick={fetchLiveOrders}
              className="text-xs text-primary font-display font-bold flex items-center gap-1 hover:text-primary-600 transition-colors bg-primary-50 px-2.5 py-1 rounded-full active:scale-95"
            >
              <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {liveOrders.map((order, idx) => (
              <button 
                key={idx} 
                onClick={() => handleOrderClick(order.order_id)}
                className="w-full text-left bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs active:scale-[0.98] transition-all hover:border-primary/40 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    order.is_used 
                      ? 'bg-slate-100 text-slate-400' 
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <Package size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-slate-900 text-xs truncate">
                      {order.user_name || 'Customer'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      #{order.order_id?.slice(0, 8).toUpperCase()} • {order.item_count || 1} items • ₹{order.total}
                    </p>
                  </div>
                </div>
                
                <div className="shrink-0 ml-2">
                  {order.is_used ? (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-display font-bold uppercase tracking-wider rounded-full">
                      Cleared
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-display font-bold uppercase tracking-wider rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                      Ready
                    </span>
                  )}
                </div>
              </button>
            ))}
            
            {liveOrders.length === 0 && !loading && (
              <div className="text-center py-10 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <Package className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 font-medium text-xs">No recent checkout orders</p>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  // --- 3. Scanner & Verification Result Views ---
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 py-3 w-full max-w-md mx-auto animate-fade-in select-none pb-28">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-3 mt-1">
        <button 
          onClick={resetToDashboard}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <span className="font-display font-extrabold text-slate-900 text-base tracking-tight">
          {currentView === 'SCANNER' ? 'Gate Turnstile Scanner' : 'Clearance Verification'}
        </span>
        <div className="w-9" />
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'SCANNER' ? (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center pt-2"
          >
            {/* Viewfinder Card */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 w-full max-w-[320px] relative">
              <div className="w-full bg-slate-900 rounded-2xl overflow-hidden relative aspect-square flex items-center justify-center">
                <div id="guard-qr-reader" className="w-full h-full" />
                
                {/* Laser Sweep line overlay */}
                <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full pointer-events-none animate-scan-laser shadow-[0_0_8px_rgba(243,89,25,0.8)]" />
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center text-center max-w-xs">
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center mb-2">
                <QrCode size={22} />
              </div>
              <h3 className="font-display font-extrabold text-slate-900 text-base mb-0.5">
                Align Customer QR Pass
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">
                Position customer’s Digital Exit Pass within camera viewfinder for automated item reconciliation.
              </p>
              
              <label className="w-full bg-white border border-slate-200/90 text-slate-700 hover:text-primary rounded-full py-3 px-5 flex items-center justify-center gap-2 font-display font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                <ImageIcon size={16} />
                <span>Upload QR Image from Device</span>
              </label>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-1"
          >
            {loading ? (
              <div className="pt-20 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-display font-bold text-slate-500 text-sm">Validating Security Signature...</p>
              </div>
            ) : error ? (
              <div className="bg-white border-2 border-rose-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 text-rose-600">
                  <XCircle size={36} />
                </div>
                <h2 className="text-lg font-display font-black text-slate-900 mb-1">
                  Verification Failed
                </h2>
                <p className="text-slate-500 mb-6 font-medium text-xs leading-relaxed max-w-[260px] mx-auto">
                  {error}
                </p>
                <button 
                  onClick={() => setCurrentView('SCANNER')}
                  className="w-full bg-rose-600 text-white py-3.5 rounded-full font-display font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-transform"
                >
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            ) : orderData && (
              <div className="space-y-3.5">
                
                {/* Status Callout Banner */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  orderData.is_used 
                    ? 'bg-rose-50 border-rose-200/90 text-rose-950' 
                    : 'bg-emerald-50 border-emerald-200/90 text-emerald-950'
                }`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    orderData.is_used ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {orderData.is_used ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-display font-extrabold text-xs">
                      {orderData.is_used ? 'Exit Pass Already Claimed' : 'Valid Digital Clearance Active'}
                    </span>
                    <span className="text-[10px] opacity-80 mt-0.5">
                      {orderData.is_used 
                        ? 'This pass has already been verified for gate exit.' 
                        : 'Reconcile physical shopping bag with listed items below.'}
                    </span>
                  </div>
                </div>

                {/* Scanned Order Card */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs">
                  
                  {/* Meta Summary */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-2 mb-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                        <span className="font-display font-extrabold text-slate-900">{orderData.user_name || 'Guest User'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-wider block">Timestamp</span>
                        <span className="font-mono text-slate-700 text-[11px]">
                          {orderData.created_at ? new Date(orderData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/70">
                      <div>
                        <span className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-wider block">Order ID</span>
                        <span className="font-mono font-extrabold text-slate-900 text-xs">
                          #EP-{orderData.order_id?.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-wider block">Total Paid</span>
                        <span className="font-display font-black text-primary text-sm">
                          ₹{Number(orderData.total_paid).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchased Items Checklist */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-display font-extrabold text-slate-400 uppercase tracking-wider">
                        Bagged Items Checklist ({orderData.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0})
                      </span>
                      <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        Paid & Verified
                      </span>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto hide-scrollbar pr-0.5">
                      {orderData.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-display font-bold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Barcode: {item.barcode}</p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900">₹{Number(item.price).toFixed(2)}</span>
                            <span className="text-[10px] font-display font-bold bg-primary-50 text-primary px-2 py-0.5 rounded-md">
                              ×{item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirmation / Exit Action */}
                  {orderData.is_used ? (
                    <button 
                      onClick={() => setCurrentView('SCANNER')}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-full font-display font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ArrowLeft size={16} /> Return to Scanner
                    </button>
                  ) : (
                    <button 
                      onClick={handleConfirmOrder}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-full font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={20} strokeWidth={2.5} />
                      <span>Confirm & Mark Clearance Verified</span>
                    </button>
                  )}
                  
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Add CSS to hide and style the html5-qrcode UI elements
const styles = `
  #guard-qr-reader { border: none !important; }
  #guard-qr-reader img { display: none !important; }
  #guard-qr-reader__dashboard { background: transparent !important; padding: 0 !important; }
  #guard-qr-reader__camera_selection {
    background: #f8fafc !important; color: #0f172a !important; padding: 8px 12px !important;
    border-radius: 12px !important; border: 1px solid #e2e8f0 !important; font-size: 12px !important;
    font-weight: 600 !important; margin: 8px 0 !important; width: 100% !important; outline: none;
  }
  #guard-qr-reader__scan_region video { border-radius: 16px !important; object-fit: cover !important; }
  button#html5-qrcode-button-camera-start, button#html5-qrcode-button-camera-stop {
    background: #f35919 !important; color: white !important; border: none !important;
    padding: 10px 20px !important; border-radius: 9999px !important; font-weight: 700 !important;
    font-size: 12px !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; 
    margin: 8px auto !important; display: block !important; width: 100% !important; cursor: pointer;
  }
  #guard-qr-reader__file_selection {
    background: #f8fafc !important; color: #0f172a !important; padding: 8px 12px !important;
    border-radius: 12px !important; border: 1px solid #e2e8f0 !important; font-size: 12px !important;
    font-weight: 600 !important; margin: 8px 0 !important; width: 100% !important; cursor: pointer;
  }
  a#html5-qrcode-anchor-scan-type-change {
    display: block !important; text-align: center !important; color: #f35919 !important; font-weight: 600 !important; font-size: 12px !important; text-decoration: none !important; margin-top: 10px !important;
  }
  #guard-qr-reader__dashboard_section_csr span { display: none !important; }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('guard-qr-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'guard-qr-styles';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  }
}

export default GuardVerifyScreen;
