import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

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
                 <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                 Andheri West
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

