import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, CheckCircle2, HelpCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [success, setSuccess] = useState(false);
  const googleBtnContainerRef = useRef(null);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCredentialResponse = async (response) => {
    setGoogleLoading(true);
    setError('');
    try {
      await googleLogin({ credential: response.credential });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

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

          // Render official Google button into the container
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
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface px-6 py-8 max-w-md mx-auto select-none">
      
      {/* Success Modal Overlay */}
      {success && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-[320px] w-full text-center shadow-2xl border border-slate-100 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200/70 shadow-xs">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-1 tracking-tight">Login Successful!</h2>
            <p className="text-slate-500 font-medium text-xs">Entering your EasyPay supermarket session...</p>
          </div>
        </div>
      )}

      {/* Logo and Header */}
      <div className="flex flex-col items-center mt-6 mb-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary via-primary-500 to-primary-700 text-white rounded-2xl flex items-center justify-center shadow-coral mb-4">
          <span className="text-2xl font-display font-black tracking-tight">EP</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
          Welcome to EasyPay
        </h1>
        <p className="text-slate-500 text-xs font-medium max-w-[280px] mt-1">
          Sign in for live supermarket self-checkout & AI health insights
        </p>
      </div>

      {/* Official Google Identity Button & Fallback */}
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
            <span>Verifying Google account...</span>
          </div>
        )}
      </div>

      {/* Divider OR */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative bg-surface px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          or sign in with email
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col w-full">
        <div className="space-y-4 mb-6">
          
          {/* Email Field */}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 focus:border-primary focus:bg-white outline-none transition-all text-slate-900 text-xs placeholder:text-slate-400 font-medium shadow-xs"
              />
            </div>
          </div>

          {/* Password Field */}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 focus:border-primary focus:bg-white outline-none transition-all text-slate-900 text-xs placeholder:text-slate-400 font-medium shadow-xs"
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
          className="w-full bg-primary hover:bg-primary-600 active:scale-[0.98] text-white py-4 rounded-full font-display font-bold text-sm transition-all shadow-coral disabled:opacity-70 flex justify-center items-center h-[52px] cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Sign In to EasyPay'
          )}
        </button>

        <div className="my-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center max-w-[200px] mx-auto w-full">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative bg-surface px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              New Shopper?
            </div>
          </div>
        </div>

        <Link 
          to="/register"
          className="w-full bg-white border border-slate-200/80 text-slate-800 py-3.5 rounded-full font-display font-bold text-xs hover:bg-slate-50 transition-colors flex justify-center items-center gap-2 shadow-xs active:scale-[0.98]"
        >
          <span>Create an Account</span>
        </Link>
        
        <div className="mt-auto pt-8 flex flex-col items-center gap-3 text-slate-400 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <HelpCircle size={14} />
            <span>Need assistance? Ask store staff</span>
          </div>
          
          <Link 
            to="/guard"
            className="flex items-center gap-1.5 text-primary font-display font-bold hover:text-primary-600 transition-colors py-1 px-3 rounded-full bg-primary-50 border border-primary-200/70"
          >
            <ShieldCheck size={14} />
            <span>Security Guard Portal</span>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginScreen;
