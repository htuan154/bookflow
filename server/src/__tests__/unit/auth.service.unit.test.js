// src/__tests__/unit/auth.service.unit.test.js

const authService = require('../../api/v1/services/auth.service');
const userRepository = require('../../api/v1/repositories/user.repository');
const bcrypt = require('bcrypt');
const { generateToken } = require('../../utils/jwt');

// Mock các dependencies
jest.mock('../../api/v1/repositories/user.repository', () => ({
  findByEmailOrUsername: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('bcrypt');
jest.mock('../../utils/jwt');

describe('Auth Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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
      const mockNewUser = { 
        ...userData, 
        userId: 'new-uuid', 
        roleId: 3,
        toJSON: () => ({ userId: 'new-uuid', email: 'new@example.com', username: 'newuser' })
      };
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
    const mockUser = {
      userId: 'some-uuid',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashedpassword',
      roleId: 3,
      toJSON: () => ({ userId: 'some-uuid', email: 'test@example.com', username: 'testuser' }),
    };

    it('should return a token for valid email credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue('mocked-jwt-token');

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toHaveProperty('token', 'mocked-jwt-token');
      expect(result).toHaveProperty('user');
    });

    it('should return a token for valid username credentials', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue('mocked-jwt-token');

      const result = await authService.loginUser('testuser', 'password123');

      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toHaveProperty('token', 'mocked-jwt-token');
      expect(result).toHaveProperty('user');
    });

    it('should throw an error for invalid email credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.loginUser('invalid@example.com', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw an error for invalid username credentials', async () => {
      userRepository.findByUsername.mockResolvedValue(null);

      await expect(authService.loginUser('invaliduser', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw an error for wrong password with email', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.loginUser('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw an error for wrong password with username', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.loginUser('testuser', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile for valid userId', async () => {
      const mockUser = {
        userId: 'some-uuid',
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        toJSON: () => ({ userId: 'some-uuid', email: 'test@example.com', username: 'testuser' }),
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.getUserProfile('some-uuid');

      expect(userRepository.findById).toHaveBeenCalledWith('some-uuid');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error for invalid userId', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(authService.getUserProfile('invalid-uuid'))
        .rejects.toThrow('User not found');
    });
  });
});