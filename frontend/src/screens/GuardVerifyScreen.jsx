import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ShieldCheck, XCircle, CheckCircle2, Ticket, ArrowLeft, RefreshCw, KeyRound, User, QrCode, LogOut, ChevronRight, Search, Package, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
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
      const info = JSON.parse(saved);
      setGuardInfo(info);
      setIsLoggedIn(true);
      setCurrentView('DASHBOARD');
      fetchScanCount(info.guard_id);
      fetchLiveOrders();
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
    let scanner;
    if (currentView === 'SCANNER') {
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "guard-qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
            supportedScanTypes: [0, 1] // 0: Camera, 1: File
          },
          false
        );
        scanner.render(onScanSuccess, onScanError);
      }, 500);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        }
      };
    }
  }, [currentView]);

  const onScanSuccess = async (decodedText) => {
    setCurrentView('RESULT');
    setLoading(true);
    try {
      // DecodeText is now exactly just the order_id UUID string
      const orderIdToVerify = decodedText.trim();
      
      const data = await api.guardVerifyOrder(orderIdToVerify, guardInfo.guard_id);
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
    setLoading(true);
    try {
      await api.confirmGuardOrder(orderData.order_id, guardInfo.guard_id);
      // Update local state to show it's now completed
      setOrderData(prev => ({ ...prev, is_used: true }));
      // Refresh backend numbers
      fetchScanCount(guardInfo.guard_id);
      fetchLiveOrders();
      setError(null);
      // Wait a moment then return to scanner
      setTimeout(() => setCurrentView('SCANNER'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to confirm order completion');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (orderId) => {
    setCurrentView('RESULT');
    setLoading(true);
    try {
      const order = await api.getOrder(orderId);
      // Construct identical data format as the scan verification endpoint to reuse the RESULT view
      setOrderData({
        order_id: order.order_id,
        items: order.items,
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

  const onScanError = (err) => {
    // Ignore frame errors
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
    } catch (err) {
      setError("Invalid Guard ID or Password");
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

  // --- Login View ---
  if (currentView === 'LOGIN') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-6 py-8">
        <div className="flex flex-col items-center mt-8 mb-10 text-center">
          <div className="w-16 h-16 bg-primary-50 text-primary rounded-2xl flex items-center justify-center shadow-inner border border-primary-100 mb-6">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Guard Portal</h1>
          <p className="text-gray-500 text-sm max-w-[280px]">
             Secure access for personnel verification.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex-1 flex flex-col w-full">
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Guard ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  required
                  placeholder="e.g. guard1"
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  value={loginForm.guard_id}
                  onChange={(e) => setLoginForm({...loginForm, guard_id: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-danger text-sm text-center bg-danger-bg py-3 rounded-xl border border-danger/20 font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-600 active:scale-95 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-md shadow-primary/20 disabled:opacity-70 flex justify-center items-center h-[56px]"
          >
            {loading ? <RefreshCw className="animate-spin" /> : 'Log In'}
          </button>
          
          <button 
             type="button"
             onClick={() => window.location.href = '/login'}
             className="w-full mt-6 text-sm text-gray-400 hover:text-gray-600 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} /> Back to User Login
          </button>
        </form>
      </div>
    );
  }

  // --- Dashboard View ---
  if (currentView === 'DASHBOARD') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-4 py-6 w-full max-w-7xl mx-auto">
        
        {/* Guard Profile & Stats Header */}
        <div className="bg-primary text-white rounded-[2rem] p-6 mb-8 shadow-lg shadow-primary/20">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50">
                 <ShieldCheck size={28} />
              </div>
              <div>
                <p className="text-primary-100 text-xs font-bold uppercase tracking-widest mb-0.5">Active Session</p>
                <h2 className="text-xl font-bold tracking-tight">{guardInfo?.name || 'Guard'}</h2>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <LogOut size={20} />
            </button>
          </div>
          
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm flex justify-between items-center">
             <div>
               <p className="text-primary-100 text-xs font-semibold mb-1">Today's Scans</p>
               <p className="text-3xl font-black">{scanCount}</p>
             </div>
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Ticket size={20} />
             </div>
          </div>
        </div>

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Verification Actions</h3>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <button 
             onClick={() => setCurrentView('SCANNER')}
             className="w-full bg-white border border-gray-100 rounded-[2rem] p-5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <QrCode size={28} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-900 text-lg mb-0.5">Scan QR Code</h4>
                <p className="text-xs text-gray-500 font-medium">Scan customer app receipts</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>
        </div>

        {/* Live Order Feed */}
        <div className="mt-8 pb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Recent System Orders</h3>
            <button 
              onClick={fetchLiveOrders}
              className="text-xs text-primary font-bold flex items-center gap-1 hover:text-primary-600 transition-colors bg-primary-50 px-3 py-1.5 rounded-full active:scale-95"
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="space-y-3">
            {liveOrders.map((order, idx) => (
              <button 
                 key={idx} 
                 onClick={() => handleOrderClick(order.order_id)}
                 className="w-full text-left bg-white border border-gray-100 rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all hover:border-primary/30"
              >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${order.is_used ? 'bg-gray-100 text-gray-400' : 'bg-success-bg text-success'}`}>
                       <Package size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-[13px] font-mono tracking-tight leading-tight">
                        {order.user_name?.replace(/\s+/g, '') || 'Guest'}_{order.purchase_count || 1}_{new Date(order.created_at).toISOString().slice(0,10).replace(/-/g, '')}_{new Date(order.created_at).toTimeString().slice(0,5).replace(':', '')}
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{order.item_count} items • ₹{order.total}</p>
                    </div>
                 </div>
                 
                 <div>
                    {order.is_used ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                         Used
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-success text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md shadow-success/20">
                         <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                         Active
                      </span>
                    )}
                 </div>
              </button>
            ))}
            
            {liveOrders.length === 0 && !loading && (
              <div className="text-center py-8 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm">
                <Package className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 font-medium text-sm">No orders today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Scanner & Result View ---
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-4 py-4 w-full max-w-7xl mx-auto">
      
      <div className="flex items-center justify-between mb-4 px-2">
        <button 
           onClick={resetToDashboard}
           className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-600 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold text-gray-900 text-lg tracking-tight">
          {currentView === 'SCANNER' ? 'Scan Receipt' : 'Verification Result'}
        </span>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'SCANNER' ? (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col pt-8"
          >
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mx-auto w-full max-w-[320px]">
              <div className="w-full bg-gray-bg rounded-3xl overflow-hidden relative shadow-inner">
                 <div id="guard-qr-reader" className="w-full"></div>
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center text-center">
                <QrCode size={32} className="text-primary mb-3 mx-auto" strokeWidth={1.5} />
                <h3 className="font-bold text-gray-900 text-lg mb-1">Align QR Code</h3>
                <p className="text-sm text-gray-500 w-3/4 mx-auto leading-relaxed">Position the customer's receipt QR code within the frame to verify.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-4"
          >
            {loading ? (
              <div className="pt-20 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-gray-500">Verifying Receipt...</p>
              </div>
            ) : error ? (
              <div className="bg-white border-2 border-danger/20 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-lg shadow-danger/5">
                <div className="w-20 h-20 bg-danger-bg rounded-3xl flex items-center justify-center mb-6 text-danger">
                   <XCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Verification Failed</h2>
                <p className="text-gray-500 mb-8 font-medium text-sm leading-relaxed max-w-[260px] mx-auto">{error}</p>
                <button 
                  onClick={() => setCurrentView('SCANNER')}
                  className="w-full bg-danger text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-danger/20 active:scale-95 transition-transform"
                >
                  <RefreshCw size={20} /> Try Again
                </button>
              </div>
            ) : orderData && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-primary/20 rounded-[2.5rem] p-6 pb-8 flex flex-col shadow-lg shadow-primary/5 relative overflow-hidden">
                  
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-10 opacity-50"></div>
                  
                  <div className="flex justify-between items-start mb-6 w-full">
                    <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-md shadow-primary/30">
                       <Package size={28} strokeWidth={2.5} />
                    </div>
                    {orderData.is_used && (
                      <span className="bg-success-bg text-success px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 border border-success/30">
                         <CheckCircle2 size={14} /> Checked
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight text-center">Receipt Found</h2>
                  <p className="text-gray-500 font-medium text-sm tracking-wide text-center mb-6">Verify items against cart</p>
                  <div className="bg-gray-bg w-full rounded-2xl p-4 text-left border border-gray-100 flex flex-col gap-3 mb-6">
                     <div className="flex justify-between items-center">
                       <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                         <p className="text-sm font-bold text-gray-900">{orderData.user_name || 'Guest'}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date & Time</p>
                         <p className="text-xs font-bold text-gray-900">
                           {orderData.created_at ? new Date(orderData.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}
                         </p>
                       </div>
                     </div>
                     <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                       <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                         <p className="text-sm font-bold text-gray-900 font-mono">#{orderData.order_id.slice(0, 8).toUpperCase()}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                         <p className="text-sm font-black text-gray-900">₹{orderData.total_paid}</p>
                       </div>
                     </div>
                  </div>

                  {/* Scanned Items List */}
                  <div className="mb-8 w-full">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Purchased Items ({orderData.items.reduce((acc, item) => acc + item.quantity, 0)})</h3>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                      {orderData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-3 rounded-xl">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">Barcode: {item.barcode}</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="font-bold text-gray-900 text-sm">₹{item.price}</span>
                            <span className="text-xs text-primary font-bold bg-primary-50 px-2 py-0.5 rounded-md mt-1">x {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {orderData.is_used ? (
                    <button 
                      onClick={() => setCurrentView('SCANNER')}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <ArrowLeft size={20} /> Return to Scanner
                    </button>
                  ) : (
                    <button 
                      onClick={handleConfirmOrder}
                      className="w-full bg-success hover:bg-success-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-success/20 active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={24} /> Confirm & Mark Verified
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

// Add CSS to hide the ugly html5-qrcode UI elements
const styles = `
  #guard-qr-reader { border: none !important; }
  #guard-qr-reader img { display: none !important; }
  #guard-qr-reader__dashboard { background: transparent !important; padding: 0 !important; }
  #guard-qr-reader__camera_selection {
    background: #f8fafc !important; color: #0f172a !important; padding: 12px 16px !important;
    border-radius: 12px !important; border: 1px solid #e2e8f0 !important; font-size: 14px !important;
    font-weight: bold !important; margin: 10px 0 !important; width: 100% !important; outline: none;
  }
  #guard-qr-reader__scan_region video { border-radius: 20px !important; object-fit: cover !important; }
  button#html5-qrcode-button-camera-start, button#html5-qrcode-button-camera-stop {
    background: #f35919 !important; color: white !important; border: none !important;
    padding: 12px 24px !important; border-radius: 16px !important; font-weight: bold !important;
    text-transform: uppercase !important; letter-spacing: 0.05em !important; margin: 10px auto !important;
    display: block !important; width: 100% !important; cursor: pointer;
  }
  #guard-qr-reader__file_selection {
    background: #f8fafc !important; color: #0f172a !important; padding: 12px 16px !important;
    border-radius: 12px !important; border: 1px solid #e2e8f0 !important; font-size: 14px !important;
    font-weight: bold !important; margin: 10px 0 !important; width: 100% !important; cursor: pointer;
  }
  a#html5-qrcode-anchor-scan-type-change {
    display: block !important; text-align: center !important; color: #f35919 !important; font-weight: bold !important; text-decoration: none !important; margin-top: 15px !important;
  }
  #guard-qr-reader__dashboard_section_csr span { display: none !important; }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default GuardVerifyScreen;
