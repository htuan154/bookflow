// src/__tests__/integration/auth.integration.test.js
const request = require('supertest');
const app = require('../../../index'); 
const pool = require('../../config/db');

describe('Auth Endpoints - Integration Tests', () => {
  let userToken;

  beforeAll(async () => {
    // Tạo user test trước khi chạy test
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'logintest',
        email: 'logintest@example.com',
        password: 'password123',
        fullName: 'Login Test User',
      });
  });

  afterAll(async () => {
    // Xóa user test sau khi chạy xong
    await pool.query('DELETE FROM users WHERE email = $1', ['logintest@example.com']);
    await pool.end();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'integrationtestuser',
          email: 'integrationtest@example.com',
          password: 'password123',
          fullName: 'Integration Test User',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.data.user).toHaveProperty('email', 'integrationtest@example.com');
      expect(response.body.data.user).toHaveProperty('username', 'integrationtestuser');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return error for duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'anothertestuser',
          email: 'integrationtest@example.com',
          password: 'password123',
          fullName: 'Another Test User',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Username or email already exists');
    });

    afterAll(async () => {
      // Xóa user test sau khi chạy xong
      await pool.query('DELETE FROM users WHERE email = $1', ['integrationtest@example.com']);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in successfully with email and return a token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'logintest@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('token');
      userToken = response.body.data.token;
    });

    it('should log in successfully with username and return a token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'logintest',
          password: 'password123',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'logintest@example.com',
          password: 'wrongpassword',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with a valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('email', 'logintest@example.com');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return a success message for logout', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });
  });
});