// src/__tests__/integration/auth.integration.test.js

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../../index');
const pool = require('../../config/db');

describe('Auth Endpoints - Integration Tests', () => {
  let userToken; // Biến để lưu token sau khi đăng nhập

  // Setup: Chạy trước tất cả các bài test trong file này
  beforeAll(async () => {
    // Dọn dẹp user cũ nếu có để đảm bảo môi trường test sạch
    await pool.query("DELETE FROM users WHERE email IN ('testuser@example.com', 'logintest@example.com')");

    // Tạo một user mẫu để dùng cho các bài test đăng nhập và profile
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4, $5)`,
      ['logintestuser', 'logintest@example.com', passwordHash, 'Login Test User', 3]
    );
  });

  // Teardown: Chạy sau khi tất cả các bài test đã hoàn thành
  afterAll(async () => {
    // Dọn dẹp toàn bộ dữ liệu test
    await pool.query("DELETE FROM users WHERE email IN ('testuser@example.com', 'logintest@example.com')");
    await pool.end(); // Đóng kết nối database
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.user).toHaveProperty('email', newUser.email);
    });

    it('should fail to register with an existing email', async () => {
      const existingUser = {
        username: 'anotheruser',
        email: 'logintest@example.com', // Dùng email đã được tạo trong beforeAll
        password: 'password123',
        fullName: 'Another User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(existingUser);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username or email already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in successfully and return a token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('token');
      userToken = response.body.data.token; // Lưu lại token để dùng cho các test sau
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with a valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${userToken}`); // Gửi token trong header

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('email', 'logintest@example.com');
    });

    it('should fail to get profile without a token', async () => {
      const response = await request(app).get('/api/v1/auth/profile');
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
