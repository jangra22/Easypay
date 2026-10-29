import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, ArrowLeft, Download, Share2, Home, 
  ShieldCheck, FileText, ChevronDown, ChevronUp, Check, 
  Sparkles, QrCode, Store, Lock, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import html2canvas from 'html2canvas';

function ReceiptScreen() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order', err);
        setError('Order could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleSaveImage = async () => {
    const element = document.getElementById('receipt-card');
    if (!element || saving) return;
    
    setSaving(true);
    try {
      const canvas = await html2canvas(element, { 
        backgroundColor: '#ffffff', 
        scale: 2,
        useCORS: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `EasyPay_ExitPass_${order?.order_id?.slice(0, 8).toUpperCase() || 'Order'}.png`;
      link.href = dataUrl;
      link.click();
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save image', err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const title = 'EasyPay Digital Exit Pass';
    const text = `Exit Pass for Order #${order?.order_id?.slice(0, 8).toUpperCase()} at EasyPay HyperMarket #104`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      } catch (err) {
        console.error('Clipboard copy failed', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Generating Digital Exit Pass...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-slate-800 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-200">
          <AlertTriangle size={32} />
        </div>
        <h2 className="font-display font-bold text-lg text-slate-900 mb-1">Pass Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-xs">{error || 'The requested order pass does not exist.'}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-slate-900 text-white font-display font-bold px-6 py-3 rounded-full text-sm active:scale-95 transition-all shadow-xs"
        >
          Return to Store
        </button>
      </div>
    );
  }

  const items = order.items || [];
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const formattedDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Today';
  const formattedTime = order.created_at 
    ? new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  // Approximate tax calculations for invoice display
  const totalAmount = Number(order.total) || 0;
  const taxableSubtotal = totalAmount / 1.18;
  const totalGst = totalAmount - taxableSubtotal;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 pb-32 animate-fade-in select-none">
      
      {/* Share Toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 bg-slate-900 text-white text-xs font-semibold py-2 px-3.5 rounded-xl text-center shadow-md flex items-center justify-center gap-1.5"
          >
            <Check size={14} className="text-emerald-400" />
            <span>Receipt link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Success Feedback Banner (Stitch Design Reference) */}
      <div className="mb-4 overflow-hidden bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-sm leading-tight text-emerald-950">
              Payment Complete & Bagged
            </span>
            <span className="text-[11px] font-medium text-emerald-800/90 truncate mt-0.5">
              {totalUnits} items verified • Digital security clearance active
            </span>
          </div>
        </div>
        <button 
          onClick={handleShare}
          className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          aria-label="Share Receipt"
          title="Share Pass"
        >
          <Share2 size={15} />
        </button>
      </div>

      {/* 3. SECTION 1: Perforated Digital Security Exit Pass */}
      <div 
        id="receipt-card"
        className="relative flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden mb-4 transition-all"
      >
        {/* Pass Header */}
        <div className="bg-slate-50/85 px-4 py-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-[11px] uppercase tracking-wider text-slate-900">
                Digital Exit Pass
              </span>
              <span className="font-mono text-[9px] text-slate-500 font-semibold mt-0.5">
                GATE B • HYPERMARKET #104
              </span>
            </div>
          </div>

          <span className="font-mono text-[11px] font-extrabold bg-slate-200/80 text-slate-800 px-2.5 py-0.5 rounded-full tracking-wide">
            #EP-{order.order_id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Pass Main Body */}
        <div className="p-5 flex flex-col items-center text-center bg-white relative">
          
          {/* Status Clearance Pill */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-display font-bold ${
            order.is_used 
              ? 'bg-rose-50 text-rose-700 border border-rose-200/80' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                order.is_used ? 'bg-rose-400' : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                order.is_used ? 'bg-rose-600' : 'bg-emerald-600'
              }`} />
            </span>
            <span className="uppercase tracking-wider text-[10px]">
              {order.is_used ? 'QR Verified & Checked Out' : 'Active Clearance • Gate Scanner'}
            </span>
            {!order.is_used && (
              <span className="text-slate-400 text-[10px] ml-0.5 font-mono font-normal">
                Active
              </span>
            )}
          </div>

          {/* QR Frame with Corner Reticles and Scanning Laser */}
          <div className="relative p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center animate-soft-breathe group">
            {/* Corner Bracket Reticles */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary rounded-tl-sm pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary rounded-br-sm pointer-events-none" />

            {/* Glowing Laser Sweep Line */}
            {!order.is_used && (
              <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full pointer-events-none animate-scan-laser shadow-[0_0_8px_rgba(243,89,25,0.8)]" />
            )}

            {/* QR Image */}
            <img 
              src={order.qr_code} 
              alt={`QR Pass for Order ${order.order_id}`}
              className={`w-44 h-44 object-contain transition-opacity ${
                order.is_used ? 'opacity-30 grayscale' : 'opacity-100'
              }`} 
            />

            {/* Used Overlay if already scanned */}
            {order.is_used && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-1">
                  <Check size={28} strokeWidth={3} />
                </div>
                <span className="font-display font-extrabold text-xs uppercase tracking-wider text-rose-700">
                  Exit Confirmed
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {order.used_at ? new Date(order.used_at).toLocaleTimeString() : ''}
                </span>
              </div>
            )}
          </div>

          {/* Turnstile Instructions */}
          <div className="mt-4 flex flex-col items-center">
            <span className="font-display font-bold text-sm text-slate-900 tracking-tight">
              Present at Exit Turnstile
            </span>
            <p className="text-[11px] text-slate-500 max-w-xs mt-0.5 leading-relaxed">
              Hold screen facing turnstile scanner or present to security guard for automated gate opening.
            </p>
          </div>
        </div>

        {/* Perforated Ticket Divider (Semicircles & Dashed line) */}
        <div className="relative w-full flex items-center justify-between px-0 bg-white">
          <div className="w-5 h-5 rounded-full bg-slate-100 -ml-2.5 shadow-inner border-r border-slate-200/80" />
          <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-1" />
          <div className="w-5 h-5 rounded-full bg-slate-100 -mr-2.5 shadow-inner border-l border-slate-200/80" />
        </div>

        {/* Meta Grid (2x2) */}
        <div className="bg-slate-50/70 p-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col">
            <span className="font-display text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Store Hub
            </span>
            <span className="font-display font-bold text-slate-900 text-xs mt-0.5">
              #104 • New Delhi
            </span>
          </div>

          <div className="flex flex-col text-right">
            <span className="font-display text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Verified Security
            </span>
            <span className="font-display font-bold text-emerald-700 text-xs mt-0.5 flex items-center justify-end gap-1">
              <CheckCircle2 size={13} /> {totalUnits} Items Passed
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-display text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Payment Method
            </span>
            <span className="font-display font-bold text-slate-900 text-xs mt-0.5">
              UPI / Instant Pay
            </span>
          </div>

          <div className="flex flex-col text-right">
            <span className="font-display text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Timestamp
            </span>
            <span className="font-display font-bold text-slate-900 text-xs mt-0.5">
              {formattedDate}, {formattedTime}
            </span>
          </div>
        </div>

        {/* Total Settlement Footer */}
        <div className="px-4 py-3 bg-slate-100/70 border-t border-slate-200/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-display text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Total Paid
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">
              Instant Razorpay Settlement
            </span>
          </div>
          <span className="font-display font-black text-xl text-primary tabular-nums tracking-tight">
            ₹{totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 4. SECTION 2: Smart Cart & Itemized Breakdown */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 mb-4">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
              Bagged Items ({totalUnits})
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            Security Cleared
          </span>
        </div>

        <div className="space-y-2.5 max-h-56 overflow-y-auto hide-scrollbar pr-0.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-base shrink-0">{item.emoji || '📦'}</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-display font-bold text-slate-900 truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.quantity} × ₹{Number(item.price).toFixed(2)}
                  </span>
                </div>
              </div>
              <span className="font-display font-extrabold text-slate-900 text-xs tabular-nums ml-2">
                ₹{(Number(item.price) * (item.quantity || 1)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Tax invoice expandable breakdown */}
        <div className="pt-3 mt-3 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => setShowInvoice(!showInvoice)}
            className="w-full flex items-center justify-between text-xs font-display font-bold text-slate-700 hover:text-primary transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <FileText size={14} className="text-primary" />
              <span>Electronic GST Tax Invoice</span>
            </span>
            {showInvoice ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {showInvoice && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-2.5 space-y-1.5 text-[11px] text-slate-500 font-mono"
              >
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span className="font-semibold text-slate-800 tabular-nums">₹{taxableSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (9%):</span>
                  <span className="font-semibold text-slate-800 tabular-nums">₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (9%):</span>
                  <span className="font-semibold text-slate-800 tabular-nums">₹{sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 font-sans font-bold text-slate-900 text-xs">
                  <span>Total Invoice Amount:</span>
                  <span className="tabular-nums">₹{totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-[9px] text-slate-400 font-sans mt-1">
                  GSTIN: 07AAAE1234F1Z5 • EasyPay Retail Technologies Private Limited
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. SECTION 3: Action Controls (Stitch Reference) */}
      <div className="space-y-2.5">
        <button 
          onClick={handleSaveImage}
          disabled={saving}
          className={`w-full py-4 px-6 rounded-full font-display font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
            saveSuccess 
              ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
              : 'bg-primary hover:bg-primary-600 text-white shadow-coral'
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Image...</span>
            </span>
          ) : saveSuccess ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} className="animate-bounce" />
              <span>Saved to Camera Roll!</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Download size={18} />
              <span>Save Exit Pass to Photos</span>
            </span>
          )}
        </button>

        <button 
          onClick={() => setShowInvoice(!showInvoice)}
          className="w-full py-3.5 px-6 rounded-full bg-white text-slate-800 border border-slate-200/90 font-display font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-slate-50 active:scale-95 transition-all"
        >
          <FileText size={16} className="text-slate-500" />
          <span>{showInvoice ? 'Hide Itemized Tax Invoice' : 'View Itemized Tax Invoice'}</span>
        </button>

        <div className="text-center pt-2">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 font-display font-bold text-xs text-slate-500 hover:text-primary active:scale-95 transition-all py-2 px-4 rounded-full"
          >
            <Store size={15} />
            <span>Done & Return to Store Feed</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default ReceiptScreen;
