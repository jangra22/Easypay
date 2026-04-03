import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('user_session', JSON.stringify(data.user));
      return data.user;
    }
    throw new Error(data.error || 'Login failed');
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    if (data.success) {
      // Don't auto-login here, or do if preferred. Let's auto-login.
      setUser(data.user);
      localStorage.setItem('user_session', JSON.stringify(data.user));
      return data.user;
    }
    throw new Error(data.error || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
    localStorage.removeItem('health_conditions'); // Optional: clear guest conditions
  };

  const updateHealthProfile = async (conditions) => {
    if (!user) return;
    const data = await api.updateHealthProfile(user.email, conditions);
    if (data.success) {
      const updatedUser = { ...user, health_conditions: data.health_conditions };
      setUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
    }
  };

  const updateUserProfile = async (profileData) => {
    if (!user) return;
    const data = await api.updateUserProfile(user.email, profileData);
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('user_session', JSON.stringify(data.user));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateHealthProfile, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
