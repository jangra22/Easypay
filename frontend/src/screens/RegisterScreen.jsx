import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Calendar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    dob: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        dob: formData.dob
      });
      navigate('/scan');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-6 py-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col items-center mt-4 mb-8 text-center">
        <div className="w-14 h-14 bg-success text-white rounded-2xl flex items-center justify-center shadow-lg shadow-success/20 mb-4">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-500 text-sm max-w-[280px]">
          Join to get personalized health insights and secure checkout
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col w-full">
        <div className="space-y-4 mb-8">
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text"
                required
                placeholder="John Doe"
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="date"
                required
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400 min-h-[56px]"
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400"
                value={formData.confirm_password}
                onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-danger text-sm text-center bg-danger-bg py-3 rounded-xl">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-success hover:bg-emerald-600 active:scale-95 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-md shadow-success/20 disabled:opacity-70 flex justify-center items-center h-[56px]"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Register Account'
          )}
        </button>

        <div className="mt-8 text-center text-sm font-medium text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-600 transition-colors">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterScreen;
