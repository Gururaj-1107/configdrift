import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Database, 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { checkHealth } from './services/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to ConfigDrift API');
    } finally {
      setLoading(false);
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
      status: 'In Progress (Active)',
      desc: 'Monorepo scaffold, Express backend, React Vite Tailwind frontend, health check API, and Git setup.',
      active: true,
      completed: false,
    },
    {
      id: 2,
      title: 'Phase 2: Authentication & Project Workspace',
      dev: 'Teammate',
      status: 'Next Up',
      desc: 'JWT auth, user registration/login, protected routes, and project CRUD dashboard with empty states.',
      active: false,
      completed: false,
    },
    {
      id: 3,
      title: 'Phase 3: Environment Snapshots & Parsers',
      dev: 'Primary Developer (You)',
      status: 'Planned',
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Backend API:</span>
              {loading ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-400" /> Connecting
                </span>
              ) : health?.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Healthy
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  {error || 'Offline'}
                </span>
              )}
            </div>

            <button
              onClick={fetchHealth}
              title="Ping Backend Health"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border border-slate-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-xl p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono mb-4">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phase 1 Verification: Working Foundation Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50 mb-3">
              Detect & Prevent Configuration Drift Across Environments
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              ConfigDrift continuously verifies environment variable parity between Development, Testing, and Production before inconsistent timeouts, unmasked credentials, or missing keys cause silent deployment failures.
            </p>
          </div>

          {/* Quick Architecture Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <Layers className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Frontend Stack</h4>
                <p className="text-xs text-slate-400 mt-0.5">React 18, Vite, Tailwind CSS, Lucide</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <Terminal className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Backend API</h4>
                <p className="text-xs text-slate-400 mt-0.5">Node.js, Express, Helmet, CORS, Morgan</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <Database className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Database</h4>
                <p className="text-xs text-slate-400 mt-0.5">MongoDB with Mongoose (Local / Atlas)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live System Diagnostics */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">System Diagnostics</h3>
            </div>
            <span className="text-xs text-slate-400">Endpoint: /api/health</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-mono">Service Status</p>
              <p className="text-sm font-semibold text-slate-200 mt-1 capitalize">
                {health?.status || (loading ? 'Checking...' : 'Unavailable')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-mono">API Version</p>
              <p className="text-sm font-semibold text-slate-200 mt-1 font-mono">
                {health?.version || '1.0.0'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-mono">MongoDB State</p>
              <p className="text-sm font-semibold text-slate-200 mt-1 capitalize">
                {health?.database?.status || 'Waiting for connection'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-mono">Server Uptime</p>
              <p className="text-sm font-semibold text-slate-200 mt-1 font-mono">
                {health?.uptime !== undefined ? `${health.uptime}s` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* 6-Phase Collaboration Roadmap */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">6-Phase Implementation Roadmap</h2>
              <p className="text-xs text-slate-400">Structured alternation between Primary Developer and Teammate</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>Target: main</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase) => (
              <div 
                key={phase.id}
                className={`p-5 rounded-xl border transition-all ${
                  phase.active 
                    ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/30' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                    phase.active 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {phase.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{phase.dev}</span>
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-2">{phase.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>ConfigDrift — Full-Stack Development Assignment Project</div>
          <div className="flex items-center gap-4">
            <span className="font-mono">Branch: main</span>
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
