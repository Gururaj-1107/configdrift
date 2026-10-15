/**
 * ConfigDrift — Deterministic Comparison Engine
 *
 * Accepts two or three environment snapshots and produces a structured
 * differential report. Zero AI dependencies — fully algorithmic.
 */

const { isSecret } = require('../utils/secretDetector');

/**
 * Status categories for comparison findings
 */
const STATUS = {
  MATCH:              'MATCH',
  VALUE_MISMATCH:     'VALUE_MISMATCH',
  TYPE_MISMATCH:      'TYPE_MISMATCH',
  MISSING_IN_TARGET:  'MISSING_IN_TARGET',
  EXTRA_IN_TARGET:    'EXTRA_IN_TARGET',
};

/**
 * Severity levels for findings
 */
const SEVERITY = {
  ERROR:   'ERROR',
  WARNING: 'WARNING',
  INFO:    'INFO',
};

/**
 * Assigns severity from comparison status
 */
const statusToSeverity = (status) => {
  switch (status) {
    case STATUS.MATCH:
      return SEVERITY.INFO;
    case STATUS.VALUE_MISMATCH:
      return SEVERITY.WARNING;
    case STATUS.TYPE_MISMATCH:
      return SEVERITY.WARNING;
    case STATUS.MISSING_IN_TARGET:
      return SEVERITY.ERROR;
    case STATUS.EXTRA_IN_TARGET:
      return SEVERITY.INFO;
    default:
      return SEVERITY.INFO;
  }
};

/**
 * Normalizes a value for comparison.
 * Converts numeric strings to canonical form, booleans to lowercase string.
 * @param {string} val
 * @param {string} dataType
 */
const normalizeValue = (val, dataType) => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();

  if (dataType === 'number') {
    const n = Number(str);
    return isNaN(n) ? str : String(n);
  }

  if (dataType === 'boolean') {
    return str.toLowerCase();
  }

  return str;
};

/**
 * Indexes a snapshot's variable array into a Map by key.
 * @param {Array} variables
 * @returns {Map<string, object>}
 */
const indexVariables = (variables = []) => {
  const map = new Map();
  for (const v of variables) {
    if (v.key) {
      map.set(v.key, v);
    }
  }
  return map;
};

/**
 * Core two-snapshot comparison function.
 *
 * @param {object} baseSnapshot  - Mongoose snapshot document
 * @param {object} targetSnapshot - Mongoose snapshot document
 * @param {Array}  rules          - Array of ValidationRule documents (optional)
 * @returns {object} comparison result
 */
const compareSnapshots = (baseSnapshot, targetSnapshot, rules = []) => {
  const baseVars = indexVariables(baseSnapshot.variables);
  const targetVars = indexVariables(targetSnapshot.variables);

  // Union of all keys across both snapshots
  const allKeys = new Set([...baseVars.keys(), ...targetVars.keys()]);

  const findings = [];
  const summary = {
    totalKeys:     allKeys.size,
    matchedKeys:   0,
    differingKeys: 0,
    missingKeys:   0,
    extraKeys:     0,
    typeMismatches: 0,
    ruleViolations: 0,
  };

  for (const key of allKeys) {
    const baseEntry   = baseVars.get(key) || null;
    const targetEntry = targetVars.get(key) || null;

    let status;
    let ruleMessages = [];

    // Determine status
    if (!targetEntry) {
      status = STATUS.MISSING_IN_TARGET;
      summary.missingKeys++;
    } else if (!baseEntry) {
      status = STATUS.EXTRA_IN_TARGET;
      summary.extraKeys++;
    } else {
      // Both have the key — compare values
      const baseNorm   = normalizeValue(baseEntry.value, baseEntry.dataType);
      const targetNorm = normalizeValue(targetEntry.value, targetEntry.dataType);

      if (baseNorm === targetNorm) {
        // Also check data types match
        if (baseEntry.dataType !== targetEntry.dataType) {
          status = STATUS.TYPE_MISMATCH;
          summary.typeMismatches++;
          summary.differingKeys++;
          ruleMessages.push(
            `Type mismatch: base is '${baseEntry.dataType}', target is '${targetEntry.dataType}'`
          );
        } else {
          status = STATUS.MATCH;
          summary.matchedKeys++;
        }
      } else {
        status = STATUS.VALUE_MISMATCH;
        summary.differingKeys++;
      }
    }

    // Run configured validation rules against this key
    const keyRules = rules.filter(
      (r) =>
        r.key === key &&
        (r.targetEnvironment === 'all' || r.targetEnvironment === targetSnapshot.environment)
    );

    for (const rule of keyRules) {
      const valueToValidate = targetEntry?.value ?? baseEntry?.value ?? '';
      const violation = evaluateRule(rule, valueToValidate, targetSnapshot.environment);

      if (violation) {
        ruleMessages.push(violation.message);
        summary.ruleViolations++;
        // Escalate severity if rule is higher
        if (rule.severity === 'error') {
          status = STATUS.VALUE_MISMATCH; // flag as problematic
        }
      }
    }

    const severity = statusToSeverity(status);

    // Determine secret detection
    const isSensitive =
      isSecret(key) ||
      (baseEntry?.isSecret ?? false) ||
      (targetEntry?.isSecret ?? false);

    findings.push({
      key,
      baseValue:   baseEntry?.value ?? null,
      targetValue: targetEntry?.value ?? null,
      baseType:    baseEntry?.dataType ?? null,
      targetType:  targetEntry?.dataType ?? null,
      status,
      severity,
      isSecret: isSensitive,
      ruleMessages,
    });
  }

  // Sort findings: ERRORS first → WARNINGS → MATCH (alphabetical within group)
  const SORT_ORDER = {
    [STATUS.MISSING_IN_TARGET]: 0,
    [STATUS.VALUE_MISMATCH]:    1,
    [STATUS.TYPE_MISMATCH]:     2,
    [STATUS.EXTRA_IN_TARGET]:   3,
    [STATUS.MATCH]:             4,
  };

  findings.sort((a, b) => {
    const orderDiff = (SORT_ORDER[a.status] ?? 99) - (SORT_ORDER[b.status] ?? 99);
    if (orderDiff !== 0) return orderDiff;
    return a.key.localeCompare(b.key);
  });

  return {
    baseSnapshot: {
      _id:         baseSnapshot._id,
      environment: baseSnapshot.environment,
      version:     baseSnapshot.version,
      label:       baseSnapshot.label,
      createdAt:   baseSnapshot.createdAt,
    },
    targetSnapshot: {
      _id:         targetSnapshot._id,
      environment: targetSnapshot.environment,
      version:     targetSnapshot.version,
      label:       targetSnapshot.label,
      createdAt:   targetSnapshot.createdAt,
    },
    summary,
    findings,
  };
};

