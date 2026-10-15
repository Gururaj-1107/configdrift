const {
  compareSnapshots,
  evaluateRule,
  STATUS,
  SEVERITY,
  normalizeValue
} = require('../src/services/comparisonEngine');

describe('Deterministic Comparison Engine (Unit)', () => {
  describe('normalizeValue', () => {
    it('should normalize number strings correctly', () => {
      expect(normalizeValue('5000', 'number')).toBe('5000');
      expect(normalizeValue('  42.500 ', 'number')).toBe('42.5');
    });

    it('should normalize booleans to lowercase', () => {
      expect(normalizeValue('TRUE', 'boolean')).toBe('true');
      expect(normalizeValue('False', 'boolean')).toBe('false');
    });

    it('should trim strings', () => {
      expect(normalizeValue('  hello world  ', 'string')).toBe('hello world');
    });

    it('should handle null/undefined gracefully', () => {
      expect(normalizeValue(null, 'string')).toBe('');
      expect(normalizeValue(undefined, 'string')).toBe('');
    });
  });

  describe('compareSnapshots', () => {
    const baseSnapshot = {
      _id: 'base123',
      environment: 'development',
      variables: [
        { key: 'PORT', value: '3000', dataType: 'number', isSecret: false },
        { key: 'API_KEY', value: 'secret_dev_key', dataType: 'string', isSecret: true },
        { key: 'DEBUG', value: 'true', dataType: 'boolean', isSecret: false },
        { key: 'DEV_ONLY_FLAG', value: 'enabled', dataType: 'string', isSecret: false }
      ]
    };

    const targetSnapshot = {
      _id: 'target456',
      environment: 'production',
      variables: [
        { key: 'PORT', value: '8080', dataType: 'number', isSecret: false }, // VALUE_MISMATCH
        { key: 'API_KEY', value: 'secret_dev_key', dataType: 'string', isSecret: true }, // MATCH
        { key: 'DEBUG', value: 'true', dataType: 'string', isSecret: false }, // TYPE_MISMATCH
        { key: 'PROD_METRICS', value: 'datadog', dataType: 'string', isSecret: false } // EXTRA_IN_TARGET
        // DEV_ONLY_FLAG is MISSING_IN_TARGET
      ]
    };

    it('should accurately detect MATCH, VALUE_MISMATCH, TYPE_MISMATCH, MISSING, and EXTRA', () => {
      const result = compareSnapshots(baseSnapshot, targetSnapshot, []);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('findings');

      const { summary, findings } = result;

      expect(summary.totalKeys).toBe(5);
      expect(summary.matchedKeys).toBe(1); // API_KEY
      expect(summary.differingKeys).toBe(2); // PORT (value) + DEBUG (type)
      expect(summary.typeMismatches).toBe(1); // DEBUG
      expect(summary.missingKeys).toBe(1); // DEV_ONLY_FLAG
      expect(summary.extraKeys).toBe(1); // PROD_METRICS

      // Check DEV_ONLY_FLAG
      const missingFinding = findings.find((f) => f.key === 'DEV_ONLY_FLAG');
      expect(missingFinding).toBeDefined();
      expect(missingFinding.status).toBe(STATUS.MISSING_IN_TARGET);
      expect(missingFinding.severity).toBe(SEVERITY.ERROR);

      // Check PORT
      const portFinding = findings.find((f) => f.key === 'PORT');
      expect(portFinding).toBeDefined();
      expect(portFinding.status).toBe(STATUS.VALUE_MISMATCH);
      expect(portFinding.baseValue).toBe('3000');
      expect(portFinding.targetValue).toBe('8080');

      // Check DEBUG
      const debugFinding = findings.find((f) => f.key === 'DEBUG');
      expect(debugFinding).toBeDefined();
      expect(debugFinding.status).toBe(STATUS.TYPE_MISMATCH);

      // Check API_KEY
      const apiKeyFinding = findings.find((f) => f.key === 'API_KEY');
      expect(apiKeyFinding).toBeDefined();
      expect(apiKeyFinding.status).toBe(STATUS.MATCH);
      expect(apiKeyFinding.isSecret).toBe(true);

      // Check PROD_METRICS
      const prodMetricsFinding = findings.find((f) => f.key === 'PROD_METRICS');
      expect(prodMetricsFinding).toBeDefined();
      expect(prodMetricsFinding.status).toBe(STATUS.EXTRA_IN_TARGET);
    });

    it('should evaluate custom validation rules and elevate severity', () => {
      const rules = [
        {
          key: 'PORT',
          ruleType: 'range',
          targetEnvironment: 'all',
          parameters: { minValue: 80, maxValue: 5000 },
          severity: 'error',
          description: 'Port must be between 80 and 5000'
        },
        {
          key: 'DEBUG',
          ruleType: 'forbidden_in_env',
          targetEnvironment: 'production',
          parameters: { forbiddenEnvironment: 'production' },
          severity: 'error',
          description: 'Debug flag forbidden in prod'
        }
      ];

      const result = compareSnapshots(baseSnapshot, targetSnapshot, rules);

      // PORT in target is 8080 > 5000 -> rule violation
      const portFinding = result.findings.find((f) => f.key === 'PORT');
      expect(portFinding.ruleMessages.length).toBeGreaterThan(0);
      expect(portFinding.ruleMessages[0]).toContain('exceeds maximum');

      // DEBUG in target is production -> rule violation
      const debugFinding = result.findings.find((f) => f.key === 'DEBUG');
      expect(debugFinding.ruleMessages.length).toBeGreaterThan(0);
      expect(debugFinding.ruleMessages.some((m) => m.includes('forbidden in the'))).toBe(true);
    });
  });

  describe('evaluateRule', () => {
    it('should check required rules', () => {
      const rule = { ruleType: 'required', key: 'DB_URL', severity: 'error' };
      expect(evaluateRule(rule, '', 'development')).not.toBeNull();
      expect(evaluateRule(rule, 'postgres://localhost', 'development')).toBeNull();
    });

    it('should check range rules', () => {
      const rule = {
        ruleType: 'range',
        key: 'TIMEOUT',
        parameters: { minValue: 100, maxValue: 1000 }
      };
      expect(evaluateRule(rule, '50', 'test')).toEqual({
        message: "Key 'TIMEOUT' value 50 is below minimum 100."
      });
      expect(evaluateRule(rule, '500', 'test')).toBeNull();
      expect(evaluateRule(rule, '2000', 'test')).toEqual({
        message: "Key 'TIMEOUT' value 2000 exceeds maximum 1000."
      });
    });

    it('should check regex rules', () => {
      const rule = {
        ruleType: 'regex',
        key: 'EMAIL',
        parameters: { pattern: '^.+@.+\\..+$' }
      };
      expect(evaluateRule(rule, 'invalid_email', 'dev')).not.toBeNull();
      expect(evaluateRule(rule, 'dev@company.com', 'dev')).toBeNull();
    });

    it('should check not_equals rules', () => {
      const rule = {
        ruleType: 'not_equals',
        key: 'NODE_ENV',
        parameters: { forbiddenValue: 'development' }
      };
      expect(evaluateRule(rule, 'development', 'production')).not.toBeNull();
      expect(evaluateRule(rule, 'production', 'production')).toBeNull();
    });
  });
});
