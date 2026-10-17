import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import {
  ShieldCheck,
  Layers,
  Terminal,
  RefreshCw,
  ExternalLink,
  LogOut,
  AlertTriangle,
  GitCompare,
  FileCheck2,
  Lock,
  Database,
} from 'lucide-react';
import { checkHealth } from './services/api';

function AppContent() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [health, setHealth] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchHealth = async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Refresh health every 60s
    const interval = setInterval(fetchHealth, 60_000);
    return () => clearInterval(interval);
  }, []);

  // When auth state changes, reset project selection
  useEffect(() => {
    if (!isAuthenticated) setSelectedProject(null);
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="absolute -inset-1 rounded-xl border border-emerald-500/20 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">Initializing ConfigDrift</p>
            <p className="text-xs text-slate-500 font-mono mt-1">Restoring session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-100">

      {/* ── Top Navigation ─────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2.5 group focus:outline-none"
            title="Go to dashboard"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/15 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-100 text-base">ConfigDrift</span>
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                v1.0.0
              </span>
            </div>
          </button>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Health and Database pills */}
            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              {health?.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  API
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/50 font-mono">
                  <AlertTriangle className="w-3 h-3" />
                  API Offline
                </span>
              )}

              {health?.database?.status === 'connected' ? (
                <span
                  title={`MongoDB Connected: ${health.database.host || 'active'}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-mono"
                >
                  <Database className="w-3 h-3 text-emerald-400" />
                  DB
                </span>
              ) : (
                <span
                  title="MongoDB is disconnected. Connect local MongoDB or configure MONGODB_URI in server/.env"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/50 font-mono"
                >
                  <Database className="w-3 h-3 text-amber-400" />
                  DB Offline
                </span>
              )}
            </div>

            {/* User menu */}
            {isAuthenticated && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">{user?.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{user?.email}</span>
                </div>
                {/* Avatar circle */}
                <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 uppercase">
                  {user?.name?.[0] ?? '?'}
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  aria-label="Sign out"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Disconnected MongoDB Notice Banner ── */}
      {health && health.database?.status !== 'connected' && (
        <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-200/90 gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>MongoDB is disconnected:</strong> Local database or cloud URI is not connected. Run local MongoDB or add your free Atlas URI to <code className="bg-amber-900/40 px-1 py-0.5 rounded font-mono text-[11px] text-amber-300">server/.env</code>. Run <code className="bg-amber-900/40 px-1 py-0.5 rounded font-mono text-[11px] text-amber-300">npm run db:check</code> to verify.
              </span>
            </div>
            <button
              onClick={fetchHealth}
              className="px-2.5 py-1 bg-amber-900/50 hover:bg-amber-900/80 text-amber-300 rounded border border-amber-700/50 text-[11px] font-mono shrink-0 transition-colors self-start sm:self-auto"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ───────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          selectedProject ? (
            <ProjectWorkspace
              project={selectedProject}
              onBack={() => setSelectedProject(null)}
            />
          ) : (
            <Dashboard onSelectProject={(p) => setSelectedProject(p)} />
          )
        ) : (
          /* Landing + Auth panel */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">

            {/* Left column — product pitch */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-7">
                {/* Label chip */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono mb-5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Environment Configuration Reliability</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50 mb-3 leading-snug">
                  Detect & Prevent<br />Configuration Drift
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                  ConfigDrift audits parity across Development, Testing, and Production — catching missing variables, unmasked secrets, and format mismatches before they cause deployment failures.
                </p>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 pt-6 border-t border-slate-800">
                  {[
                    {
                      icon: Layers,
                      color: 'text-emerald-400',
                      bg: 'bg-emerald-500/10',
                      title: 'Snapshot Management',
                      desc: 'Ingest .env or JSON configs, version them, and compare across branches.'
                    },
                    {
                      icon: GitCompare,
                      color: 'text-blue-400',
                      bg: 'bg-blue-500/10',
                      title: 'Drift Detection',
                      desc: 'Algorithmically surfaces missing, extra, and mismatched environment keys.'
                    },
                    {
                      icon: FileCheck2,
                      color: 'text-purple-400',
                      bg: 'bg-purple-500/10',
                      title: 'Rule Validation',
                      desc: 'Enforce numeric ranges, URL patterns, and production environment guards.'
                    },
                    {
                      icon: Lock,
                      color: 'text-amber-400',
                      bg: 'bg-amber-500/10',
                      title: 'Secret Masking',
                      desc: 'Auto-redacts credentials, private keys, and auth tokens in every view.'
                    },
                  ].map(({ icon: Icon, color, bg, title, desc }) => (
                    <div key={title} className="flex items-start gap-3 p-4 rounded-lg bg-slate-950/70 border border-slate-800/60 hover:border-slate-700 transition-colors">
                      <div className={`w-7 h-7 rounded-md ${bg} border border-slate-800 flex items-center justify-center shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200 mb-0.5">{title}</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stack strip */}
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] text-slate-500 font-mono">
                <span>React 18 + Vite</span>
                <span className="text-slate-700">•</span>
                <span>Tailwind CSS</span>
                <span className="text-slate-700">•</span>
                <span>Node.js + Express</span>
                <span className="text-slate-700">•</span>
                <span>MongoDB</span>
                <span className="text-slate-700">•</span>
                <a
                  href="https://github.com/Gururaj-1107/configdrift"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  GitHub <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Right column — auth panel */}
            <div className="lg:col-span-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
              {authView === 'login' ? (
                <Login onSwitchToRegister={() => setAuthView('register')} />
              ) : (
                <Register onSwitchToLogin={() => setAuthView('login')} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-600">
          <span>ConfigDrift — Environment Configuration Validator</span>
          <a
            href="https://github.com/Gururaj-1107/configdrift"
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors font-mono"
          >
            GitHub <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
