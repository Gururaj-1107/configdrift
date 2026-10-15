const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Snapshot = require('../src/models/Snapshot');
const DriftReport = require('../src/models/DriftReport');
const ValidationRule = require('../src/models/ValidationRule');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User');
jest.mock('../src/models/Project');
jest.mock('../src/models/Snapshot');
jest.mock('../src/models/DriftReport');
jest.mock('../src/models/ValidationRule');

describe('Comparison, Drift Reports & Validation Rules Endpoints', () => {
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
    Project.findById.mockResolvedValue({
      _id: mockProjectId,
      name: 'Auth Service',
      owner: mockUserId
    });
  });

  describe('POST /api/projects/:projectId/compare', () => {
    it('should compare two snapshots and return comparison result', async () => {
      Snapshot.findOne
        .mockResolvedValueOnce({
          _id: 'snap1',
          environment: 'development',
          variables: [{ key: 'PORT', value: '3000', dataType: 'number', isSecret: false }]
        })
        .mockResolvedValueOnce({
          _id: 'snap2',
          environment: 'production',
          variables: [{ key: 'PORT', value: '8080', dataType: 'number', isSecret: false }]
        });

      ValidationRule.find.mockResolvedValue([]);

      const res = await request(app)
        .post(`/api/projects/${mockProjectId}/compare`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          baseSnapshotId: 'snap1',
          targetSnapshotId: 'snap2'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.differingKeys).toBe(1);
    });

    it('should reject if base and target snapshot are the same', async () => {
      const res = await request(app)
        .post(`/api/projects/${mockProjectId}/compare`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          baseSnapshotId: 'snap1',
          targetSnapshotId: 'snap1'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/projects/:projectId/reports & GET /reports', () => {
    it('should save a drift report', async () => {
      Snapshot.findOne
        .mockResolvedValueOnce({
          _id: 'snap1',
          environment: 'development',
          variables: [{ key: 'DB_HOST', value: 'localhost', dataType: 'string', isSecret: false }]
        })
        .mockResolvedValueOnce({
          _id: 'snap2',
          environment: 'production',
          variables: [{ key: 'DB_HOST', value: 'prod-db.aws', dataType: 'string', isSecret: false }]
        });

      ValidationRule.find.mockResolvedValue([]);

      DriftReport.create.mockResolvedValue({
        _id: 'report1',
        project: mockProjectId,
        baseEnvironment: 'development',
        targetEnvironment: 'production',
        summary: { totalKeys: 1, valueMismatches: 1 }
      });

      const res = await request(app)
        .post(`/api/projects/${mockProjectId}/reports`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          baseSnapshotId: 'snap1',
          targetSnapshotId: 'snap2'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe('report1');
    });

    it('should list drift reports for a project', async () => {
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([
              { _id: 'report1', baseEnvironment: 'development', targetEnvironment: 'production' }
            ])
          })
        })
      });

      DriftReport.find.mockReturnValue({ sort: mockSort });

      const res = await request(app)
        .get(`/api/projects/${mockProjectId}/reports`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /api/projects/:projectId/reports/:reportId/export', () => {
    it('should export drift report as CSV with masked secrets', async () => {
      const mockReport = {
        _id: 'report1',
        project: mockProjectId,
        baseEnvironment: 'development',
        targetEnvironment: 'production',
        findings: [
          {
            key: 'API_SECRET',
            baseValue: 'dev_secret_val',
            targetValue: 'prod_secret_val',
            status: 'VALUE_MISMATCH',
            severity: 'WARNING',
            isSecret: true,
            ruleMessages: []
          }
        ]
      };

      const populateChain = {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockReport)
          })
        })
      };

      DriftReport.findOne.mockReturnValue(populateChain);

      const res = await request(app)
        .get(`/api/projects/${mockProjectId}/reports/report1/export?format=csv`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('API_SECRET');
      expect(res.text).toContain('••••••••');
      expect(res.text).not.toContain('dev_secret_val');
    });
  });

  describe('Validation Rule CRUD Endpoints', () => {
    it('should create a validation rule', async () => {
      ValidationRule.create.mockResolvedValue({
        _id: 'rule1',
        project: mockProjectId,
        key: 'PORT',
        ruleType: 'range',
        parameters: { minValue: 1000, maxValue: 9000 },
        severity: 'error'
      });

      const res = await request(app)
        .post(`/api/projects/${mockProjectId}/rules`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'PORT',
          ruleType: 'range',
          parameters: { minValue: 1000, maxValue: 9000 },
          severity: 'error'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.key).toBe('PORT');
    });

    it('should reject invalid ruleType', async () => {
      const res = await request(app)
        .post(`/api/projects/${mockProjectId}/rules`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'PORT',
          ruleType: 'invalid_type_xyz'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
