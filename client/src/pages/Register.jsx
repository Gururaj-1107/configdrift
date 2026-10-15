import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { ShieldCheck, Lock, Mail, User, ArrowRight, Eye, EyeOff, RefreshCw, CheckCircle2 } from 'lucide-react';

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: '6+ characters', ok: password.length >= 6 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'];

  return (
    <div className="mt-2 space-y-1.5">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? colors[score] : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      {/* Checklist */}
      {password.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {checks.map(({ label, ok }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1 text-[10px] font-mono transition-colors ${
                ok ? 'text-emerald-400' : 'text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Register({ onSwitchToLogin }) {
  const { register } = useAuth();
  const toast = useToast();
  const nameRef = useRef(null);

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [fieldError, setFieldError] = useState({});

  // Auto-focus name on mount
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const validate = () => {
    const errs = {};
    if (!name.trim())         errs.name     = 'Full name is required';
    if (!email.trim())        errs.email    = 'Email is required';
    if (!password)            errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
      toast.success('Account created! Welcome to ConfigDrift.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const InputError = ({ msg }) =>
    msg ? <p className="mt-1 text-[11px] text-red-400 font-medium">{msg}</p> : null;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-slide-up">
      {/* Accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent" />

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight">Create Developer Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">Get started with ConfigDrift workspace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <label htmlFor="reg-name" className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-name"
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldError((p) => ({ ...p, name: '' })); }}
                placeholder="Jane Developer"
                autoComplete="name"
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder:text-slate-600
                  focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                  ${fieldError.name ? 'border-red-500/60' : 'border-slate-800 hover:border-slate-700'}`}
              />
            </div>
            <InputError msg={fieldError.name} />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldError((p) => ({ ...p, email: '' })); }}
                placeholder="developer@company.com"
                autoComplete="email"
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder:text-slate-600
                  focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                  ${fieldError.email ? 'border-red-500/60' : 'border-slate-800 hover:border-slate-700'}`}
              />
            </div>
            <InputError msg={fieldError.email} />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldError((p) => ({ ...p, password: '' })); }}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full pl-9 pr-10 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder:text-slate-600
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
            <PasswordStrength password={password} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white font-semibold rounded-lg text-sm
              flex items-center justify-center gap-2
              transition-all duration-150
              shadow-lg shadow-emerald-950/50
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors focus:outline-none focus:underline"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
}
