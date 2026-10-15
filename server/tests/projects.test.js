const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User');
jest.mock('../src/models/Project');

describe('Project Endpoints', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
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

  describe('GET /api/projects', () => {
    it('should return list of user projects', async () => {
      Project.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { _id: 'p1', name: 'Billing Service', owner: mockUserId },
          { _id: 'p2', name: 'Auth Gateway', owner: mockUserId }
        ])
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].name).toBe('Billing Service');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a project with valid name', async () => {
      Project.create.mockResolvedValue({
        _id: 'p1',
        name: 'Notification Service',
        description: 'Handles SMS and Email notifications',
        owner: mockUserId
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Notification Service',
          description: 'Handles SMS and Email notifications'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Notification Service');
    });

    it('should require project name', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Missing name' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should prevent non-owner from deleting project', async () => {
      Project.findById.mockResolvedValue({
        _id: 'p1',
        name: 'Secret Service',
        owner: 'another_user_id'
      });

      const res = await request(app)
        .delete('/api/projects/p1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow owner to delete project', async () => {
      Project.findById.mockResolvedValue({
        _id: 'p1',
        name: 'My Service',
        owner: mockUserId
      });
      Project.findByIdAndDelete.mockResolvedValue({});

      const res = await request(app)
        .delete('/api/projects/p1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
