const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const DriftReport = require('../src/models/DriftReport');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User');
jest.mock('../src/models/Project');
jest.mock('../src/models/DriftReport');

describe('Drift Report Deletion Endpoints', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockProjectId = '609b1f77bcf86cd799439022';
  const mockReportId = '709b1f77bcf86cd799439033';
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

  it('should successfully delete an existing drift report for authorized project owner', async () => {
    Project.findById.mockResolvedValue({
      _id: mockProjectId,
      owner: mockUserId
    });
    DriftReport.findOneAndDelete.mockResolvedValue({
      _id: mockReportId,
      project: mockProjectId
    });

    const res = await request(app)
      .delete(`/api/projects/${mockProjectId}/reports/${mockReportId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted');
    expect(DriftReport.findOneAndDelete).toHaveBeenCalledWith({
      _id: mockReportId,
      project: mockProjectId
    });
  });

  it('should return 404 if report does not exist', async () => {
    Project.findById.mockResolvedValue({
      _id: mockProjectId,
      owner: mockUserId
    });
    DriftReport.findOneAndDelete.mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/projects/${mockProjectId}/reports/nonexistent`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
