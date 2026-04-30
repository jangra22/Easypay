import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState('Andheri West');

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

  // Define screen titles based on routes
  const getRouteInfo = (path) => {
    if (path === '/') return { title: 'EasyPay', showBack: false };
    if (path.startsWith('/health/analysis')) return { title: 'Product Analysis', showBack: true };
    if (path === '/cart') return { title: 'Cart', showBack: true };
    if (path === '/checkout') return { title: 'Checkout', showBack: true };
    if (path.startsWith('/receipt')) return { title: 'Order Status', showBack: true };
    if (path === '/history') return { title: 'Order History', showBack: true };
    if (path === '/profile') return { title: 'Health Profile', showBack: true };
    if (path === '/settings') return { title: 'Settings', showBack: true };
    if (path === '/user') return { title: 'User Profile', showBack: true };
    return { title: 'EasyPay', showBack: true };
  };

  const hiddenRoutes = ['/login', '/register', '/scan', '/guard', '/admin'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route)) && location.pathname !== '/') {
    return null;
  }

  const { title, showBack } = getRouteInfo(location.pathname);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 h-14 px-4 flex items-center justify-between">
      <div className="flex items-center">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 mr-2 text-primary hover:bg-primary-50 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        {location.pathname === '/' ? (
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-lg">EP</span>
             </div>
             <div className="flex flex-col leading-tight">
               <span className="font-bold text-gray-900 leading-none">JioMart</span>
               <span className="text-xs text-gray-500 flex items-center gap-1">
                 <MapPin size={10} className="text-primary fill-primary/20" />
                 {locationName}
               </span>
             </div>
           </div>
        ) : (
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        )}
      </div>
    </header>
  );
}

export default Header;


