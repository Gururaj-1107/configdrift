import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './Toast';
import Modal from './Modal';
import Badge from './Badge';
import {
  getValidationRulesApi,
  createValidationRuleApi,
  deleteValidationRuleApi,
} from '../services/api';
import {
  ShieldAlert,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Sliders,
  CheckCircle,
} from 'lucide-react';

const RULE_TYPES = [
  { id: 'required', label: 'Required Key', desc: 'Fails if key is missing or blank in environment' },
  { id: 'type', label: 'Type Enforcement', desc: 'Enforces number, boolean, url, or email format' },
  { id: 'range', label: 'Numeric Range', desc: 'Enforces min and/or max numeric values' },
  { id: 'regex', label: 'Regex Pattern', desc: 'Validates value matches a regular expression' },
  { id: 'forbidden_in_env', label: 'Forbidden in Env', desc: 'Prevents key from existing in specific environment (e.g. prod)' },
  { id: 'not_equals', label: 'Forbidden Value', desc: 'Ensures key does not equal an insecure or development value' },
];

function AddRuleForm({ project, onSuccess, onClose }) {
  const toast = useToast();
  const keyRef = useRef(null);

  const [key, setKey] = useState('');
  const [ruleType, setRuleType] = useState('required');
  const [targetEnv, setTargetEnv] = useState('all');
  const [severity, setSeverity] = useState('error');
  const [description, setDescription] = useState('');

  // Type specific parameters
  const [expectedType, setExpectedType] = useState('number');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [pattern, setPattern] = useState('');
  const [forbiddenEnv, setForbiddenEnv] = useState('production');
  const [forbiddenValue, setForbiddenValue] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    keyRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!key.trim()) {
      setError('Variable key cannot be empty');
      return;
    }

    const parameters = {};
    if (ruleType === 'type') {
      parameters.expectedType = expectedType;
    } else if (ruleType === 'range') {
      if (minValue !== '') parameters.minValue = Number(minValue);
      if (maxValue !== '') parameters.maxValue = Number(maxValue);
    } else if (ruleType === 'regex') {
      if (!pattern.trim()) {
        setError('Regex pattern cannot be empty');
        return;
      }
      parameters.pattern = pattern.trim();
    } else if (ruleType === 'forbidden_in_env') {
      parameters.forbiddenEnvironment = forbiddenEnv;
    } else if (ruleType === 'not_equals') {
      parameters.forbiddenValue = forbiddenValue;
    }

    try {
      setSaving(true);
      const res = await createValidationRuleApi(project._id, {
        key: key.trim(),
        ruleType,
        targetEnvironment: targetEnv,
        parameters,
        severity,
        description: description.trim(),
      });

      if (res.success && res.data) {
        toast.success(`Rule for "${res.data.key}" configured successfully!`);
        onSuccess(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error creating rule';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Key input */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
          Target Variable Key <span className="text-red-400">*</span>
        </label>
        <input
          ref={keyRef}
          type="text"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(''); }}
          placeholder="e.g., API_TIMEOUT, PORT, DATABASE_URL, DEBUG"
          required
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Rule Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Rule Type
          </label>
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          >
            {RULE_TYPES.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Target Environment
          </label>
          <select
            value={targetEnv}
            onChange={(e) => setTargetEnv(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Environments</option>
            <option value="development">Development Only</option>
            <option value="testing">Testing Only</option>
            <option value="production">Production Only</option>
          </select>
        </div>
      </div>

      {/* Dynamic Parameters */}
      {ruleType === 'type' && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Expected Type
          </label>
          <select
            value={expectedType}
            onChange={(e) => setExpectedType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="url">Valid URL</option>
            <option value="email">Valid Email Address</option>
          </select>
        </div>
      )}

      {ruleType === 'range' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Min Value
            </label>
            <input
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Max Value
            </label>
            <input
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              placeholder="e.g. 60000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {ruleType === 'regex' && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Pattern (Regex)
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. ^https://.*"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {ruleType === 'forbidden_in_env' && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Forbidden Environment
          </label>
          <select
            value={forbiddenEnv}
            onChange={(e) => setForbiddenEnv(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="production">Production</option>
            <option value="testing">Testing</option>
            <option value="development">Development</option>
          </select>
        </div>
      )}

      {ruleType === 'not_equals' && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Forbidden Value
          </label>
          <input
            type="text"
            value={forbiddenValue}
            onChange={(e) => setForbiddenValue(e.target.value)}
            placeholder="e.g. localhost, development, 127.0.0.1"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* Severity & Description */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Severity Level
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="error">Error (High Priority)</option>
            <option value="warning">Warning (Moderate)</option>
            <option value="info">Info (Advisory)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Rule Description <span className="text-slate-600">(Optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why this rule is enforced..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors focus:outline-none rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
        >
          {saving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Save Rule</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function ValidationRulesTab({ project }) {
  const toast = useToast();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getValidationRulesApi(project._id);
      if (res.success && res.data) {
        setRules(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load validation rules');
    } finally {
      setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleDelete = async (ruleId, key) => {
    if (!window.confirm(`Delete validation rule for "${key}"?`)) return;
    try {
      await deleteValidationRuleApi(project._id, ruleId);
      setRules((prev) => prev.filter((r) => r._id !== ruleId));
      toast.success(`Rule for "${key}" removed.`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete rule');
    }
  };

  const handleRuleCreated = (newRule) => {
    setRules((prev) => [newRule, ...prev]);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Config Validation Rules</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define programmatic guardrails to catch invalid formats, unsafe values, or missing variables during comparison.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-950/40 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Validation Rule</span>
        </button>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Loading validation rules...
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center max-w-md mx-auto">
          <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Validation Rules Configured</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Rules enforce constraints such as numeric ranges, required keys, or preventing debug flags in production.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Rule</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 font-mono text-[11px] text-slate-400">
                  <th className="py-3 px-4">Variable Key</th>
                  <th className="py-3 px-4">Rule Type</th>
                  <th className="py-3 px-4">Target Env</th>
                  <th className="py-3 px-4">Constraint Parameters</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {rules.map((rule) => {
                  let paramDisplay = '—';
                  if (rule.ruleType === 'type') {
                    paramDisplay = `Expected: ${rule.parameters?.expectedType}`;
                  } else if (rule.ruleType === 'range') {
                    paramDisplay = `Min: ${rule.parameters?.minValue ?? '—'}, Max: ${rule.parameters?.maxValue ?? '—'}`;
                  } else if (rule.ruleType === 'regex') {
                    paramDisplay = `/${rule.parameters?.pattern}/`;
                  } else if (rule.ruleType === 'forbidden_in_env') {
                    paramDisplay = `Forbidden in: ${rule.parameters?.forbiddenEnvironment}`;
                  } else if (rule.ruleType === 'not_equals') {
                    paramDisplay = `Must not equal: ${rule.parameters?.forbiddenValue}`;
                  }

                  return (
                    <tr key={rule._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {rule.key}
                        {rule.description && (
                          <div className="text-[10px] text-slate-500 font-sans font-normal mt-0.5">
                            {rule.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {rule.ruleType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 capitalize">
                        {rule.targetEnvironment}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        {paramDisplay}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            rule.severity === 'error'
                              ? 'error'
                              : rule.severity === 'warning'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="xs"
                        >
                          {rule.severity.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(rule._id, rule.key)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Validation Rule"
        size="md"
      >
        <AddRuleForm
          project={project}
          onSuccess={handleRuleCreated}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
