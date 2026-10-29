import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState('Andheri West');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Only fetch location if we are on the homepage
    if (location.pathname === '/') {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`);
            const data = await res.json();
            
            // Try to get a meaningful name from the address
            const addr = data.address;
            const neighborhood = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.city || 'My Location';
            setLocationName(neighborhood);
          } catch (err) {
            console.error("Failed to fetch location name:", err);
          }
        }, (err) => {
          console.log("Geolocation permission denied or error:", err);
        });
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    // Fetch cart count when user is logged in
    if (user?.email) {
      api.getCart(user.email)
        .then(cart => {
          if (cart?.items) {
            const count = cart.items.reduce((acc, item) => acc + (item.quantity || 1), 0);
            setCartCount(count);
          }
        })
        .catch(() => {});
    }
  }, [user?.email, location.pathname]);

  // Define screen titles based on routes
  const getRouteInfo = (path) => {
    if (path === '/') return { title: 'EasyPay', showBack: false };
    if (path.startsWith('/health/analysis')) return { title: 'Product Analysis', showBack: true };
    if (path === '/cart') return { title: 'Shopping Cart', showBack: true };
    if (path === '/checkout') return { title: 'Express Checkout', showBack: true };
    if (path.startsWith('/receipt')) return { title: 'Digital Exit Pass', showBack: true };
    if (path === '/history') return { title: 'Order History', showBack: true };
    if (path === '/profile') return { title: 'Health Profile', showBack: true };
    if (path === '/settings') return { title: 'Settings', showBack: true };
    if (path === '/user') return { title: 'User Profile', showBack: true };
    return { title: 'EasyPay', showBack: true };
  };

  const hiddenRoutes = ['/welcome', '/login', '/register', '/scan', '/guard', '/admin'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route)) && location.pathname !== '/') {
    return null;
  }

  const { title, showBack } = getRouteInfo(location.pathname);
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 h-16 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        )}
        
        {isHome ? (
          <div className="flex items-center gap-2.5">
            {/* EasyPay Brand Monogram */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-coral-sm">
              <span className="text-white font-display font-extrabold text-sm tracking-tight">EP</span>
            </div>
            
            {/* Store & Location Details */}
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-slate-900 text-sm tracking-tight">EasyPay</span>
                <span className="text-slate-300 font-normal">•</span>
                <span className="text-xs font-semibold text-slate-700">JioMart</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                <MapPin size={10} className="text-primary" />
                <span className="truncate max-w-[130px]">{locationName}</span>
              </div>
            </div>
          </div>
        ) : (
          <h1 className="text-base sm:text-lg font-display font-bold text-slate-900 tracking-tight">{title}</h1>
        )}
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2">
        {isHome ? (
          <>
            <Link
              to="/cart"
              aria-label="View shopping cart"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center relative transition-transform active:scale-95"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            <Link
              to="/user"
              aria-label="View user profile"
              className="w-9 h-9 rounded-full bg-primary-50 border border-primary-100 text-primary flex items-center justify-center transition-transform active:scale-95"
            >
              <UserIcon size={18} />
            </Link>
          </>
        ) : (
          !['/cart', '/checkout'].includes(location.pathname) && !location.pathname.startsWith('/receipt') && (
            <Link
              to="/cart"
              aria-label="View shopping cart"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center relative transition-transform active:scale-95"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          )
        )}
      </div>
    </header>
  );
}

export default Header;



