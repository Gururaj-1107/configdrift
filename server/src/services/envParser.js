const { isSecret } = require('../utils/secretDetector');

/**
 * Infers appropriate data type from value string
 * @param {string} val
 * @returns {'string' | 'number' | 'boolean' | 'json'}
 */
const inferDataType = (val) => {
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'object' && val !== null) return 'json';

  const str = String(val).trim();

  // Boolean check
  if (str.toLowerCase() === 'true' || str.toLowerCase() === 'false') {
    return 'boolean';
  }

  // Number check (numeric string, not empty string, and isFinite)
  if (str !== '' && !isNaN(Number(str)) && !str.includes(' ')) {
    return 'number';
  }

  // JSON check
  if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
    try {
      JSON.parse(str);
      return 'json';
    } catch {
      // not valid json, treat as string
    }
  }

  return 'string';
};

/**
 * Parses a raw .env string into a structured array of variables
 * @param {string} rawEnv
 * @returns {Array<{ key: string, value: string, dataType: string, isSecret: boolean }>}
 */
const parseDotEnv = (rawEnv = '') => {
  if (!rawEnv || typeof rawEnv !== 'string') return [];

  const lines = rawEnv.split(/\r?\n/);
  const result = [];
  const seenKeys = new Set();

  for (let line of lines) {
    line = line.trim();

    // Ignore empty lines and full line comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Strip leading "export " if present
    if (line.startsWith('export ')) {
      line = line.substring(7).trim();
    }

    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      continue; // Skip malformed lines without '='
    }

    const key = line.substring(0, equalIndex).trim();
    let val = line.substring(equalIndex + 1).trim();

    if (!key) continue;

    // Handle quoted values
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.substring(1, val.length - 1);
    } else {
      // If unquoted, strip trailing inline comments
      const commentIndex = val.indexOf(' #');
      if (commentIndex !== -1) {
        val = val.substring(0, commentIndex).trim();
      }
    }

    const dataType = inferDataType(val);
    const secret = isSecret(key, val);

    // If key repeats, update latest or keep track
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({
        key,
        value: val,
        dataType,
        isSecret: secret
      });
    } else {
      const existing = result.find((item) => item.key === key);
      if (existing) {
        existing.value = val;
        existing.dataType = dataType;
        existing.isSecret = secret;
      }
    }
  }

  return result;
};

/**
 * Parses raw JSON string or object into a structured array of variables
 * @param {string | object} rawJson
 * @returns {Array<{ key: string, value: string, dataType: string, isSecret: boolean }>}
 */
const parseJsonEnv = (rawJson) => {
  let parsed;
  if (typeof rawJson === 'string') {
    try {
      parsed = JSON.parse(rawJson);
    } catch (err) {
      throw new Error(`Invalid JSON format: ${err.message}`);
    }
  } else if (typeof rawJson === 'object' && rawJson !== null) {
    parsed = rawJson;
  } else {
    return [];
  }

  if (Array.isArray(parsed)) {
    // If user provided array of key-value objects
    return parsed.map((item) => {
      const key = String(item.key || '').trim();
      const value = item.value !== undefined ? String(item.value) : '';
      const dataType = item.dataType || inferDataType(value);
      return {
        key,
        value,
        dataType,
        isSecret: item.isSecret !== undefined ? Boolean(item.isSecret) : isSecret(key, value)
      };
    }).filter((item) => item.key !== '');
  }

  const result = [];
  for (const [key, rawVal] of Object.entries(parsed)) {
    const trimmedKey = String(key).trim();
    if (!trimmedKey) continue;

    let valStr;
    let dataType;

    if (rawVal === null || rawVal === undefined) {
      valStr = '';
      dataType = 'string';
    } else if (typeof rawVal === 'object') {
      valStr = JSON.stringify(rawVal);
      dataType = 'json';
    } else {
      valStr = String(rawVal);
      dataType = inferDataType(rawVal);
    }

    result.push({
      key: trimmedKey,
      value: valStr,
      dataType,
      isSecret: isSecret(trimmedKey, valStr)
    });
  }

  return result;
};

/**
 * Universal parser supporting format selection
 * @param {'dotenv' | 'json' | 'structured'} format
 * @param {string | Array} rawData
 * @returns {Array<{ key: string, value: string, dataType: string, isSecret: boolean }>}
 */
const parseConfig = (format = 'dotenv', rawData = '') => {
  if (format === 'json') {
    return parseJsonEnv(rawData);
  }

  if (format === 'structured' && Array.isArray(rawData)) {
    return rawData.map((item) => {
      const key = String(item.key || '').trim();
      const val = item.value !== undefined ? String(item.value) : '';
      return {
        key,
        value: val,
        dataType: item.dataType || inferDataType(val),
        isSecret: item.isSecret !== undefined ? Boolean(item.isSecret) : isSecret(key, val)
      };
    }).filter((item) => item.key !== '');
  }

  // Default: dotenv
  return parseDotEnv(rawData);
};

module.exports = {
  inferDataType,
  parseDotEnv,
  parseJsonEnv,
  parseConfig
};
