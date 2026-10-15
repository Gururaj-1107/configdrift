import React, { useState, useEffect } from 'react';
import { 
  getSnapshotsApi, 
  createSnapshotApi, 
  deleteSnapshotApi 
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
  Table,
  CheckCircle2,
  X,
  ShieldAlert
} from 'lucide-react';

const ENVIRONMENTS = [
  { id: 'development', label: 'Development', color: 'blue' },
  { id: 'testing', label: 'Testing', color: 'purple' },
  { id: 'production', label: 'Production', color: 'emerald' }
];

export default function ProjectWorkspace({ project, onBack }) {
  const [activeEnv, setActiveEnv] = useState('development');
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Masking
  const [searchQuery, setSearchQuery] = useState('');
  const [maskAllSecrets, setMaskAllSecrets] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [format, setFormat] = useState('dotenv'); // 'dotenv' | 'json'
  const [rawText, setRawText] = useState('');
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchSnapshots = async (envToLoad = activeEnv) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSnapshotsApi(project._id, envToLoad);
      if (res.success && res.data) {
        setSnapshots(res.data);
        if (res.data.length > 0) {
          setSelectedSnapshot(res.data[0]); // default to latest version
        } else {
          setSelectedSnapshot(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots(activeEnv);
    setRevealedKeys(new Set());
  }, [activeEnv, project._id]);

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!rawText.trim()) {
      setModalError('Configuration input cannot be empty');
      return;
    }

    try {
      setCreating(true);
      const res = await createSnapshotApi(project._id, {
        environment: activeEnv,
        format,
        rawText: rawText.trim(),
        label: snapshotLabel.trim()
      });

      if (res.success && res.data) {
        setIsModalOpen(false);
        setRawText('');
        setSnapshotLabel('');
        await fetchSnapshots(activeEnv);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to capture snapshot');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId, version) => {
    if (!window.confirm(`Are you sure you want to delete snapshot v${version}?`)) {
      return;
    }

    try {
      await deleteSnapshotApi(project._id, snapshotId);
      await fetchSnapshots(activeEnv);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete snapshot');
    }
  };

  const toggleKeyVisibility = (key) => {
    const next = new Set(revealedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setRevealedKeys(next);
  };

  const filteredVariables = selectedSnapshot?.variables?.filter((v) =>
    v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.value.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{project.name}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Workspace
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{project.description || 'Application environment workspace'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture Snapshot</span>
          </button>
        </div>
      </div>

      {/* Environment Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex gap-2">
          {ENVIRONMENTS.map((env) => {
            const isActive = activeEnv === env.id;
            return (
              <button
                key={env.id}
                onClick={() => setActiveEnv(env.id)}
                className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-all relative ${
                  isActive
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {env.label}
              </button>
            );
          })}
        </div>

        {snapshots.length > 0 && (
          <div className="flex items-center gap-2 pb-2 text-xs">
            <span className="text-slate-400 font-mono">Version:</span>
            <select
              value={selectedSnapshot?._id || ''}
              onChange={(e) => {
                const found = snapshots.find((s) => s._id === e.target.value);
                if (found) setSelectedSnapshot(found);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {snapshots.map((s) => (
                <option key={s._id} value={s._id}>
                  v{s.version} {s.label ? `— ${s.label}` : ''} ({new Date(s.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchSnapshots(activeEnv)}
            className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 rounded font-mono text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <p className="text-xs font-mono">Loading environment variables...</p>
        </div>
      ) : snapshots.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center max-w-xl mx-auto my-8">
          <div className="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400 mb-4">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 capitalize">
            No snapshot recorded for {activeEnv}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Ingest your current configuration to establish a baseline snapshot (v1) for this environment.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Snapshot v1</span>
          </button>
        </div>
      ) : selectedSnapshot ? (
        /* Active Snapshot Inspector */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                v{selectedSnapshot.version}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {selectedSnapshot.label || 'Snapshot configuration'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {new Date(selectedSnapshot.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter variables..."
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Secret Masking Toggle */}
              <button
                onClick={() => setMaskAllSecrets(!maskAllSecrets)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 transition-colors"
                title={maskAllSecrets ? 'Show all secrets' : 'Mask all secrets'}
              >
                {maskAllSecrets ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Masked</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unmasked</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDeleteSnapshot(selectedSnapshot._id, selectedSnapshot.version)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-900 transition-colors"
                title="Delete this snapshot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Variables Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-1/3">Configuration Key</th>
                    <th className="py-3 px-4 w-1/3">Configured Value</th>
                    <th className="py-3 px-4 w-1/6">Type</th>
                    <th className="py-3 px-4 w-1/6 text-right">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredVariables.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        {searchQuery ? 'No variables matched your search' : 'No variables defined'}
                      </td>
                    </tr>
                  ) : (
                    filteredVariables.map((variable) => {
                      const isMasked = variable.isSecret && maskAllSecrets && !revealedKeys.has(variable.key);
                      const displayVal = isMasked ? '••••••••' : variable.value;

                      return (
                        <tr key={variable.key} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-2.5 px-4 font-semibold text-slate-200">
                            {variable.key}
                          </td>
                          <td className="py-2.5 px-4 text-slate-300">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`truncate max-w-md ${isMasked ? 'tracking-widest text-slate-500' : ''}`}>
                                {displayVal === '' ? (
                                  <span className="italic text-slate-600">[empty string]</span>
                                ) : (
                                  displayVal
                                )}
                              </span>

                              {variable.isSecret && (
                                <button
                                  type="button"
                                  onClick={() => toggleKeyVisibility(variable.key)}
                                  className="text-slate-500 hover:text-slate-300 transition-colors p-1 shrink-0"
                                  title={revealedKeys.has(variable.key) ? 'Mask secret' : 'Reveal secret'}
                                >
                                  {revealedKeys.has(variable.key) ? (
                                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                              variable.dataType === 'number'
                                ? 'bg-indigo-950 text-indigo-300 border-indigo-800/40'
                                : variable.dataType === 'boolean'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-800/40'
                                : variable.dataType === 'json'
                                ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {variable.dataType}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {variable.isSecret ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <Lock className="w-3 h-3" />
                                SECRET
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">public</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="py-2.5 px-4 border-t border-slate-800 bg-slate-900/60 text-slate-500 text-[11px] flex items-center justify-between font-mono">
              <span>Total Keys: {selectedSnapshot.variables.length}</span>
              <span>
                Secrets Detected: {selectedSnapshot.variables.filter((v) => v.isSecret).length}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Capture Snapshot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  Capture {activeEnv.toUpperCase()} Snapshot
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSnapshot} className="mt-4 space-y-4">
              {/* Ingestion Format Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Ingestion Format
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('dotenv')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      format === 'dotenv'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>.env Syntax</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('json')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      format === 'json'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>JSON Object</span>
                  </button>
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Version Label (Optional)
                </label>
                <input
                  type="text"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder="e.g., Release v2.4 pre-deployment baseline"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Raw Text Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Configuration Payload *
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={
                    format === 'dotenv'
                      ? `# Paste .env contents here\nPORT=5000\nAPI_TIMEOUT=30000\nDATABASE_URL=mongodb://localhost:27017\nAPI_KEY=xyz_secret_key`
                      : `{\n  "PORT": 5000,\n  "API_TIMEOUT": 30000,\n  "DATABASE_URL": "mongodb://localhost:27017",\n  "API_KEY": "xyz_secret_key"\n}`
                  }
                  rows={8}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing & Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Snapshot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
