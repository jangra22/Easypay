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
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-4 py-6 pb-24 w-full max-w-7xl mx-auto">
      
      {/* Header Actions */}
      <div className="flex justify-end mb-2 px-2">
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-primary bg-primary-50 px-4 py-2 rounded-full font-bold text-sm active:scale-95 transition-transform"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-white bg-primary px-4 py-2 rounded-full font-bold text-sm active:scale-95 transition-transform shadow-md shadow-primary/20 disabled:opacity-70"
          >
             {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
             Save Changes
          </button>
        )}
      </div>

      <div className="flex flex-col items-center mb-8 text-center relative group">
        <div className="relative">
          <div className="w-28 h-28 bg-white text-gray-300 rounded-[2.5rem] flex items-center justify-center shadow-sm border-2 border-primary overflow-hidden mb-4">
            <User size={48} strokeWidth={1.5} />
          </div>
          {isEditing && (
            <div className="absolute bottom-2 -right-2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:bg-primary-600 transition-colors">
              <Camera size={18} />
            </div>
          )}
        </div>

        {isEditing ? (
          <input 
            type="text" 
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            className="text-2xl font-bold text-center text-gray-900 bg-white border border-primary rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 w-[80%] mb-1"
            placeholder="Your Name"
          />
        ) : (
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{user?.full_name || 'User Name'}</h1>
        )}

        <div className="bg-success-bg text-success px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 border border-success/20 mt-2">
           <ShieldCheck size={14} /> Verified Member
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Personal Info</h2>
        <div className="space-y-4">
          
          {/* Email (Non-editable generally) */}
          <div className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
             <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-500 border border-gray-100">
               <Mail size={18} />
             </div>
             <div className="flex-1">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Address</p>
               <p className="text-sm font-bold text-gray-900 truncate">{user?.email || 'email@example.com'}</p>
             </div>
          </div>

          {/* Date of Birth */}
          <div className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-colors ${isEditing ? 'bg-primary-50/50 border-primary-100' : 'bg-gray-50 border-gray-100'}`}>
             <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-500 border border-gray-100">
               <Calendar size={18} />
             </div>
             <div className="flex-1">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Date of Birth</p>
               {isEditing ? (
                 <input 
                   type="date"
                   value={formData.dob}
                   onChange={(e) => setFormData({...formData, dob: e.target.value})}
                   className="w-full text-sm font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 outline-none"
                 />
               ) : (
                 <p className="text-sm font-bold text-gray-900">{user?.dob || 'Not Provided'}</p>
               )}
             </div>
          </div>

        </div>
      </div>

      {!isEditing && (
        <div className="bg-white border border-gray-100 rounded-3xl p-2 shadow-sm">
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl text-primary flex items-center justify-center">
                 <CreditCard size={18} />
              </div>
              <span className="font-semibold text-gray-800 text-sm">Payment Methods</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
          </div>
        </div>
      )}

    </div>
  );
}

export default UserProfileScreen;
