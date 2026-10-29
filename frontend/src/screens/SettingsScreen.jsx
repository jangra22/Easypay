import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronRight, Bell, Shield, CircleHelp, User as UserIcon, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function SettingsScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const menuItems = [
    { icon: UserIcon, label: 'Edit Profile', color: 'text-primary', onClick: () => navigate('/user') },
    { icon: Bell, label: 'Notifications', color: 'text-primary' },
    { icon: Shield, label: 'Privacy & Security', color: 'text-success' },
    { icon: HelpCircle, label: 'Help & Support', color: 'text-warning' }
  ];

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 animate-fade-in select-none">
      
      {/* 1. Header */}
      <div className="mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Preferences & Security
        </span>
        <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
          App Settings
        </h1>
      </div>

      {/* 2. User Quick Info Hero Card */}
      <div className="bg-gradient-to-br from-primary via-primary-500 to-primary-700 text-white rounded-3xl p-5 mb-5 shadow-coral relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-white/40 overflow-hidden shrink-0 shadow-sm">
            {user?.qr_code ? (
              <img src={user.qr_code} alt="QR" className="w-full h-full object-cover p-1 bg-white mix-blend-screen" />
            ) : (
              <UserIcon size={26} className="text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-base sm:text-lg text-white truncate tracking-tight">
              {user?.full_name || 'Guest Shopper'}
            </h2>
            <p className="text-primary-100 text-xs truncate mt-0.5 font-medium">
              {user?.email || 'Not logged in'}
            </p>
            <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white">
              Self-Checkout Ready
            </span>
          </div>
        </div>
      </div>

      {/* 3. Preferences Section */}
      <div className="mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">
          Account & App Settings
        </span>
        
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              onClick={item.onClick}
              className="flex items-center justify-between p-3.5 border-b last:border-0 border-slate-100 active:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-primary-50 transition-colors flex items-center justify-center text-slate-700 group-hover:text-primary border border-slate-100">
                  <item.icon size={18} />
                </div>
                <span className="font-display font-bold text-xs text-slate-800">{item.label}</span>
              </div>
              <ChevronRight size={17} className="text-slate-300 group-hover:text-primary transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Log Out Button */}
      <div className="mt-auto pt-4">
        <button 
          onClick={handleLogout}
          className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 py-3.5 rounded-full font-display font-bold text-xs transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-xs"
        >
          <LogOut size={16} />
          <span>Log Out of EasyPay</span>
        </button>

        <p className="text-center text-[10px] text-slate-400 font-medium mt-3">
          EasyPay Smart Supermarket • v1.0.0
        </p>
      </div>

    </div>
  );
}

export default SettingsScreen;
