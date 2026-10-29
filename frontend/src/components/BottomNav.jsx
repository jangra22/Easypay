import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Store, Heart, ShoppingCart, QrCode, ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  // Fetch live cart count for Cart badge
  useEffect(() => {
    if (user?.email) {
      api.getCart(user.email)
        .then(cart => {
          if (cart?.items) {
            const count = cart.items.reduce((acc, item) => acc + (item.quantity || 1), 0);
            setCartCount(count);
          } else {
            setCartCount(0);
          }
        })
        .catch(() => {});
    }
  }, [user?.email, location.pathname]);

  // Hide for completely out-of-bounds users
  if (!user) return null;

  // Hide bottom nav on specific screens (like login, scanner, checkout, receipt, guard, admin)
  const hiddenRoutes = ['/welcome', '/login', '/register', '/scan', '/checkout', '/receipt', '/guard', '/admin', '/health'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route)) && location.pathname !== '/') {
    return null;
  }

  const leftNavItems = [
    { name: 'Shop', path: '/', icon: Store },
    { name: 'Health', path: '/profile', icon: Heart },
  ];

  const rightNavItems = [
    { name: 'Cart', path: '/cart', icon: ShoppingCart, badge: cartCount },
    { name: 'Pass', path: '/history', icon: QrCode },
  ];

  const isScanActive = location.pathname === '/scan';

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed md:absolute bottom-3 left-3 right-3 md:left-4 md:right-4 max-w-md mx-auto z-40 bg-white/90 backdrop-blur-2xl border border-white/70 shadow-floating rounded-2xl px-2 py-1.5 transition-all"
    >
      <div className="flex items-center justify-between">
        {/* Left Nav Items */}
        <div className="flex items-center justify-around flex-1">
          {leftNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center py-1 px-1.5 min-w-[50px] transition-transform active:scale-95 group"
              >
                <div className="relative">
                  <Icon 
                    size={20} 
                    className={`transition-colors duration-150 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-150 ${isActive ? 'text-primary font-bold' : 'text-slate-400 font-medium group-hover:text-slate-600'}`}>
                  {item.name}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-primary mt-0.5 animate-pulse-subtle" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Central Prominent Scan Action */}
        <div className="flex flex-col items-center justify-center px-1">
          <NavLink
            to="/scan"
            aria-label="Scan barcode"
            className="group relative -translate-y-5 flex flex-col items-center focus:outline-none"
          >
            <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary via-primary-500 to-primary-600 p-[3px] shadow-coral ring-4 ring-white/90 transition-all duration-200 group-hover:scale-105 group-active:scale-95">
              <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white">
                <ScanLine size={24} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform duration-200" />
              </div>
            </div>
            <span className={`text-[10px] font-bold tracking-tight mt-1 transition-colors ${isScanActive ? 'text-primary' : 'text-slate-600 group-hover:text-primary'}`}>
              Scan
            </span>
          </NavLink>
        </div>

        {/* Right Nav Items */}
        <div className="flex items-center justify-around flex-1">
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center py-1 px-1.5 min-w-[48px] transition-transform active:scale-95 group"
              >
                <div className="relative">
                  <Icon 
                    size={20} 
                    className={`transition-colors duration-150 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-150 ${isActive ? 'text-primary font-bold' : 'text-slate-400 font-medium group-hover:text-slate-600'}`}>
                  {item.name}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-primary mt-0.5 animate-pulse-subtle" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;

