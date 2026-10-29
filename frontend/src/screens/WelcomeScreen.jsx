import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, ShieldCheck, Sparkles, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WelcomeScreen = ({ onNext }) => {
  const navigate = useNavigate();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface px-6 pt-12 pb-8 max-w-md mx-auto select-none">
      
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Brand Monogram Icon */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 bg-gradient-to-br from-primary via-primary-500 to-primary-700 text-white rounded-3xl flex items-center justify-center mb-6 shadow-coral relative"
        >
          <span className="font-display font-black text-3xl tracking-tight">EP</span>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/70 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <span>Next-Gen Retail Companion</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">
            Welcome to <span className="text-primary">EasyPay</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 max-w-xs leading-relaxed">
            Scan products in supermarket aisles, get AI-powered health scores, and exit without queuing.
          </p>
        </motion.div>

        {/* Feature Cards Stack */}
        <div className="w-full space-y-2.5 my-8">
          {[
            { 
              icon: <Zap size={18} className="text-primary" />, 
              title: "Instant Queue-Free Checkout", 
              desc: "Scan barcodes on physical shelves and pay directly." 
            },
            { 
              icon: <ShieldCheck size={18} className="text-emerald-600" />, 
              title: "AI Health & Allergen Guidance", 
              desc: "Personalized warnings mapped to your dietary profile." 
            },
            { 
              icon: <QrCode size={18} className="text-slate-700" />, 
              title: "Digital Security Exit Pass", 
              desc: "Automated gate turnstile opening with verified QR." 
            },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ x: -15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3.5 bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200/80 text-left"
            >
              <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-display font-bold text-xs text-slate-900 block">
                  {item.title}
                </span>
                <span className="text-[11px] text-slate-500 font-medium leading-relaxed block mt-0.5">
                  {item.desc}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Primary Action Button */}
      <motion.button
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={handleNext}
        className="w-full bg-primary hover:bg-primary-600 text-white font-display font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 shadow-coral active:scale-[0.98] transition-all cursor-pointer"
      >
        <span>Get Started</span>
        <ArrowRight size={18} strokeWidth={2.5} />
      </motion.button>
      
    </div>
  );
};

export default WelcomeScreen;
