const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Snapshot = require('../src/models/Snapshot');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User');
jest.mock('../src/models/Project');
jest.mock('../src/models/Snapshot');

describe('Snapshot Endpoints', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockProjectId = '607f1f77bcf86cd799439022';
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign(
      { id: mockUserId },
      process.env.JWT_SECRET || 'super_secret_jwt_key_for_development_configdrift'
    );
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: mockUserId,
        name: 'Jane Doe',
        email: 'jane@example.com'
      })
    });
  });

  describe('POST /api/projects/:projectId/snapshots', () => {
    it('should create snapshot v1 from .env input and detect secrets', async () => {
      Project.findById.mockResolvedValue({
        _id: mockProjectId,
        name: 'Billing Service',
        owner: mockUserId
      });

      Snapshot.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null) // no existing snapshot, so version 1
      });

      Snapshot.create.mockImplementation((doc) => {
        return Promise.resolve({
          _id: 'snap1',
          ...doc
        });
      });

      const res = await request(app)
        .post(`/api/projects/${mockProjectId}/snapshots`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          environment: 'development',
          format: 'dotenv',
          rawText: 'PORT=3000\nAPI_SECRET=super_secret_key_123',
          label: 'Initial dev config'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe(1);
      expect(res.body.data.environment).toBe('development');
      expect(res.body.data.variables).toHaveLength(2);

      const secretVar = res.body.data.variables.find(v => v.key === 'API_SECRET');
      expect(secretVar.isSecret).toBe(true);
    });

    it('should increment version if an existing snapshot exists', async () => {
      Project.findById.mockResolvedValue({
        _id: mockProjectId,
        name: 'Billing Service',
        owner: mockUserId
      });

      Snapshot.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({ version: 2 })
      });

      Snapshot.create.mockImplementation((doc) => {
        return Promise.resolve({
          _id: 'snap3',
          ...doc
        });
      });

      const res = await request(app)
        .post(`/api/projects/${mockProjectId}/snapshots`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          environment: 'production',
          format: 'json',
          rawText: JSON.stringify({ PORT: 8080 })
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.version).toBe(3);
    });

    it('should reject invalid environment', async () => {
      Project.findById.mockResolvedValue({
        _id: mockProjectId,
        name: 'Billing Service',
        owner: mockUserId
      });

      const res = await request(app)
        .post(`/api/projects/${mockProjectId}/snapshots`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          environment: 'staging', // invalid, should be testing
          rawText: 'PORT=3000'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:projectId/snapshots', () => {
    it('should return snapshots for project', async () => {
      Project.findById.mockResolvedValue({
        _id: mockProjectId,
        name: 'Billing Service',
        owner: mockUserId
      });

      Snapshot.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { _id: 'snap1', environment: 'development', version: 1 }
        ])
      });

      const res = await request(app)
        .get(`/api/projects/${mockProjectId}/snapshots`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });
  });
});
