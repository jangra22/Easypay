import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, QrCode, ArrowLeft, Download, Share2, Home } from 'lucide-react';
import { api } from '../services/api';
import html2canvas from 'html2canvas';

function ReceiptScreen() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleSaveImage = async () => {
    const element = document.getElementById('receipt-card');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Receipt_${order?.order_id?.slice(0, 8) || 'Order'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save image', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Generating receipt...</p>
    </div>
  );
  if (!order) return <div className="p-12 text-center text-danger font-medium mt-safe">Order not found.</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 animate-in zoom-in-95 duration-500 pb-24">
      <div className="flex flex-col items-center text-center mt-6 mb-8">
        <div className="w-20 h-20 bg-success-bg text-success rounded-full flex items-center justify-center mb-4 shadow-sm border border-success/20">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Order Success!</h1>
        <p className="text-gray-500 font-medium px-4">Please show this QR code to the security guard before leaving.</p>
      </div>

      {/* QR Code Card */}
      <div id="receipt-card" className="bg-white rounded-[2.5rem] p-8 mb-8 shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>
        
        <div className="w-full flex justify-between items-start mb-6">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Order ID</p>
            <p className="text-xs font-mono font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-200">#{order.order_id.slice(0, 8)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total Paid</p>
            <p className="text-lg font-black text-primary">₹{order.total.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm mb-6 group transition-all hover:scale-105">
           <img 
             src={order.qr_code} 
             alt="Order QR Code" 
             className="w-48 h-48 mix-blend-multiply"
           />
        </div>

        <div className="w-full space-y-3">
           <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
              <span className="text-gray-500 font-medium">Status</span>
              <span className={`font-bold uppercase tracking-wider text-xs ${order.is_used ? 'text-danger' : 'text-success'}`}>
                {order.is_used ? 'QR Used' : 'Ready to Scan'}
              </span>
           </div>
           {order.is_used && order.used_at && (
             <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-100 pb-3">
               <span className="font-medium">Used On</span>
               <span className="font-bold">{new Date(order.used_at).toLocaleString()}</span>
             </div>
           )}
           <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
              <span className="text-gray-500 font-medium">Items</span>
              <span className="font-bold text-gray-900">{order.items?.length || 0} Products</span>
           </div>
           <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Date</span>
              <span className="font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</span>
           </div>
        </div>
      </div>

      <div className={`p-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm border ${
        order.is_used 
          ? 'bg-danger-bg border-danger/20 text-danger' 
          : 'bg-primary-50 border-primary-100 text-primary'
      }`}>
        <div className={`p-2 rounded-xl mt-0.5 ${order.is_used ? 'bg-white/60' : 'bg-white'}`}>
           <QrCode size={20} className="shrink-0" />
        </div>
        <div>
           <p className="text-xs font-bold leading-relaxed">
             {order.is_used 
               ? 'This QR code has already been scanned by security.' 
               : 'Show this code to the guard at the exit gate for verification.'}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={handleSaveImage}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 shadow-sm rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium"
        >
          <Download size={20} />
          <span className="text-xs">Save Image</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 shadow-sm rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium">
          <Share2 size={20} />
          <span className="text-xs">Share Receipt</span>
        </button>
      </div>

      <button 
        onClick={() => navigate('/')}
        className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-transform active:scale-95 shadow-md text-lg"
      >
        <Home size={20} />
        Return to Home
      </button>

      <p className="text-center text-[10px] text-gray-400 mt-8 uppercase tracking-[0.2em] font-bold">
        Secure Checkout by EasyPay
      </p>
    </div>
  );
}

export default ReceiptScreen;