/**
 * Evaluates a single validation rule against a value.
 * Returns null if the rule passes, or an object with a message if it fails.
 *
 * @param {object} rule - ValidationRule document
 * @param {string} value - raw value string
 * @param {string} environment - target environment name
 * @returns {{ message: string } | null}
 */
const evaluateRule = (rule, value, environment) => {
  const { ruleType, parameters = {}, key } = rule;

  switch (ruleType) {
    case 'required': {
      if (value === '' || value === null || value === undefined) {
        return { message: `Key '${key}' is required but is missing or empty.` };
      }
      break;
    }

    case 'type': {
      const { expectedType } = parameters;
      if (!expectedType) break;

      if (expectedType === 'number') {
        if (isNaN(Number(value)) || value === '') {
          return { message: `Key '${key}' must be a valid number. Received: '${value}'.` };
        }
      }
      if (expectedType === 'boolean') {
        if (value !== 'true' && value !== 'false') {
          return { message: `Key '${key}' must be 'true' or 'false'. Received: '${value}'.` };
        }
      }
      if (expectedType === 'url') {
        try {
          new URL(value);
        } catch {
          return { message: `Key '${key}' must be a valid URL. Received: '${value}'.` };
        }
      }
      if (expectedType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { message: `Key '${key}' must be a valid email address. Received: '${value}'.` };
        }
      }
      break;
    }

    case 'range': {
      const { minValue, maxValue } = parameters;
      const num = Number(value);
      if (isNaN(num)) {
        return { message: `Key '${key}' must be a numeric value for range validation.` };
      }
      if (minValue !== undefined && num < minValue) {
        return { message: `Key '${key}' value ${num} is below minimum ${minValue}.` };
      }
      if (maxValue !== undefined && num > maxValue) {
        return { message: `Key '${key}' value ${num} exceeds maximum ${maxValue}.` };
      }
      break;
    }

    case 'regex': {
      const { pattern } = parameters;
      if (!pattern) break;
      try {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return { message: `Key '${key}' value '${value}' does not match required pattern.` };
        }
      } catch {
        return { message: `Key '${key}' has an invalid regex pattern defined in its rule.` };
      }
      break;
    }

    case 'forbidden_in_env': {
      const { forbiddenEnvironment } = parameters;
      if (forbiddenEnvironment && environment === forbiddenEnvironment) {
        return {
          message: `Key '${key}' is forbidden in the '${forbiddenEnvironment}' environment.`
        };
      }
      break;
    }

    case 'not_equals': {
      const { forbiddenValue } = parameters;
      if (forbiddenValue !== undefined && value === String(forbiddenValue)) {
        return {
          message: `Key '${key}' must not equal '${forbiddenValue}' in the ${environment} environment.`
        };
      }
      break;
    }

    default:
      break;
  }

  return null;
};

module.exports = {
  compareSnapshots,
  evaluateRule,
  STATUS,
  SEVERITY,
  normalizeValue,
  indexVariables,
};
