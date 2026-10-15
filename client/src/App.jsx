import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import { 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Database, 
  RefreshCw,
  ExternalLink,
  LogOut,
  AlertTriangle,
  GitCompare,
  FileCheck2,
  Lock
} from 'lucide-react';
import { checkHealth } from './services/api';

function AppContent() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-sm font-mono">Initializing ConfigDrift...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-black">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-100 text-lg">ConfigDrift</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Environment Configuration Validator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Health */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400">System API:</span>
              {health?.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Operational
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 font-mono text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Offline
                </span>
              )}
            </div>

            {/* Authenticated User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors border border-slate-700/80"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          selectedProject ? (
            /* Project Workspace with Snapshots, Ingestion, and Variables Table */
            <ProjectWorkspace 
              project={selectedProject} 
              onBack={() => setSelectedProject(null)} 
            />
          ) : (
            /* Projects Dashboard */
            <Dashboard onSelectProject={(p) => setSelectedProject(p)} />
          )
        ) : (
          /* Professional Landing & Authentication */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-xl p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono mb-4">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Production Configuration Reliability</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50 mb-3">
                  Detect & Prevent Environment Configuration Drift
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  ConfigDrift audits configuration parity across Development, Testing, and Production environments before inconsistent timeouts, unmasked secrets, or missing variables cause critical deployment failures.
                </p>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                    <Layers className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Snapshot Management</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Capture snapshots from .env or JSON with version history.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                    <GitCompare className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Deterministic Comparison</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Algorithmically detects missing, extra, and mismatched keys.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                    <FileCheck2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Rule Validation</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Enforce numeric ranges, URL formats, and environment guards.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Secret Masking</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Auto-redacts credentials, private keys, and authorization tokens.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Architecture Stack */}
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Stack: React 18 (Vite) + Tailwind CSS</span>
                <span>•</span>
                <span>Node.js + Express</span>
                <span>•</span>
                <span>MongoDB</span>
              </div>
            </div>

            {/* Right Column: Authentication Form */}
            <div className="lg:col-span-5">
              {authView === 'login' ? (
                <Login onSwitchToRegister={() => setAuthView('register')} />
              ) : (
                <Register onSwitchToLogin={() => setAuthView('login')} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>ConfigDrift — Environment Configuration Validator</div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/Gururaj-1107/configdrift" 
              target="_blank" 
              rel="noreferrer"
              className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors font-mono"
            >
              GitHub Repository <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
