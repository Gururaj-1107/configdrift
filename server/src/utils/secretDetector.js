/**
 * Deterministic detection of sensitive keys and credentials
 */
const SENSITIVE_KEY_PATTERNS = [
  /secret/i,
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /access[_-]?key/i,
  /cert/i,
  /signing[_-]?key/i,
  /client[_-]?secret/i,
  /webhook[_-]?secret/i,
  /db_pass/i,
  /database_pass/i
];

const SENSITIVE_VALUE_PATTERNS = [
  /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/, // JWT
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,                  // PEM Private Key
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/,                   // Mongo URI with password
  /postgres(ql)?:\/\/[^:]+:[^@]+@/,                     // Postgres URI with password
  /mysql:\/\/[^:]+:[^@]+@/                              // MySQL URI with password
];

/**
 * Checks if a key or value represents sensitive information
 * @param {string} key
 * @param {string} value
 * @returns {boolean}
 */
const isSecret = (key = '', value = '') => {
  const keyStr = String(key);
  const valStr = String(value);

  // Check key patterns
  for (const pattern of SENSITIVE_KEY_PATTERNS) {
    if (pattern.test(keyStr)) {
      return true;
    }
  }

  // Check value patterns
  for (const pattern of SENSITIVE_VALUE_PATTERNS) {
    if (pattern.test(valStr)) {
      return true;
    }
  }

  return false;
};

/**
 * Masks a sensitive value
 * @param {string} value
 * @returns {string}
 */
const maskSecret = (value = '') => {
  if (!value) return '';
  return '••••••••';
};

module.exports = {
  isSecret,
  maskSecret
};
