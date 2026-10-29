import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = ({ children }) => {
  const location = useLocation();
  const hiddenRoutes = ['/welcome', '/login', '/register', '/scan', '/checkout', '/receipt', '/guard', '/admin', '/health'];
  const hideBottomNav = hiddenRoutes.some(route => location.pathname.startsWith(route)) && location.pathname !== '/';

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start md:py-6 selection:bg-primary-100 selection:text-primary-700">
      <div className="w-full min-h-screen md:min-h-[844px] md:max-h-[92vh] md:max-w-md bg-surface flex flex-col relative overflow-hidden md:rounded-[2.5rem] md:shadow-2xl md:border md:border-slate-200/80">
        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto hide-scrollbar ${hideBottomNav ? 'pb-0' : 'pb-28'}`}>
          {children}
        </main>
        
        {/* Floating Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;

