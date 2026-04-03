import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Store, ShoppingCart, Heart, Settings, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Hide for completely out-of-bounds users
  if (!user) return null;

  // Hide bottom nav on specific screens (like login, scanner, etc.)
  const hiddenRoutes = ['/welcome', '/login', '/register', '/scan', '/cart', '/checkout', '/guard', '/admin', '/health'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route)) && location.pathname !== '/') {
    return null;
  }

  const navItems = [
    { name: 'Shop', path: '/', icon: Store },
    { name: 'Cart', path: '/cart', icon: ShoppingCart },
    { name: 'Health Profile', path: '/profile', icon: Heart },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: '/user', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-7xl mx-auto bg-white border-t border-gray-200 bottom-nav-shadow z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className="flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              <Icon 
                size={24} 
                className={isActive ? 'text-primary' : 'text-gray-400'} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
