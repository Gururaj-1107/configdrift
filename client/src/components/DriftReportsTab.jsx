import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import Modal from './Modal';
import Badge from './Badge';
import {
  getDriftReportsApi,
  getDriftReportByIdApi,
  exportDriftReportApi,
} from '../services/api';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

export default function DriftReportsTab({ project }) {
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);

  const [exporting, setExporting] = useState(null); // 'json' | 'csv' | null

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDriftReportsApi(project._id);
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load drift reports');
    } finally {
      setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewReport = async (reportId) => {
    try {
      setLoadingDetail(true);
      const res = await getDriftReportByIdApi(project._id, reportId);
      if (res.success && res.data) {
        setSelectedReport(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load report details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExport = async (reportId, format = 'json') => {
    try {
      setExporting(`${reportId}-${format}`);
      const data = await exportDriftReportApi(project._id, reportId, format);

      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `drift-report-${reportId}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `drift-report-${reportId}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Exported report as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(`Failed to export report as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Historical Drift Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of saved comparisons across deployment environments with JSON and CSV export capabilities.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Loading drift reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center max-w-md mx-auto">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Drift Reports Saved Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Run a snapshot comparison in the Comparison tab and click "Save Report" to create a permanent audit log.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const summary = report.summary || {};
            const isJsonExporting = exporting === `${report._id}-json`;
            const isCsvExporting = exporting === `${report._id}-csv`;

            return (
              <div
                key={report._id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-200 font-mono">
                      Report #{report._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-slate-600">•</span>
                    <Badge variant={report.baseEnvironment === 'development' ? 'dev' : report.baseEnvironment === 'production' ? 'prod' : 'test'} size="xs">
                      {report.baseEnvironment}
                    </Badge>
                    <span className="text-xs text-slate-600">vs</span>
                    <Badge variant={report.targetEnvironment === 'development' ? 'dev' : report.targetEnvironment === 'production' ? 'prod' : 'test'} size="xs">
                      {report.targetEnvironment}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {report.generatedBy?.name && (
                      <span>by {report.generatedBy.name}</span>
                    )}
                  </div>

                  {/* Summary badges */}
                  <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {summary.totalKeys ?? 0} keys
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      {summary.matchedKeys ?? 0} matches
                    </span>
                    {(summary.differingKeys ?? 0) > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                        {summary.differingKeys} mismatches
                      </span>
                    )}
                    {(summary.missingKeys ?? 0) > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                        {summary.missingKeys} missing
                      </span>
                    )}
                    {(summary.extraKeys ?? 0) > 0 && (
                      <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                        {summary.extraKeys} extra
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleViewReport(report._id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleExport(report._id, 'json')}
                    disabled={isJsonExporting}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition-colors"
                    title="Export as JSON"
                  >
                    {isJsonExporting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={() => handleExport(report._id, 'csv')}
                    disabled={isCsvExporting}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition-colors"
                    title="Export as CSV"
                  >
                    {isCsvExporting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={
          selectedReport
            ? `Drift Report — ${selectedReport.baseEnvironment.toUpperCase()} vs ${selectedReport.targetEnvironment.toUpperCase()}`
            : 'Report Detail'
        }
        size="lg"
      >
        {selectedReport && (
          <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
            {/* Header info */}
            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] pb-3 border-b border-slate-800">
              <div>
                Report ID: <span className="text-slate-200">{selectedReport._id}</span>
              </div>
              <div>
                {new Date(selectedReport.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono">
                <span className="text-[9px] text-slate-500">TOTAL</span>
                <div className="text-sm font-bold text-slate-200">{selectedReport.summary?.totalKeys}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono">
                <span className="text-[9px] text-emerald-400">MATCH</span>
                <div className="text-sm font-bold text-emerald-400">{selectedReport.summary?.matchedKeys}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono">
                <span className="text-[9px] text-amber-400">DIFF</span>
                <div className="text-sm font-bold text-amber-400">{selectedReport.summary?.differingKeys}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono">
                <span className="text-[9px] text-red-400">MISSING</span>
                <div className="text-sm font-bold text-red-400">{selectedReport.summary?.missingKeys}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono">
                <span className="text-[9px] text-blue-400">EXTRA</span>
                <div className="text-sm font-bold text-blue-400">{selectedReport.summary?.extraKeys}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono">
                <span className="text-[9px] text-purple-400">RULES</span>
                <div className="text-sm font-bold text-purple-400">{selectedReport.summary?.ruleViolations}</div>
              </div>
            </div>

            {/* Findings table */}
            <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <th className="py-2 px-3">Key</th>
                    <th className="py-2 px-3">{selectedReport.baseEnvironment}</th>
                    <th className="py-2 px-3">{selectedReport.targetEnvironment}</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(selectedReport.findings || []).map((f) => (
                    <tr key={f.key} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-semibold text-slate-200">
                        {f.key}
                        {f.ruleMessages && f.ruleMessages.length > 0 && (
                          <div className="text-[9px] text-amber-400 font-sans mt-0.5">
                            {f.ruleMessages.join('; ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-400 break-all max-w-[120px]">
                        {f.isSecret ? '••••••••' : f.baseValue ?? <span className="text-slate-600">[missing]</span>}
                      </td>
                      <td className="py-2 px-3 text-slate-400 break-all max-w-[120px]">
                        {f.isSecret ? '••••••••' : f.targetValue ?? <span className="text-slate-600">[missing]</span>}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge
                          variant={
                            f.status === 'MATCH'
                              ? 'success'
                              : f.status === 'MISSING_IN_TARGET'
                              ? 'error'
                              : f.status === 'EXTRA_IN_TARGET'
                              ? 'info'
                              : 'warning'
                          }
                          size="xs"
                        >
                          {f.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Export buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleExport(selectedReport._id, 'json')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg font-mono text-xs hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
              <button
                onClick={() => handleExport(selectedReport._id, 'csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg font-mono text-xs hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
