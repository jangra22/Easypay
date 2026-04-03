import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

const WelcomeScreen = ({ onNext }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-bg px-6 pb-12 pt-16">
      
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/30"
        >
          <span className="text-4xl font-bold">EP</span>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-gray-900 mb-4"
        >
          Welcome to <span className="text-primary">EasyPay</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 text-lg mb-12 max-w-[280px]"
        >
          Skip the queue. Scan products, get health insights, and pay instantly.
        </motion.p>

        <div className="w-full max-w-7xl space-y-4 mb-12">
          {[
            { icon: <Zap size={20} className="text-warning" />, title: "Instant Scan & Go" },
            { icon: <ShieldCheck size={20} className="text-success" />, title: "Health Analysis" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                {item.icon}
              </div>
              <span className="font-semibold text-gray-800">{item.title}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onNext}
        className="w-full bg-primary hover:bg-primary-600 text-white font-bold text-lg py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/30"
      >
        <span>Get Started</span>
        <ArrowRight size={20} />
      </motion.button>
      
    </div>
  );
};

export default WelcomeScreen;
