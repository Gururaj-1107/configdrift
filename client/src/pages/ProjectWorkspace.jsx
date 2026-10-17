import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  getSnapshotsApi,
  createSnapshotApi,
  deleteSnapshotApi,
} from '../services/api';
import {
  ArrowLeft,
  Plus,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Calendar,
  Search,
  RefreshCw,
  AlertCircle,
  FileCode,
  FileJson,
  CheckCircle2,
  X,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Upload,
  Sparkles,
  GitCompare,
  FileCheck2,
  FileText,
} from 'lucide-react';
import ComparisonTab from '../components/ComparisonTab';
import ValidationRulesTab from '../components/ValidationRulesTab';
import DriftReportsTab from '../components/DriftReportsTab';


/* ============================
   CONSTANTS
   ============================ */

const ENVIRONMENTS = [
  { id: 'development', label: 'Development', short: 'Dev',  variant: 'dev'  },
  { id: 'testing',     label: 'Testing',     short: 'Test', variant: 'test' },
  { id: 'production',  label: 'Production',  short: 'Prod', variant: 'prod' },
];

const TYPE_FILTERS = ['All', 'string', 'number', 'boolean', 'json', 'secret'];

const SAMPLE_DOTENV = `# Sample .env configuration
NODE_ENV=development
PORT=5000
API_TIMEOUT=30000

# Database
DATABASE_URL=mongodb://localhost:27017/myapp

# Auth secrets (auto-detected)
JWT_SECRET=super_secret_jwt_key_do_not_expose
API_KEY=mock_api_key_sample_token_12345

# Feature flags
ENABLE_ANALYTICS=true
MAX_UPLOAD_SIZE=10`;

const SAMPLE_JSON = `{
  "NODE_ENV": "development",
  "PORT": 5000,
  "API_TIMEOUT": 30000,
  "DATABASE_URL": "mongodb://localhost:27017/myapp",
  "JWT_SECRET": "super_secret_jwt_key_do_not_expose",
  "API_KEY": "mock_api_key_sample_token_12345",
  "ENABLE_ANALYTICS": true,
  "MAX_UPLOAD_SIZE": 10
}`;

/* ============================
   COPY-TO-CLIPBOARD BUTTON
   ============================ */
