import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, RefreshCw } from 'lucide-react';

export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  const toast = useToast();
  const emailRef = useRef(null);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [fieldError, setFieldError] = useState({});

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validate = () => {
    const errs = {};
    if (!email.trim())    errs.email    = 'Email is required';
    if (!password.trim()) errs.password = 'Password is required';
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
      toast.success('Welcome back! Signed in successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@configdrift.com');
    setPassword('Password123!');
    setFieldError({});
    toast.info('Demo credentials loaded!');
  };

  const InputError = ({ msg }) =>
    msg ? <p className="mt-1 text-[11px] text-red-400 font-medium">{msg}</p> : null;

  return (
    <div className="relative w-full group">
      {/* Subtle outer glow on card */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/20 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none" />

      <div className="relative w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 hover:border-slate-700/80 rounded-xl shadow-2xl overflow-hidden animate-slide-up transition-colors duration-300">
        {/* Card Header accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent" />

        <div className="p-6 sm:p-8">
          {/* Brand lockup */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 leading-tight">Sign in to ConfigDrift</h2>
                <p className="text-xs text-slate-400 mt-0.5">Access your projects and configuration snapshots</p>
              </div>
            </div>

            {/* Quick Demo Fill Pill */}
            <button
              type="button"
              onClick={handleFillDemo}
              title="Autofill test demo account"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.96] text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <span>⚡ Demo Login</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldError((p) => ({ ...p, email: '' })); }}
                  placeholder="developer@company.com"
                  autoComplete="email"
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border rounded-lg text-sm text-slate-100 placeholder:text-slate-600
                    focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                    ${fieldError.email ? 'border-red-500/60' : 'border-slate-800 hover:border-slate-700'}`}
                />
              </div>
              <InputError msg={fieldError.email} />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldError((p) => ({ ...p, password: '' })); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border rounded-lg text-sm text-slate-100 placeholder:text-slate-600
                    focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                    ${fieldError.password ? 'border-red-500/60' : 'border-slate-800 hover:border-slate-700'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 transition-colors"
                >
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <InputError msg={fieldError.password} />
            </div>

            {/* Demo button on mobile screens */}
            <div className="sm:hidden flex justify-end">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs text-emerald-400 hover:text-emerald-300 active:scale-[0.98] transition-all font-mono"
              >
                ⚡ Fill Demo Credentials
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                text-white font-semibold rounded-lg text-sm
                flex items-center justify-center gap-2
                transition-all duration-150
                shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/25
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-click Demo Button Footer alternative */}
          <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
            <span>Testing the app?</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-emerald-400 hover:text-emerald-300 active:scale-[0.98] font-medium transition-all focus:outline-none hover:underline"
            >
              Fill Demo Credentials
            </button>
          </div>

          {/* Switch to Register */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors focus:outline-none focus:underline"
            >
              Create one now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
