import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, HelpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // Show success modal, wait briefly, then navigate
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-bg px-6 py-8">
      
      {/* Success Modal Overlay */}
      {success && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-[320px] w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-success-bg text-success rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-success/20">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Login Successful!</h2>
            <p className="text-gray-500 font-medium text-sm">Welcome back to EasyPay.</p>
          </div>
        </div>
      )}

      {/* Logo and Header */}
      <div className="flex flex-col items-center mt-8 mb-10 text-center">
        <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
          <span className="text-2xl font-bold">EP</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to EasyPay</h1>
        <p className="text-gray-500 text-sm max-w-[280px]">
          Enter your details to start shopping and get health insights
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col w-full">
        <div className="space-y-4 mb-8">
          
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-gray-900 placeholder:text-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-danger text-sm text-center bg-danger-bg py-3 rounded-xl border border-danger/20 font-medium">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading || success}
          className="w-full bg-primary hover:bg-primary-600 active:scale-95 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-md shadow-primary/20 disabled:opacity-70 flex justify-center items-center h-[56px]"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Login'
          )}
        </button>

        <div className="mt-8 mb-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center max-w-[200px] mx-auto w-full">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative bg-gray-bg px-4 text-sm text-gray-400 font-medium">
              OR
            </div>
          </div>
        </div>

        <Link 
          to="/register"
          className="w-full bg-transparent border border-gray-200 text-primary py-4 rounded-2xl font-bold hover:bg-white transition-colors flex justify-center items-center gap-2"
        >
          <span>Create an Account</span>
        </Link>
        
        <div className="mt-auto pt-8 flex flex-col items-center gap-4 text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} />
            <span>Need help logging in?</span>
          </div>
          
          <Link 
            to="/guard"
            className="flex items-center gap-2 text-primary font-bold hover:text-primary-600 transition-colors mt-2"
          >
            <ShieldCheck size={16} />
            <span>Guard Portal Access</span>
          </Link>
        </div>
      </form>

    </div>
  );
};

export default LoginScreen;
