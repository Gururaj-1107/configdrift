const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

// Mock User model to run tests independently of external MongoDB daemon
jest.mock('../src/models/User');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Jane Doe',
        email: 'jane@example.com',
        createdAt: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('jane@example.com');
    });

    it('should reject registration if email is already registered', async () => {
      User.findOne.mockResolvedValue({ _id: '123', email: 'jane@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject registration if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'jane@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user with valid password', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Jane Doe',
        email: 'jane@example.com',
        matchPassword: jest.fn().mockResolvedValue(true),
        createdAt: new Date().toISOString()
      };
      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('jane@example.com');
    });

    it('should reject login with invalid password', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Jane Doe',
        email: 'jane@example.com',
        matchPassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return profile with valid Bearer token', async () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      const token = jwt.sign(
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

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('jane@example.com');
    });
  });
});