function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: select text
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : label}
      aria-label={copied ? 'Copied!' : label}
      className={`p-1 rounded transition-all shrink-0 focus:outline-none focus:ring-1 focus:ring-emerald-500
        ${copied ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-300'}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ============================
   LINE-NUMBER CODE TEXTAREA
   ============================ */
function CodeTextarea({ value, onChange, placeholder, rows = 10 }) {
  const textareaRef = useRef(null);
  const lineNumRef = useRef(null);

  const lineCount = Math.max(value.split('\n').length, 1);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Sync scroll between line numbers and textarea
  const syncScroll = () => {
    if (lineNumRef.current && textareaRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="code-wrapper bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-colors">
      {/* Line numbers */}
      <div
        ref={lineNumRef}
        className="code-line-numbers overflow-hidden select-none pointer-events-none"
        style={{ maxHeight: `${rows * 1.6 * 0.75}rem`, minHeight: '5rem' }}
        aria-hidden="true"
      >
        {lineNumbers.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        className="code-textarea w-full"
        style={{ maxHeight: `${rows * 1.6 * 0.75}rem`, minHeight: '5rem', overflowY: 'auto' }}
      />
    </div>
  );
}

/* ============================
   DRAG & DROP ZONE
   ============================ */
function DropZone({ onFileContent }) {
  const [isDragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => onFileContent(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  return (
    <div
      className={`drop-zone rounded-lg p-4 flex items-center justify-center gap-3 cursor-pointer transition-all ${isDragging ? 'drag-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Drop a .env or JSON file here, or click to browse"
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <Upload className="w-4 h-4 text-slate-500 shrink-0" />
      <p className="text-xs text-slate-500">
        <span className="text-emerald-400 font-medium">Drop a file</span> or click to browse
        <span className="text-slate-600"> (.env, .json, .txt)</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".env,.json,.txt,text/plain,application/json"
        className="sr-only"
        onChange={(e) => { const f = e.target.files[0]; if (f) readFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

/* ============================
   SNAPSHOT INGESTION MODAL
   ============================ */
function IngestionModal({ activeEnv, onSuccess, onClose }) {
  const toast = useToast();
  const [format, setFormat]   = useState('dotenv');
  const [rawText, setRawText] = useState('');
  const [label, setLabel]     = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError]     = useState('');

  const loadSample = () => {
    setRawText(format === 'dotenv' ? SAMPLE_DOTENV : SAMPLE_JSON);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rawText.trim()) { setError('Configuration payload cannot be empty'); return; }

    try {
      setCreating(true);
      const res = await onSuccess({ format, rawText: rawText.trim(), label: label.trim(), environment: activeEnv });
      if (res) {
        toast.success(`Snapshot captured for ${activeEnv}!`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to capture snapshot';
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const envLabel = ENVIRONMENTS.find((e) => e.id === activeEnv)?.label ?? activeEnv;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Format picker */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Ingestion Format
        </label>
        <div className="flex gap-2">
          {[
            { id: 'dotenv', icon: FileCode, label: '.env Syntax' },
            { id: 'json',   icon: FileJson, label: 'JSON Object' },
          ].map(({ id, icon: Icon, label: lbl }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setFormat(id); setRawText(''); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500
                ${format === id
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lbl}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Version label */}
      <div>
        <label htmlFor="snap-label" className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          Version Label <span className="text-slate-600 normal-case">(optional)</span>
        </label>
        <input
          id="snap-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Release v2.4 pre-deployment baseline"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-600
            focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
      </div>

      {/* Config payload */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Configuration Payload <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
            title="Load a sample configuration"
          >
            <Sparkles className="w-3 h-3" />
            Load Sample
          </button>
        </div>

        <CodeTextarea
          value={rawText}
          onChange={setRawText}
          rows={10}
          placeholder={format === 'dotenv'
            ? `# Paste .env contents here\nPORT=5000\nAPI_TIMEOUT=30000\nDATABASE_URL=mongodb://localhost:27017\nJWT_SECRET=your_secret_key`
            : `{\n  "PORT": 5000,\n  "API_TIMEOUT": 30000,\n  "DATABASE_URL": "mongodb://localhost:27017",\n  "JWT_SECRET": "your_secret_key"\n}`
          }
        />

        {/* Drag & Drop */}
        <div className="mt-2">
          <DropZone onFileContent={setRawText} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors focus:outline-none rounded-lg focus:ring-1 focus:ring-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed
            text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors
            shadow-lg shadow-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {creating ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Parsing & saving...</span></>
          ) : (
            <><CheckCircle2 className="w-3.5 h-3.5" /><span>Save Snapshot</span></>
          )}
        </button>
      </div>
    </form>
  );
}

/* ============================
   VARIABLES TABLE
   ============================ */
function VariablesTable({ variables, maskAllSecrets }) {
  const toast = useToast();
  const [revealedKeys, setRevealedKeys] = useState(new Set());
  const [searchQuery, setSearch]        = useState('');
  const [typeFilter, setTypeFilter]     = useState('All');
  const [sortDir, setSortDir]           = useState(null); // null | 'asc' | 'desc'

  const toggleReveal = (key) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Reset reveals when global mask changes
  useEffect(() => {
    if (maskAllSecrets) setRevealedKeys(new Set());
  }, [maskAllSecrets]);

  /* Filter + sort pipeline */
  const filtered = variables
    .filter((v) => {
      const matchSearch = !searchQuery ||
        v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.value.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === 'All'
        ? true
        : typeFilter === 'secret'
          ? v.isSecret
          : v.dataType === typeFilter;

      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (!sortDir) return 0;
      return sortDir === 'asc'
        ? a.key.localeCompare(b.key)
        : b.key.localeCompare(a.key);
    });

  const cycleSort = () => {
    setSortDir((s) => s === null ? 'asc' : s === 'asc' ? 'desc' : null);
  };

  const SortIcon = () => {
    if (sortDir === 'asc')  return <ChevronUp className="w-3 h-3" />;
    if (sortDir === 'desc') return <ChevronDown className="w-3 h-3" />;
    return <ChevronsUpDown className="w-3 h-3 text-slate-600" />;
  };

  const secretCount   = variables.filter((v) => v.isSecret).length;
  const filteredCount = filtered.length;

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="var-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter variables..."
            aria-label="Filter variables"
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-600
              focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((f) => {
            const count = f === 'All'
              ? variables.length
              : f === 'secret'
                ? secretCount
                : variables.filter((v) => v.dataType === f).length;

            if (f !== 'All' && count === 0) return null;

            return (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-colors focus:outline-none
                  ${typeFilter === f
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
              >
                {f}
                <span className={`${typeFilter === f ? 'text-emerald-400' : 'text-slate-600'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs vars-table" aria-label="Environment variables">
            <thead className="bg-slate-900/90 text-slate-500 uppercase font-mono tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-5/12">
                  <button
                    onClick={cycleSort}
                    className="inline-flex items-center gap-1.5 hover:text-slate-300 transition-colors focus:outline-none"
                    title="Sort by key name"
                    aria-label="Sort by key name"
                  >
                    Key <SortIcon />
                  </button>
                </th>
                <th className="py-3 px-4 w-4/12">Value</th>
                <th className="py-3 px-4 w-1/12">Type</th>
                <th className="py-3 px-4 w-2/12 text-center">Security</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
              {filteredCount === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    {searchQuery || typeFilter !== 'All'
                      ? 'No variables match the current filter'
                      : 'No variables defined in this snapshot'}
                  </td>
                </tr>
              ) : (
                filtered.map((variable) => {
                  const isMasked = variable.isSecret && maskAllSecrets && !revealedKeys.has(variable.key);
                  const displayVal = isMasked ? '••••••••••' : variable.value;

                  return (
                    <tr key={variable.key}>
                      {/* Key */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5 group/key">
                          <span className="font-semibold text-slate-200 break-all">{variable.key}</span>
                          <CopyButton text={variable.key} label="Copy key" />
                        </div>
                      </td>

                      {/* Value */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`break-all max-w-xs ${
                              isMasked
                                ? 'tracking-widest text-slate-600 select-none'
                                : variable.value === ''
                                  ? 'italic text-slate-600'
                                  : 'text-slate-300'
                            }`}
                          >
                            {variable.value === '' && !isMasked ? '[empty]' : displayVal}
                          </span>

                          {/* Reveal / mask per-row */}
                          {variable.isSecret && (
                            <button
                              type="button"
                              onClick={() => toggleReveal(variable.key)}
                              aria-label={revealedKeys.has(variable.key) ? 'Mask secret' : 'Reveal secret'}
                              title={revealedKeys.has(variable.key) ? 'Mask secret' : 'Reveal secret'}
                              className="text-slate-600 hover:text-slate-300 p-1 transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                            >
                              {revealedKeys.has(variable.key)
                                ? <EyeOff className="w-3 h-3 text-amber-400" />
                                : <Eye className="w-3 h-3" />
                              }
                            </button>
                          )}

                          {/* Copy value (only if not masked) */}
                          {!isMasked && (
                            <CopyButton text={variable.value || ''} label="Copy value" />
                          )}
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="py-2.5 px-4">
                        <Badge variant={variable.dataType} size="xs">
                          {variable.dataType}
                        </Badge>
                      </td>

                      {/* Security badge */}
                      <td className="py-2.5 px-4 text-center">
                        {variable.isSecret ? (
                          <Badge variant="secret" size="xs">
                            <Lock className="w-2.5 h-2.5" />
                            SECRET
                          </Badge>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600">public</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer stats */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between font-mono text-[10px] text-slate-600">
          <span>
            {filteredCount < variables.length
              ? `${filteredCount} of ${variables.length} keys`
              : `${variables.length} key${variables.length !== 1 ? 's' : ''} total`}
          </span>
          <span>
            {secretCount > 0 && (
              <span className="text-amber-600/80">{secretCount} secret{secretCount !== 1 ? 's' : ''} detected</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================
   MAIN — ProjectWorkspace
   ============================ */
export default function ProjectWorkspace({ project, onBack }) {
  const toast = useToast();

  const [workspaceTab, setWorkspaceTab]         = useState('snapshots'); // 'snapshots' | 'comparison' | 'rules' | 'reports'
  const [activeEnv, setActiveEnv]               = useState('development');
  const [snapshots, setSnapshots]               = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [maskAllSecrets, setMaskAllSecrets]     = useState(true);
  const [isModalOpen, setModal]                 = useState(false);

  /* Fetch snapshots for active env */
  const fetchSnapshots = useCallback(async (env = activeEnv) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSnapshotsApi(project._id, env);
      if (res.success && res.data) {
        setSnapshots(res.data);
        setSelectedSnapshot(res.data.length > 0 ? res.data[0] : null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    fetchSnapshots(activeEnv);
  }, [activeEnv, fetchSnapshots]);

  /* Handle snapshot creation */
  const handleCreateSnapshot = async (payload) => {
    const res = await createSnapshotApi(project._id, payload);
    if (res.success && res.data) {
      setModal(false);
      await fetchSnapshots(activeEnv);
      return res.data;
    }
    throw new Error(res.message || 'Failed to capture snapshot');
  };

  /* Handle snapshot delete */
  const handleDeleteSnapshot = async (snapshotId, version) => {
    if (!window.confirm(`Delete snapshot v${version}? This cannot be undone.`)) return;
    try {
      await deleteSnapshotApi(project._id, snapshotId);
      toast.success(`Snapshot v${version} deleted.`);
      await fetchSnapshots(activeEnv);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete snapshot');
    }
  };

  const envConfig = ENVIRONMENTS.find((e) => e.id === activeEnv);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Workspace Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            id="btn-back-dashboard"
            onClick={onBack}
            aria-label="Back to projects"
            title="Back to Projects"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Breadcrumb */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100">{project.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {project.description || 'Application environment workspace'}
            </p>
          </div>
        </div>

        {workspaceTab === 'snapshots' && (
          <div className="flex items-center gap-2.5">
            {/* Global mask toggle */}
            <button
              onClick={() => setMaskAllSecrets((v) => !v)}
              title={maskAllSecrets ? 'Reveal all secrets' : 'Mask all secrets'}
              aria-label={maskAllSecrets ? 'Reveal all secrets' : 'Mask all secrets'}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500
                ${maskAllSecrets
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/15'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              {maskAllSecrets
                ? <><EyeOff className="w-3.5 h-3.5" /><span className="hidden sm:inline">Masked</span></>
                : <><Eye className="w-3.5 h-3.5" /><span className="hidden sm:inline">Revealed</span></>
              }
            </button>

            {/* Capture snapshot button */}
            <button
              id="btn-capture-snapshot"
              onClick={() => setModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors
                shadow-lg shadow-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capture Snapshot</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Workspace Sub-Navigation Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-px">
        {[
          { id: 'snapshots', label: 'Snapshots', icon: Layers },
          { id: 'comparison', label: 'Comparison Engine', icon: GitCompare },
          { id: 'rules', label: 'Validation Rules', icon: FileCheck2 },
          { id: 'reports', label: 'Drift Reports', icon: FileText },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = workspaceTab === id;
          return (
            <button
              key={id}
              onClick={() => setWorkspaceTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px focus:outline-none ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Views ── */}
      {workspaceTab === 'comparison' && (
        <ComparisonTab project={project} onReportSaved={() => setWorkspaceTab('reports')} />
      )}

      {workspaceTab === 'rules' && (
        <ValidationRulesTab project={project} />
      )}

      {workspaceTab === 'reports' && (
        <DriftReportsTab project={project} />
      )}

      {workspaceTab === 'snapshots' && (
        <div className="space-y-6">

      {/* ── Environment Tabs ── */}
      <div className="flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-0">
          {ENVIRONMENTS.map((env) => {
            const isActive = activeEnv === env.id;
            return (
              <button
                key={env.id}
                id={`tab-env-${env.id}`}
                onClick={() => setActiveEnv(env.id)}
                className={`env-tab pb-3 px-4 text-xs font-semibold tracking-wide transition-colors relative focus:outline-none
                  ${isActive ? 'active text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                aria-selected={isActive}
                role="tab"
              >
                <span className="hidden sm:inline">{env.label}</span>
                <span className="sm:hidden">{env.short}</span>
              </button>
            );
          })}
        </div>

        {/* Version picker */}
        {snapshots.length > 0 && (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-[10px] text-slate-600 font-mono hidden sm:inline">Version</span>
            <select
              value={selectedSnapshot?._id || ''}
              onChange={(e) => {
                const found = snapshots.find((s) => s._id === e.target.value);
                if (found) setSelectedSnapshot(found);
              }}
              aria-label="Select snapshot version"
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 font-mono
                focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            >
              {snapshots.map((s) => (
                <option key={s._id} value={s._id}>
                  v{s.version}{s.label ? ` — ${s.label}` : ''} ({new Date(s.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/60 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchSnapshots(activeEnv)}
            className="px-3 py-1 bg-red-900/60 hover:bg-red-800 rounded-lg font-mono text-white transition-colors text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Main Content Area ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <p className="text-xs font-mono text-slate-500">Loading environment variables...</p>
        </div>
      ) : snapshots.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-14 text-center max-w-lg mx-auto animate-fade-in">
          <div className="h-14 w-14 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-7 h-7 text-emerald-400" />
          </div>
          <Badge variant={envConfig?.variant} size="sm" dot className="mb-3">
            {envConfig?.label}
          </Badge>
          <h3 className="text-sm font-semibold text-slate-200 mt-2">No snapshot recorded</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            Ingest your current configuration to establish baseline snapshot v1 for this environment.
          </p>
          <button
            onClick={() => setModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Snapshot v1</span>
          </button>
        </div>
      ) : selectedSnapshot ? (
        /* Snapshot inspector */
        <div className="space-y-4 animate-fade-in">
          {/* Snapshot metadata bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="success" size="sm" dot>v{selectedSnapshot.version}</Badge>
              <span className="text-xs text-slate-300 font-medium">
                {selectedSnapshot.label || `${envConfig?.label} snapshot`}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                <Calendar className="w-3 h-3" />
                {new Date(selectedSnapshot.createdAt).toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => handleDeleteSnapshot(selectedSnapshot._id, selectedSnapshot.version)}
              title="Delete this snapshot version"
              aria-label="Delete snapshot"
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-600 hover:text-red-400 hover:border-red-900/60 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Variables table */}
          <VariablesTable
            variables={selectedSnapshot.variables || []}
            maskAllSecrets={maskAllSecrets}
          />
        </div>
      ) : null}
        </div>
      )}

      {/* ── Capture Snapshot Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModal(false)}
        title={`Capture ${envConfig?.label ?? activeEnv} Snapshot`}
        size="lg"
      >
        <IngestionModal
          activeEnv={activeEnv}
          onSuccess={handleCreateSnapshot}
          onClose={() => setModal(false)}
        />
      </Modal>
    </div>
  );
}
