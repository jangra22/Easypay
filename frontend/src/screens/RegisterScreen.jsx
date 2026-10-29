import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // State for Google post-signup Date of Birth requirement
  const [pendingGooglePayload, setPendingGooglePayload] = useState(null);
  const [googleUserPreview, setGoogleUserPreview] = useState(null);
  const [googleDob, setGoogleDob] = useState('');

  const googleBtnContainerRef = useRef(null);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Parse JWT token to extract Google name and email for display
  const decodeJwtPayload = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    setError('');
    const decoded = decodeJwtPayload(response.credential);
    
    // Store pending credential and prompt user for their Date of Birth
    setPendingGooglePayload({ credential: response.credential });
    setGoogleUserPreview({
      name: decoded?.name || 'Shopper',
      email: decoded?.email || '',
      picture: decoded?.picture || ''
    });
  };

  // Complete Google sign-in after user inputs their Date of Birth
  const handleCompleteGoogleRegistration = async (e) => {
    e.preventDefault();
    if (!googleDob) {
      setError('Please provide your date of birth for age-based health recommendations.');
      return;
    }

    setGoogleLoading(true);
    setError('');
    try {
      await googleLogin({
        credential: pendingGooglePayload.credential,
        dob: googleDob
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'Google registration failed');
      setGoogleLoading(false);
    }
  };

  // Initialize official Google Identity Services
  useEffect(() => {
    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '707415891431-7g5oeg66jvn0js5ptkd71po5su2ch5th.apps.googleusercontent.com';

    const setupGoogle = () => {
      if (window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'continue_with',
              logo_alignment: 'left',
              width: 340,
            });

            // Detect if Google successfully injected the iframe
            setTimeout(() => {
              if (googleBtnContainerRef.current?.querySelector('iframe')) {
                setGsiLoaded(true);
              }
            }, 500);
          }
        } catch (err) {
          console.warn('Google Identity initialization failed:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          setupGoogle();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  const handleFallbackGoogleClick = () => {
    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '707415891431-7g5oeg66jvn0js5ptkd71po5su2ch5th.apps.googleusercontent.com';

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const reason = notification.getNotDisplayedReason() || notification.getSkippedReason() || 'unknown';
            setError(
              `Google sign-in popup blocked (${reason}). Please ensure "${window.location.origin}" is added to Authorized JavaScript origins in Google Cloud Console.`
            );
          }
        });
      } catch (err) {
        setError(`Google Sign-In failed: ${err.message || 'Domain not authorized in Google Cloud Console'}`);
      }
    } else {
      setError('Google Identity Services script is loading or blocked by an adblocker. Please refresh.');
    }
  };

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
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface px-6 py-8 pb-16 max-w-md mx-auto select-none">
      
      {/* Header */}
      <div className="flex flex-col items-center mt-4 mb-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
          Create Account
        </h1>
        <p className="text-slate-500 text-xs font-medium max-w-[280px] mt-1">
          Join EasyPay for queue-free checkout & personalized dietary safety
        </p>
      </div>

      {/* 1. Official Google Continue Button & Fallback */}
      <div className="flex flex-col items-center justify-center mb-6 w-full max-w-[340px] mx-auto">
        <div
          ref={googleBtnContainerRef}
          className={`w-full flex justify-center ${gsiLoaded ? 'block' : 'hidden'}`}
        />
        {!gsiLoaded && (
          <button
            type="button"
            onClick={handleFallbackGoogleClick}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-display font-semibold text-xs py-3 px-4 rounded-full border border-slate-200 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        )}
        {googleLoading && (
          <div className="flex items-center gap-2 text-xs text-primary font-semibold mt-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Registering Google profile...</span>
          </div>
        )}
      </div>

      {/* Divider OR */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative bg-surface px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          or register with email
        </div>
      </div>

      {/* 2. Traditional Registration Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col w-full">
        <div className="space-y-3.5 mb-6">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-display font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                required
                placeholder="John Doe"
                className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 focus:border-primary focus:bg-white outline-none transition-all text-slate-900 text-xs placeholder:text-slate-400 font-medium shadow-xs"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-display font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 focus:border-primary focus:bg-white outline-none transition-all text-slate-900 text-xs placeholder:text-slate-400 font-medium shadow-xs"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-display font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Date of Birth <span className="text-[10px] text-slate-400 font-normal lowercase">(for tailored health scores)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date"
                required
                className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 focus:border-primary focus:bg-white outline-none transition-all text-slate-900 text-xs placeholder:text-slate-400 font-medium shadow-xs min-h-[46px]"
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-display font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 focus:border-primary focus:bg-white outline-none transition-all text-slate-900 text-xs placeholder:text-slate-400 font-medium shadow-xs"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-display font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 focus:border-primary focus:bg-white outline-none transition-all text-slate-900 text-xs placeholder:text-slate-400 font-medium shadow-xs"
                value={formData.confirm_password}
                onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-rose-700 text-xs text-center bg-rose-50 py-2.5 px-3 rounded-2xl border border-rose-200/80 font-medium">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading || success}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 rounded-full font-display font-bold text-sm transition-all shadow-sm disabled:opacity-70 flex justify-center items-center h-[52px] cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Complete Registration'
          )}
        </button>

        <div className="mt-6 text-center text-xs font-medium text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </form>

      {/* Google Sign-Up: Date of Birth Modal (Only shown after user accepts Google popup) */}
      {pendingGooglePayload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-fade-in">
            
            {/* Header with Google User Info */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              {googleUserPreview?.picture ? (
                <img
                  src={googleUserPreview.picture}
                  alt="Google Avatar"
                  className="w-10 h-10 rounded-full border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary flex items-center justify-center font-bold text-sm">
                  {googleUserPreview?.name?.[0] || 'G'}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-sm text-slate-900 truncate">
                  {googleUserPreview?.name}
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  {googleUserPreview?.email}
                </span>
              </div>
            </div>

            <form onSubmit={handleCompleteGoogleRegistration} className="mt-4 flex flex-col gap-3.5">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/60 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Google account verified! Please enter your <span className="font-bold">Date of Birth</span> below so our AI engine can calculate personalized health safety ratings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-display font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Select Your Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    required
                    value={googleDob}
                    onChange={(e) => setGoogleDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs sm:text-sm text-slate-900 focus:border-primary outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="text-rose-700 bg-rose-50 text-xs font-medium py-2 px-3 rounded-xl border border-rose-200 text-center">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingGooglePayload(null)}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="flex-1 py-2.5 rounded-full bg-primary hover:bg-primary-600 text-white text-xs font-bold shadow-coral-sm cursor-pointer transition-all"
                >
                  {googleLoading ? 'Saving...' : 'Finish Setup'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-[320px] w-full text-center shadow-2xl border border-slate-100 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200/70 shadow-xs">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-1 tracking-tight">
              Account Created!
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Welcome to EasyPay Supermarket.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default RegisterScreen;
