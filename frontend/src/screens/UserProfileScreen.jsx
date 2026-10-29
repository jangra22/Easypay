import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, CreditCard, ChevronRight, Edit2, CheckCircle2, Calendar, ShieldCheck, Camera } from 'lucide-react';

function UserProfileScreen() {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    dob: user?.dob || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        full_name: formData.full_name,
        dob: formData.dob
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 animate-fade-in select-none">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Account Identity
          </span>
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
            User Profile
          </h1>
        </div>

        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-primary bg-primary-50 border border-primary-200/70 hover:bg-primary-100 px-3.5 py-1.5 rounded-full font-display font-bold text-xs active:scale-95 transition-all shadow-xs"
          >
            <Edit2 size={13} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-white bg-primary hover:bg-primary-600 px-4 py-1.5 rounded-full font-display font-bold text-xs active:scale-95 transition-all shadow-coral disabled:opacity-70"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            <span>Save Changes</span>
          </button>
        )}
      </div>

      {/* Profile Avatar Card */}
      <div className="flex flex-col items-center mb-6 text-center bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs relative">
        <div className="relative mb-3">
          <div className="w-24 h-24 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center shadow-inner border-2 border-slate-200/80 overflow-hidden">
            <User size={44} strokeWidth={1.5} />
          </div>
          {isEditing && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:bg-primary-600 transition-colors">
              <Camera size={15} />
            </div>
          )}
        </div>

        {isEditing ? (
          <input 
            type="text" 
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            className="text-lg font-display font-bold text-center text-slate-900 bg-slate-50 border border-primary rounded-xl px-3 py-1.5 focus:outline-none focus:bg-white w-[85%] mb-2"
            placeholder="Your Name"
          />
        ) : (
          <h2 className="text-xl font-display font-bold text-slate-900 mb-1">
            {user?.full_name || 'Shopper Name'}
          </h2>
        )}

        <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-emerald-200/70 mt-1">
          <ShieldCheck size={13} />
          <span>Verified EasyPay Member</span>
        </div>
      </div>

      {/* Personal Info Bento */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 mb-4 shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">
          Personal Information
        </span>
        
        <div className="space-y-3">
          {/* Email */}
          <div className="flex items-center gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="w-9 h-9 bg-white rounded-xl shadow-xs flex items-center justify-center text-primary border border-slate-200/60 shrink-0">
              <Mail size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Identity</p>
              <p className="text-xs font-bold text-slate-900 truncate">{user?.email || 'email@example.com'}</p>
            </div>
          </div>

          {/* Date of Birth */}
          <div className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-colors ${isEditing ? 'bg-primary-50/50 border-primary-200' : 'bg-slate-50 border-slate-100'}`}>
            <div className="w-9 h-9 bg-white rounded-xl shadow-xs flex items-center justify-center text-slate-600 border border-slate-200/60 shrink-0">
              <Calendar size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date of Birth</p>
              {isEditing ? (
                <input 
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full text-xs font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 outline-none"
                />
              ) : (
                <p className="text-xs font-bold text-slate-900">{user?.dob || 'Not Provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Row */}
      {!isEditing && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-2 shadow-xs mb-4">
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-primary-50 rounded-xl text-primary flex items-center justify-center border border-primary-100 shrink-0">
                <CreditCard size={17} />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-slate-900 text-xs">Payment Methods</span>
                <span className="text-[10px] text-slate-400">UPI, Credit/Debit Cards, NetBanking</span>
              </div>
            </div>
            <ChevronRight size={17} className="text-slate-400 group-hover:text-primary transition-colors" />
          </div>
        </div>
      )}

    </div>
  );
}

export default UserProfileScreen;
