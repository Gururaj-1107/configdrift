const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Snapshot = require('../src/models/Snapshot');
const ValidationRule = require('../src/models/ValidationRule');
const DriftReport = require('../src/models/DriftReport');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User');
jest.mock('../src/models/Project');
jest.mock('../src/models/Snapshot');
jest.mock('../src/models/ValidationRule');
jest.mock('../src/models/DriftReport');

describe('Database Integrity: Project Cascade Deletion', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockProjectId = '609b1f77bcf86cd799439022';
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

  it('should cascade delete snapshots, rules, and reports when project is deleted', async () => {
    Project.findById.mockResolvedValue({
      _id: mockProjectId,
      name: 'E-Commerce Core',
      owner: mockUserId
    });
    Snapshot.deleteMany.mockResolvedValue({ deletedCount: 3 });
    ValidationRule.deleteMany.mockResolvedValue({ deletedCount: 4 });
    DriftReport.deleteMany.mockResolvedValue({ deletedCount: 2 });
    Project.findByIdAndDelete.mockResolvedValue({ _id: mockProjectId });

    const res = await request(app)
      .delete(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(Snapshot.deleteMany).toHaveBeenCalledWith({ project: mockProjectId });
    expect(ValidationRule.deleteMany).toHaveBeenCalledWith({ project: mockProjectId });
    expect(DriftReport.deleteMany).toHaveBeenCalledWith({ project: mockProjectId });
    expect(Project.findByIdAndDelete).toHaveBeenCalledWith(mockProjectId);
  });
});
