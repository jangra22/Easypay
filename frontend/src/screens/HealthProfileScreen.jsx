import React, { useState } from 'react';
import { ShieldCheck, Check, QrCode, Mail, Calendar, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const CONDITIONS = [
  { id: 'thyroid', label: 'Thyroid' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hypertension', label: 'High BP' },
  { id: 'asthma', label: 'Asthma' },
  { id: 'obesity', label: 'Obesity' },
  { id: 'heart_disease', label: 'Heart Issue' },
  { id: 'digestive', label: 'Digestive' },
  { id: 'kidney', label: 'Kidney' },
  { id: 'migraine', label: 'Migraine' },
  { id: 'lactose_intolerance', label: 'Lactose Int' },
  { id: 'gluten_intolerance', label: 'Gluten Int' },
  { id: 'pregnancy', label: 'Pregnancy' },
];

const HealthProfileScreen = ({ onNext = () => {} }) => {
  const { user, updateHealthProfile } = useAuth();
  const [localConditions, setLocalConditions] = useState(user?.health_conditions || []);

  const handleToggle = (id) => {
    setLocalConditions(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSaveAndNext = async () => {
    if (updateHealthProfile) {
      await updateHealthProfile(localConditions);
    }
    onNext();
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 animate-fade-in select-none">
      
      {/* 1. Header Greeting & Description */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Nutritional Safety
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck size={13} />
            <span>Active Protection</span>
          </span>
        </div>
        <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
          Health & Dietary Profile
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
          Select conditions for real-time AI warnings and personalized wellness ratings while scanning products in supermarket aisles.
        </p>
      </div>

      {/* 2. User Member ID Card */}
      {user && (
        <motion.div 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-5 bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden group"
        >
          {/* Subtle background monogram */}
          <div className="absolute top-2 right-2 p-4 opacity-[0.03] text-primary pointer-events-none">
            <QrCode size={140} />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            {/* QR Section */}
            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 shrink-0 shadow-inner flex flex-col items-center">
              <img 
                src={user.qr_code} 
                alt="Personal QR" 
                className="w-18 h-18 sm:w-20 sm:h-20 object-contain mix-blend-multiply" 
              />
              <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest font-mono">
                Member ID
              </span>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Verified Shopper
                </span>
              </div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 truncate tracking-tight">
                {user.full_name || 'Shopper'}
              </h2>
              
              <div className="flex flex-col gap-1 mt-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Mail size={12} className="text-primary shrink-0" />
                  <span className="truncate text-[11px] font-medium">{user.email}</span>
                </div>
                {user.dob && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Calendar size={12} className="shrink-0" />
                    <span>Born: {user.dob}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Section Title & Active Count */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <h2 className="font-display font-bold text-sm text-slate-900 tracking-tight">
            Dietary Constraints & Allergens
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Tap to toggle your health requirements</p>
        </div>
        <span className="font-display font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
          {localConditions.length} active
        </span>
      </div>

      {/* 4. Dietary Condition Interactive Cards / Chips */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {CONDITIONS.map((c) => {
          const isSelected = localConditions.includes(c.id);
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleToggle(c.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-2 shadow-xs cursor-pointer ${
                isSelected 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                  : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-primary-300' : 'text-slate-400'}`}>
                  Condition
                </span>
                <span className="font-display font-bold text-xs mt-0.5 truncate">
                  {c.label}
                </span>
              </div>

              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isSelected 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {isSelected ? <Check size={14} strokeWidth={3} /> : <ShieldCheck size={15} />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 5. Save & Continue Action Button */}
      <div className="mt-auto flex flex-col gap-2.5">
        <button
          onClick={handleSaveAndNext}
          className="w-full bg-primary hover:bg-primary-600 text-white font-display font-bold py-4 px-6 rounded-full shadow-coral flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-all"
        >
          <ShieldCheck size={18} strokeWidth={2.5} />
          <span>Save Preferences & Start Scanning</span>
        </button>

        <p className="text-center text-[10px] text-slate-400 font-medium">
          🔒 Health conditions remain encrypted and processed locally for fast scanning.
        </p>
      </div>

    </div>
  );
};

export default HealthProfileScreen;
