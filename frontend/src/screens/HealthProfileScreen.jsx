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
    <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-0 bg-gray-bg p-4 md:p-8 max-w-5xl mx-auto pb-24">
      {/* User Card - PREMIUM IDENTITY CARD */}
      {user && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-100 to-success-bg rounded-[3rem] blur-md opacity-50 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white border border-gray-100 rounded-[2.5rem] p-6 md:p-10 shadow-sm overflow-hidden">
             {/* Card Elements */}
             <div className="absolute top-0 right-0 p-8 opacity-5 text-primary">
                <QrCode size={150} />
             </div>
             
             <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                {/* QR Section */}
                <div className="bg-gray-50 p-4 rounded-3xl shadow-inner flex flex-col items-center border border-gray-100">
                   <img src={user.qr_code} alt="User QR" className="w-28 h-28 md:w-36 md:h-36 mix-blend-multiply" />
                   <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Personal ID QR</p>
                </div>
                
                {/* Info Section */}
                <div className="flex-1 text-center md:text-left space-y-5">
                   <div>
                      <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{user.full_name}</h2>
                      <div className="flex items-center justify-center md:justify-start gap-3 text-success">
                         <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck size={16} /> Verified Member
                         </div>
                         <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                         <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Since {new Date(user.created_at || new Date()).getFullYear()}
                         </div>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                         <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Mail size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Email Identity</span>
                         </div>
                         <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                         <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Date of Birth</span>
                         </div>
                         <p className="text-sm font-bold text-gray-900">{user.dob || 'Not Set'}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      <div className="mb-6 text-center md:text-left mt-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">Dietary Profile</h2>
        <p className="text-gray-500 text-sm font-medium max-w-xl mx-auto md:mx-0">
          Personalize your experience. Select conditions for a tailored analysis of products during scan.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 mb-10">
        {CONDITIONS.map((c) => {
          const isSelected = localConditions.includes(c.id);
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleToggle(c.id)}
              className={`p-5 rounded-[1.5rem] border-2 text-left transition-all flex flex-col items-start justify-between min-h-[120px] shadow-sm ${
                isSelected 
                  ? 'bg-primary-50 border-primary text-primary shadow-primary/10' 
                  : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${isSelected ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-100 text-gray-400'}`}>
                {isSelected ? <Check size={20} /> : <ShieldCheck size={20} />}
              </div>
              <span className="font-bold uppercase tracking-wider text-xs">{c.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center">
        <button
          onClick={handleSaveAndNext}
          className="w-full max-w-7xl bg-primary hover:bg-primary-600 text-white font-bold py-4 rounded-2xl transition-transform shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
        >
          Save & Start Scanning
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest">
          🔒 Your health data is stored locally on this device
        </p>
      </div>
    </div>
  );
};

export default HealthProfileScreen;
