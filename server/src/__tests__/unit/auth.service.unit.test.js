// src/__tests__/unit/auth.service.unit.test.js

const authService = require('../../api/v1/services/auth.service');
const userRepository = require('../../api/v1/repositories/user.repository');
const bcrypt = require('bcrypt');
const { generateToken } = require('../../utils/jwt');

// Sửa lại cách mock: Cung cấp một factory function để trả về các hàm cần mock
jest.mock('../../api/v1/repositories/user.repository', () => ({
  findByEmailOrUsername: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
}));

jest.mock('bcrypt');
jest.mock('../../utils/jwt');

describe('Auth Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ... (Phần test cho registerUser và loginUser giữ nguyên)
  describe('registerUser', () => {
    const userData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      fullName: 'New User',
    };

    it('should create and return a new user if email and username are not taken', async () => {
      userRepository.findByEmailOrUsername.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('somesalt');
      bcrypt.hash.mockResolvedValue('hashedpassword');
      const mockNewUser = { ...userData, userId: 'new-uuid', roleId: 3 };
      userRepository.create.mockResolvedValue(mockNewUser);

      const result = await authService.registerUser(userData);

      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        passwordHash: 'hashedpassword',
        roleId: 3
      }));
      expect(result).toEqual(mockNewUser);
    });

    it('should throw an error if the username or email is already taken', async () => {
      userRepository.findByEmailOrUsername.mockResolvedValue({ userId: 'existing-uuid' });
      await expect(authService.registerUser(userData))
            .rejects.toThrow('Username or email already exists');
    });
  });

  describe('loginUser', () => {
    it('should return a token for valid credentials', async () => {
      const mockUser = {
        userId: 'some-uuid',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        roleId: 3,
        toJSON: () => ({ userId: 'some-uuid', email: 'test@example.com' }),
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue('mocked-jwt-token');

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(result).toHaveProperty('token', 'mocked-jwt-token');
    });
  });
});
