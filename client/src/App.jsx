import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Database, 
  GitBranch, 
  RefreshCw,
  ExternalLink,
  LogOut,
  User,
  ArrowLeft,
  AlertTriangle,
  FolderKanban,
  CheckCircle2
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

  const phases = [
    {
      id: 1,
      title: 'Phase 1: Project Foundation & Baseline',
      dev: 'Primary Developer (You)',
      status: 'Completed',
      desc: 'Monorepo scaffold, Express backend, React Vite Tailwind frontend, health check API, and Git setup.',
      active: false,
      completed: true,
    },
    {
      id: 2,
      title: 'Phase 2: Authentication & Project Workspace',
      dev: 'Primary Developer (You)',
      status: 'Active (Current)',
      desc: 'JWT auth, user registration/login, protected routes, and project CRUD dashboard with empty states.',
      active: true,
      completed: false,
    },
    {
      id: 3,
      title: 'Phase 3: Environment Snapshots & Parsers',
      dev: 'Primary Developer (You)',
      status: 'Next Up',
      desc: 'Dev, Test, Prod snapshot models, key-value table, .env & JSON parsers, and secret detection.',
      active: false,
      completed: false,
    },
    {
      id: 4,
      title: 'Phase 4: Deterministic Comparison Engine',
      dev: 'Teammate',
      status: 'Planned',
      desc: 'Pure JS comparison algorithm, diff visualization table, missing/extra/mismatch indicators, unit tests.',
      active: false,
      completed: false,
    },
    {
      id: 5,
      title: 'Phase 5: Validation Rules Engine & Guardrails',
      dev: 'Primary Developer (You)',
      status: 'Planned',
      desc: 'Configurable validation rules (ranges, patterns, forbidden prod flags), severity indicators.',
      active: false,
      completed: false,
    },
    {
      id: 6,
      title: 'Phase 6: Drift Reports, History & Masking',
      dev: 'Teammate',
      status: 'Planned',
      desc: 'Audit trail, snapshot versioning, masked sensitive values, and JSON/CSV report exports.',
      active: false,
      completed: false,
    },
  ];

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
            {/* Health Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400">API:</span>
              {health?.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Healthy
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 font-mono text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Offline
                </span>
              )}
            </div>

            {/* Auth status buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors border border-slate-700/80"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          selectedProject ? (
            /* Project Detail View (Prepares for Phase 3 Snapshots) */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-5 h-5 text-emerald-400" />
                      <h1 className="text-xl font-bold text-slate-100">{selectedProject.name}</h1>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedProject.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Project ID:</span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">{selectedProject._id}</span>
                </div>
              </div>

              {/* Environments Placeholder Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Active Environments & Snapshots</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Phase 3 Scope
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Snapshot models, structured key-value editor, .env and JSON parsers, and secret auto-masking will be wired directly into this workspace in Phase 3.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-xs font-mono font-semibold text-blue-400">DEVELOPMENT</span>
                    <p className="text-xs text-slate-400 mt-2">Ready for snapshot v1 (.env / JSON)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-xs font-mono font-semibold text-purple-400">TESTING / STAGING</span>
                    <p className="text-xs text-slate-400 mt-2">Ready for snapshot v1 (.env / JSON)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-xs font-mono font-semibold text-emerald-400">PRODUCTION</span>
                    <p className="text-xs text-slate-400 mt-2">Ready for snapshot v1 (.env / JSON)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Dashboard View */
            <Dashboard onSelectProject={(p) => setSelectedProject(p)} />
          )
        ) : (
          /* Unauthenticated Landing & Auth View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Product Value & Phase Tracker */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-xl p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono mb-4">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phase 2 Active: User Auth & Project Workspace</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50 mb-3">
                  Developer Platform for Configuration Reliability
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  ConfigDrift catches inconsistent timeouts, forbidden debug flags, unmasked credentials, and missing environment variables before they trigger production incidents.
                </p>

                {/* Tech Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <p className="text-[11px] font-mono text-slate-500 uppercase">Frontend</p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">React 18 + Vite</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <p className="text-[11px] font-mono text-slate-500 uppercase">Backend</p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">Node.js + Express</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <p className="text-[11px] font-mono text-slate-500 uppercase">Database</p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">MongoDB Mongoose</p>
                  </div>
                </div>
              </div>

              {/* Phased Roadmap List */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <span>6-Phase Implementation Roadmap</span>
                </h3>
                <div className="space-y-2.5">
                  {phases.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        p.active 
                          ? 'bg-slate-900 border-emerald-500/50 text-slate-200' 
                          : p.completed
                          ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                          : 'bg-slate-950/40 border-slate-800/40 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {p.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : p.active ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-700 shrink-0"></span>
                        )}
                        <span className="font-medium">{p.title}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{p.status}</span>
                    </div>
                  ))}
                </div>
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
            <span className="font-mono">Branch: feature/user-auth</span>
            <span>•</span>
            <a 
              href="https://github.com/Gururaj-1107/configdrift" 
              target="_blank" 
              rel="noreferrer"
              className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
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
