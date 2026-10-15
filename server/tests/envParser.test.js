const { parseDotEnv, parseJsonEnv, parseConfig, inferDataType } = require('../src/services/envParser');
const { isSecret, maskSecret } = require('../src/utils/secretDetector');

describe('Environment Parser Service', () => {
  describe('inferDataType', () => {
    it('should correctly infer boolean, number, json, and string', () => {
      expect(inferDataType('true')).toBe('boolean');
      expect(inferDataType('FALSE')).toBe('boolean');
      expect(inferDataType('5000')).toBe('number');
      expect(inferDataType('3.1415')).toBe('number');
      expect(inferDataType('{"key": "value"}')).toBe('json');
      expect(inferDataType('[1, 2, 3]')).toBe('json');
      expect(inferDataType('https://api.example.com')).toBe('string');
      expect(inferDataType('')).toBe('string');
    });
  });

  describe('isSecret and maskSecret', () => {
    it('should detect sensitive keys', () => {
      expect(isSecret('API_KEY')).toBe(true);
      expect(isSecret('DATABASE_PASSWORD')).toBe(true);
      expect(isSecret('JWT_SECRET')).toBe(true);
      expect(isSecret('STRIPE_PRIVATE_KEY')).toBe(true);
      expect(isSecret('PORT')).toBe(false);
      expect(isSecret('APP_NAME')).toBe(false);
    });

    it('should mask secrets', () => {
      expect(maskSecret('super_secret_123')).toBe('••••••••');
      expect(maskSecret('')).toBe('');
    });
  });

  describe('parseDotEnv', () => {
    it('should parse key-value lines and ignore comments and blank lines', () => {
      const raw = `
        # Server configuration
        PORT=5000
        NODE_ENV=production

        # Feature flags
        ENABLE_METRICS=true
        EMPTY_KEY=
        QUOTED_VAR="hello world"
        SINGLE_QUOTED='config value'
        export API_SECRET=xyz987654321 # inline comment
      `;

      const vars = parseDotEnv(raw);
      expect(vars).toHaveLength(7);

      const portVar = vars.find(v => v.key === 'PORT');
      expect(portVar).toBeDefined();
      expect(portVar.value).toBe('5000');
      expect(portVar.dataType).toBe('number');

      const flagVar = vars.find(v => v.key === 'ENABLE_METRICS');
      expect(flagVar.value).toBe('true');
      expect(flagVar.dataType).toBe('boolean');

      const emptyVar = vars.find(v => v.key === 'EMPTY_KEY');
      expect(emptyVar.value).toBe('');
      expect(emptyVar.dataType).toBe('string');

      const quotedVar = vars.find(v => v.key === 'QUOTED_VAR');
      expect(quotedVar.value).toBe('hello world');

      const secretVar = vars.find(v => v.key === 'API_SECRET');
      expect(secretVar.value).toBe('xyz987654321');
      expect(secretVar.isSecret).toBe(true);
    });
  });

  describe('parseJsonEnv', () => {
    it('should parse flat and nested JSON objects', () => {
      const json = JSON.stringify({
        PORT: 8080,
        DEBUG: false,
        DATABASE_URL: 'mongodb://localhost:27017',
        JWT_TOKEN: 'token_abc_123',
        COMPLEX_SETTINGS: { cacheTtl: 300 }
      });

      const vars = parseJsonEnv(json);
      expect(vars).toHaveLength(5);

      const port = vars.find(v => v.key === 'PORT');
      expect(port.value).toBe('8080');
      expect(port.dataType).toBe('number');

      const debug = vars.find(v => v.key === 'DEBUG');
      expect(debug.value).toBe('false');
      expect(debug.dataType).toBe('boolean');

      const jwt = vars.find(v => v.key === 'JWT_TOKEN');
      expect(jwt.isSecret).toBe(true);

      const complex = vars.find(v => v.key === 'COMPLEX_SETTINGS');
      expect(complex.dataType).toBe('json');
    });

    it('should throw an error on malformed JSON', () => {
      expect(() => parseJsonEnv('{ invalid: json')).toThrow('Invalid JSON format');
    });
  });
});
