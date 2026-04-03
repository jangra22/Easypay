import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Header from './components/Header';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import ScannerScreen from './screens/ScannerScreen';
import HealthProfileScreen from './screens/HealthProfileScreen';
import HistoryScreen from './screens/HistoryScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import GuardVerifyScreen from './screens/GuardVerifyScreen';
import HealthInfoScreen from './screens/HealthInfoScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SettingsScreen from './screens/SettingsScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';

import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-gray-bg">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }
  
  return children;
};

const UserLayout = () => {
  return (
    <Layout>
      <Header />
      <Outlet />
    </Layout>
  );
};

function AppContent() {
  const { user, updateHealthProfile } = useAuth();
  
  const conditions = user?.health_conditions || [];

  const toggleCondition = (id) => {
    const newConditions = conditions.includes(id) 
      ? conditions.filter(c => c !== id) 
      : [...conditions, id];
    updateHealthProfile(newConditions);
  };

  return (
    <Routes>
      <Route element={<UserLayout />}>
        <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/welcome" element={<WelcomeScreen onNext={() => window.location.href = '/login'} />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/scan" element={<ProtectedRoute><ScannerScreen /></ProtectedRoute>} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <HealthProfileScreen 
                conditions={conditions} 
                onToggle={toggleCondition} 
                onNext={() => window.location.href = '/scan'}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <HistoryScreen 
                onBack={() => window.history.back()} 
              />
            </ProtectedRoute>
          } 
        />
        <Route path="/cart" element={<ProtectedRoute><CartScreen /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutScreen /></ProtectedRoute>} />
        <Route path="/receipt/:orderId" element={<ProtectedRoute><ReceiptScreen /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
        <Route path="/user" element={<ProtectedRoute><UserProfileScreen /></ProtectedRoute>} />
        <Route 
          path="/health/analysis/:barcode" 
          element={<ProtectedRoute><HealthInfoScreen /></ProtectedRoute>} 
        />
      </Route>
      
      {/* Routes that don't need the mobile app layout container */}
      <Route path="/guard" element={<GuardVerifyScreen />} />
      <Route path="/admin" element={<AdminDashboardScreen />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
