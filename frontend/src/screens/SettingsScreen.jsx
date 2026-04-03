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
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-4 py-6 pb-24 w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 tracking-tight px-2 mt-2">
        <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-gray-600">
           <Settings size={20} />
        </div>
        App Settings
      </h1>

      {/* User Quick Info Card */}
      <div className="bg-primary text-white rounded-[2rem] p-6 mb-8 shadow-lg shadow-primary/20 flex items-center gap-5">
         <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50 overflow-hidden">
            {user?.qr_code ? (
              <img src={user.qr_code} alt="QR" className="w-full h-full object-cover p-1 bg-white mix-blend-screen" />
            ) : (
              <UserIcon size={32} />
            )}
         </div>
         <div>
            <h2 className="text-xl font-bold tracking-tight mb-0.5">{user?.full_name || 'Guest User'}</h2>
            <p className="text-primary-100 text-sm font-medium">{user?.email || 'Not logged in'}</p>
         </div>
      </div>

      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Preferences</h3>
      
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden mb-8">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            onClick={item.onClick}
            className="flex items-center justify-between p-4 border-b last:border-0 border-gray-50 active:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-colors flex items-center justify-center ${item.color}`}>
                 <item.icon size={20} />
              </div>
              <span className="font-semibold text-gray-800 text-sm">{item.label}</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        ))}
      </div>

      <button 
        onClick={handleLogout}
        className="w-full bg-white border border-danger/20 text-danger hover:bg-danger-bg py-4 rounded-2xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"
      >
        <LogOut size={20} />
        Log Out
      </button>
    </div>
  );
}

export default SettingsScreen;
