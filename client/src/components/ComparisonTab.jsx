import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import Badge from './Badge';
import {
  getSnapshotsApi,
  compareSnapshotsApi,
  saveDriftReportApi,
} from '../services/api';
import {
  GitCompare,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileDown,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

const STATUS_CONFIG = {
  MATCH: {
    label: 'Match',
    variant: 'success',
    icon: CheckCircle2,
  },
  VALUE_MISMATCH: {
    label: 'Value Mismatch',
    variant: 'warning',
    icon: AlertTriangle,
  },
  TYPE_MISMATCH: {
    label: 'Type Mismatch',
    variant: 'warning',
    icon: AlertTriangle,
  },
  MISSING_IN_TARGET: {
    label: 'Missing in Target',
    variant: 'error',
    icon: XCircle,
  },
  EXTRA_IN_TARGET: {
    label: 'Extra in Target',
    variant: 'info',
    icon: AlertTriangle,
  },
};

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
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

export default function ComparisonTab({ project, onReportSaved }) {
  const toast = useToast();

  const [snapshots, setSnapshots] = useState([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);

  const [baseSnapshotId, setBaseSnapshotId] = useState('');
  const [targetSnapshotId, setTargetSnapshotId] = useState('');

  const [comparing, setComparing] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchKey, setSearchKey] = useState('');
  const [maskSecrets, setMaskSecrets] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState(new Set());

  // Load all snapshots across environments
  const loadAllSnapshots = useCallback(async () => {
    try {
      setLoadingSnapshots(true);
      setError(null);
      const res = await getSnapshotsApi(project._id);
      if (res.success && res.data) {
        setSnapshots(res.data);

        // Pre-select defaults: dev as base, prod or test as target if available
        const devSnap = res.data.find((s) => s.environment === 'development');
        const prodSnap = res.data.find((s) => s.environment === 'production');
        const testSnap = res.data.find((s) => s.environment === 'testing');

        if (devSnap) setBaseSnapshotId(devSnap._id);
        if (prodSnap) setTargetSnapshotId(prodSnap._id);
        else if (testSnap) setTargetSnapshotId(testSnap._id);
        else if (res.data.length > 1) setTargetSnapshotId(res.data[1]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load snapshots');
    } finally {
      setLoadingSnapshots(false);
    }
  }, [project._id]);

  useEffect(() => {
    loadAllSnapshots();
  }, [loadAllSnapshots]);

  const handleCompare = async () => {
    if (!baseSnapshotId || !targetSnapshotId) {
      toast.error('Please select both a Base and Target snapshot');
      return;
    }
    if (baseSnapshotId === targetSnapshotId) {
      toast.error('Cannot compare a snapshot with itself. Choose different snapshots.');
      return;
    }

    try {
      setComparing(true);
      setError(null);
      const res = await compareSnapshotsApi(project._id, {
        baseSnapshotId,
        targetSnapshotId,
      });
      if (res.success && res.data) {
        setComparisonResult(res.data);
        setRevealedKeys(new Set());
        toast.success('Snapshots compared successfully');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Comparison failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setComparing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!baseSnapshotId || !targetSnapshotId) return;
    try {
      setSavingReport(true);
      const res = await saveDriftReportApi(project._id, {
        baseSnapshotId,
        targetSnapshotId,
      });
      if (res.success && res.data) {
        toast.success('Drift report saved to project history!');
        if (onReportSaved) onReportSaved(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save report');
    } finally {
      setSavingReport(false);
    }
  };

  const toggleReveal = (key) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Filter findings
  const findings = comparisonResult?.findings || [];
  const filteredFindings = findings.filter((f) => {
    if (searchKey.trim() && !f.key.toLowerCase().includes(searchKey.toLowerCase())) {
      return false;
    }
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'DIFF' && f.status !== 'MATCH') return true;
    return f.status === filterStatus;
  });

  const summary = comparisonResult?.summary;

  return (
    <div className="space-y-6">
      {/* Snapshot Selectors & Compare Trigger */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Base Snapshot */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Base Snapshot (Source)
              </label>
              <select
                value={baseSnapshotId}
                onChange={(e) => setBaseSnapshotId(e.target.value)}
                disabled={loadingSnapshots}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono
                  focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="">Select Base Snapshot...</option>
                {snapshots.map((s) => (
                  <option key={s._id} value={s._id}>
                    [{s.environment.toUpperCase()}] v{s.version} — {s.label || 'Snapshot'} ({new Date(s.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Snapshot */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Snapshot (Compare Against)
              </label>
              <select
                value={targetSnapshotId}
                onChange={(e) => setTargetSnapshotId(e.target.value)}
                disabled={loadingSnapshots}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono
                  focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="">Select Target Snapshot...</option>
                {snapshots.map((s) => (
                  <option key={s._id} value={s._id}>
                    [{s.environment.toUpperCase()}] v{s.version} — {s.label || 'Snapshot'} ({new Date(s.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2.5 pt-2 lg:pt-5">
            <button
              onClick={handleCompare}
              disabled={comparing || !baseSnapshotId || !targetSnapshotId}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed
                text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {comparing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Run Comparison</span>
                </>
              )}
            </button>
          </div>
        </div>

        {snapshots.length < 2 && !loadingSnapshots && (
          <p className="text-xs text-amber-400/90 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>You need at least two snapshots captured across environments to run a comparison. Capture snapshots in the Snapshots tab.</span>
          </p>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="space-y-5 animate-fade-in">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Keys</span>
              <div className="text-lg font-bold font-mono text-slate-100 mt-1">{summary.totalKeys}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Matches</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{summary.matchedKeys}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Mismatches</span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">{summary.differingKeys}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Missing Keys</span>
              <div className="text-lg font-bold font-mono text-red-400 mt-1">{summary.missingKeys}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">Extra Keys</span>
              <div className="text-lg font-bold font-mono text-blue-400 mt-1">{summary.extraKeys}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Rule Violations</span>
              <div className="text-lg font-bold font-mono text-purple-400 mt-1">{summary.ruleViolations}</div>
            </div>
          </div>

          {/* Action Bar (Filters, Search, Mask, Save Report) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-[11px] font-mono">
                {['ALL', 'DIFF', 'MATCH', 'VALUE_MISMATCH', 'MISSING_IN_TARGET', 'EXTRA_IN_TARGET'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2 py-1 rounded transition-colors ${
                      filterStatus === st
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'DIFF' ? 'All Drifts' : st.replace('_IN_TARGET', '').replace('_', ' ')}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="Search key..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 w-36"
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setMaskSecrets((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                {maskSecrets ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{maskSecrets ? 'Secrets Masked' : 'Secrets Revealed'}</span>
              </button>

              <button
                onClick={handleSaveReport}
                disabled={savingReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                {savingReport ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                <span>Save Report</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 font-mono text-[11px] text-slate-400">
                    <th className="py-3 px-4">Key</th>
                    <th className="py-3 px-4">
                      {comparisonResult.baseSnapshot.environment.toUpperCase()} (v{comparisonResult.baseSnapshot.version})
                    </th>
                    <th className="py-3 px-4">
                      {comparisonResult.targetSnapshot.environment.toUpperCase()} (v{comparisonResult.targetSnapshot.version})
                    </th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredFindings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No findings match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredFindings.map((finding) => {
                      const cfg = STATUS_CONFIG[finding.status] || STATUS_CONFIG.MATCH;
                      const isRevealed = revealedKeys.has(finding.key) || !maskSecrets;
                      const isSecret = finding.isSecret;

                      const baseDisplay = isSecret && !isRevealed
                        ? '••••••••'
                        : finding.baseValue ?? <span className="text-slate-600 italic">[missing]</span>;

                      const targetDisplay = isSecret && !isRevealed
                        ? '••••••••'
                        : finding.targetValue ?? <span className="text-slate-600 italic">[missing]</span>;

                      return (
                        <tr
                          key={finding.key}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Key */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-200">{finding.key}</span>
                              <CopyButton text={finding.key} label="Copy key" />
                              {isSecret && (
                                <button
                                  type="button"
                                  onClick={() => toggleReveal(finding.key)}
                                  className="text-slate-500 hover:text-slate-300 p-0.5"
                                  title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                                >
                                  {isRevealed ? (
                                    <EyeOff className="w-3 h-3 text-amber-400" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            {finding.ruleMessages && finding.ruleMessages.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {finding.ruleMessages.map((msg, i) => (
                                  <div
                                    key={i}
                                    className="text-[10px] text-amber-400/90 flex items-center gap-1 font-sans"
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    <span>{msg}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Base Value */}
                          <td className="py-2.5 px-4 text-slate-300 break-all max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={finding.status === 'MISSING_IN_TARGET' ? 'text-emerald-300' : ''}>
                                {baseDisplay}
                              </span>
                              {finding.baseType && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-500">
                                  {finding.baseType}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Target Value */}
                          <td className="py-2.5 px-4 text-slate-300 break-all max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={
                                  finding.status === 'VALUE_MISMATCH' || finding.status === 'TYPE_MISMATCH'
                                    ? 'text-amber-300 font-semibold'
                                    : finding.status === 'EXTRA_IN_TARGET'
                                    ? 'text-blue-300'
                                    : ''
                                }
                              >
                                {targetDisplay}
                              </span>
                              {finding.targetType && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-500">
                                  {finding.targetType}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-4 text-center">
                            <Badge variant={cfg.variant} size="xs" dot>
                              {cfg.label}
                            </Badge>
                          </td>

                          {/* Severity */}
                          <td className="py-2.5 px-4 text-center">
                            <Badge
                              variant={
                                finding.severity === 'ERROR'
                                  ? 'error'
                                  : finding.severity === 'WARNING'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="xs"
                            >
                              {finding.severity}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
