import React from 'react';
import { motion } from 'framer-motion';
import { Info, ArrowLeft, Github, Globe, ShieldCheck, Heart } from 'lucide-react';

const AboutScreen = ({ onBack }) => {
  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack} 
              aria-label="Go back"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              System Architecture
            </span>
            <h1 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
              About EasyPay
            </h1>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
          v1.0.0 Alpha
        </span>
      </div>

      <div className="space-y-4">
        {/* Hero Branding Card */}
        <div className="bg-gradient-to-br from-primary via-primary-500 to-primary-700 text-white rounded-3xl p-6 shadow-coral relative overflow-hidden text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 border-2 border-white/40 shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-display font-black tracking-tight">EasyPay</h2>
          <p className="text-xs text-primary-100 font-medium mt-1 max-w-xs leading-relaxed">
            Smart Supermarket Self-Checkout & AI Nutritional Analysis Engine
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
            Our Mission
          </h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            EasyPay transforms the physical supermarket experience into an instant, queue-less, and health-empowered workflow. We combine sub-second barcode checkout with personalized nutritional intelligence to prevent chronic condition triggers before purchase.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
            The Three Pillars
          </h3>

          <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-display font-black text-xs shrink-0 shadow-xs">
              1
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-xs text-slate-900">Base Nutritional Scoring</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                Modified Nutri-Score algorithm adapted for packaged grocery products.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-display font-black text-xs shrink-0 shadow-xs">
              2
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-xs text-slate-900">Personalized Health Logic</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                Real-time allergen and disease conflict mapping across 12+ health conditions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-display font-black text-xs shrink-0 shadow-xs">
              3
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-xs text-slate-900">Groq AI Health Alternatives</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                Low-latency LLM inference proposing cleaner whole-food swaps available in nearby aisles.
              </p>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-3xl p-4 text-xs text-rose-900">
          <div className="flex items-center gap-2 font-display font-bold text-rose-700 mb-1">
            <Heart size={14} className="text-rose-600" />
            <span>Medical Disclaimer</span>
          </div>
          <p className="text-[11px] text-rose-800/80 leading-relaxed font-medium">
            EasyPay nutritional assessments are for informational and educational awareness. They do not replace clinical advice from certified physicians or registered dietitians.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;
