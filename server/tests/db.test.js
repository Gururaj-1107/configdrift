const mongoose = require('mongoose');
const { getDbStatus, disconnectDB, connectDB } = require('../src/config/db');

describe('Database Configuration & Connection Helpers', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe('getDbStatus()', () => {
    it('should return initial connection status object', () => {
      const status = getDbStatus();

      expect(status).toHaveProperty('stateCode');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('isConnected');
      expect(typeof status.isConnected).toBe('boolean');
    });

    it('should correctly format status names for readyState codes', () => {
      const status = getDbStatus();
      expect(['disconnected', 'connected', 'connecting', 'disconnecting']).toContain(status.status);
    });
  });

  describe('connectDB()', () => {
    it('should handle connection error gracefully and return null in dev/test environment', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('Connection refused mock'));

      const result = await connectDB('mongodb://mock-invalid-host:27017/test');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should return connection on successful connect', async () => {
      const mockConn = { connection: { host: 'localhost', name: 'configdrift' } };
      jest.spyOn(mongoose, 'connect').mockResolvedValueOnce(mockConn);

      const result = await connectDB('mongodb://localhost:27017/configdrift');
      expect(result).toBe(mockConn);
    });
  });

  describe('disconnectDB()', () => {
    it('should execute without throwing when called', async () => {
      await expect(disconnectDB()).resolves.not.toThrow();
    });
  });
});
