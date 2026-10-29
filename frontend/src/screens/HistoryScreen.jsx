import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ChevronRight, Receipt, QrCode, ShoppingBag, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HistoryScreen = ({ onBack = () => {} }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders(user?.email);
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 animate-fade-in select-none">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Past Transactions
          </span>
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
            Digital Exit Passes
          </h1>
        </div>
        <span className="font-display font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
          {orders.length} {orders.length === 1 ? 'pass' : 'passes'}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-slate-400">Loading your exit passes...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 my-4">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 text-primary border border-primary-100">
            <QrCode size={32} />
          </div>
          <h2 className="text-slate-900 font-display font-bold text-base tracking-tight mb-1">
            No Exit Passes Yet
          </h2>
          <p className="text-slate-500 text-xs max-w-xs font-medium mb-5">
            Your self-checkout receipts and digital gate passes will appear here after your first store purchase.
          </p>
          <button
            onClick={() => navigate('/scan')}
            className="bg-primary hover:bg-primary-600 text-white font-display font-bold text-xs px-5 py-2.5 rounded-full shadow-coral active:scale-95 transition-all"
          >
            Start Scanning Products
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {orders.map((order, i) => {
            const formattedDate = order.created_at 
              ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Recent';
            const formattedTime = order.created_at 
              ? new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <motion.div 
                key={order.order_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/receipt/${order.order_id}`)}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col cursor-pointer group transition-all hover:border-slate-300 overflow-hidden"
              >
                {/* Pass Header */}
                <div className="bg-slate-50/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      #EP-{order.order_id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      GATE B • #104
                    </span>
                  </div>

                  {/* Status Pill */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    order.is_used 
                      ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${order.is_used ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                    <span>{order.is_used ? 'Gate Cleared' : 'Active Pass'}</span>
                  </div>
                </div>

                {/* Pass Body */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Paid
                    </span>
                    <span className="font-display font-black text-2xl text-slate-900 tracking-tight tabular-nums mt-0.5">
                      ₹{order.total.toFixed(2)}
                    </span>
                    
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-[11px]">
                        <ShoppingBag size={12} className="text-primary" />
                        {order.item_count || (order.items ? order.items.length : 1)} Items
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock size={11} className="text-slate-400" />
                        {formattedDate}{formattedTime ? `, ${formattedTime}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Right QR Icon / Arrow */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-primary-50 group-hover:text-primary transition-colors shrink-0">
                    <QrCode size={24} />
                  </div>
                </div>

                {/* Perforated divider */}
                <div className="relative w-full flex items-center justify-between px-0 bg-white">
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-100 -ml-2 border-r border-slate-200" />
                  <div className="flex-1 border-t-2 border-dashed border-slate-100 mx-1" />
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-100 -mr-2 border-l border-slate-200" />
                </div>

                {/* Footer Action */}
                <div className="bg-slate-50/50 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-primary transition-colors">
                  <span className="text-[11px] font-display font-bold">View Gate Pass & Tax Invoice</span>
                  <ChevronRight size={15} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default HistoryScreen;
