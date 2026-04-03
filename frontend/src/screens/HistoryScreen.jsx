import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, ChevronRight, Receipt, CreditCard, ShoppingBag } from 'lucide-react';
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
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-0 bg-gray-bg p-4 md:p-8 animate-in fade-in duration-300 pb-24">
      {/* Mobile-only Header */}
      <div className="md:hidden sticky top-0 z-10 flex items-center justify-between mb-6 pt-2">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white rounded-full text-gray-700 transition-colors">
           <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-xl text-gray-900 tracking-tight">Purchase History</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-10">
          <div className="flex items-center space-x-6">
            <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-500 hover:text-primary transition-all border border-gray-100 shadow-sm">
              <ArrowLeft size={24} />
            </button>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Billing Overview</p>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Transaction History</h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 min-h-[50vh] items-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400 shadow-inner">
                <Receipt size={40} />
             </div>
             <p className="text-gray-900 font-bold text-xl tracking-tight mb-2">No Transactions Yet</p>
             <p className="text-gray-500 font-medium max-w-xs px-4">Your completed orders and receipts will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {orders.map((order, i) => (
              <motion.div 
                key={order.order_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/receipt/${order.order_id}`)}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col cursor-pointer group transition-all hover:shadow-md hover:border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary border border-primary-100">
                    <CreditCard size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    order.is_used 
                      ? 'bg-danger-bg text-danger border-danger/20' 
                      : 'bg-success-bg text-success border-success/20'
                  }`}>
                    {order.is_used ? 'QR Used' : 'QR Active'}
                  </div>
                </div>

                <div className="flex-1 mb-5">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 font-mono">#{order.order_id.slice(0, 8)}</div>
                  <h3 className="font-black text-gray-900 text-2xl tracking-tight group-hover:text-primary transition-colors mb-3">
                    ₹{order.total.toFixed(2)}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-[11px] text-gray-500 font-medium">
                      <ShoppingBag size={14} className="mr-1.5 opacity-70" />
                      {order.item_count} Items
                    </div>
                    <div className="flex items-center text-[11px] text-gray-500 font-medium">
                      <Clock size={14} className="mr-1.5 opacity-70" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">View Receipt</span>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
