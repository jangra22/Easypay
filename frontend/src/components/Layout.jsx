import React from 'react';
import BottomNav from './BottomNav';

const Layout = ({ children }) => {
  return (
    <div className="app-container flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto hide-scrollbar pb-16">
        {children}
      </main>
      
      {/* Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Layout;
