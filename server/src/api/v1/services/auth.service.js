// src/api/v1/services/auth.service.js
const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcrypt');
const { generateToken } = require('../../../utils/jwt');

const registerUser = async (userData) => {
  const { username, email, password, fullName } = userData;
  const existingUser = await userRepository.findByEmailOrUsername(email, username);
  if (existingUser) {
    throw new Error('Username or email already exists');
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const newUser = await userRepository.create({
    username,
    email,
    passwordHash,
    fullName,
    roleId: 3,
  });
  return newUser;
};

/**
 * Đăng nhập người dùng bằng email hoặc username
 * @param {string} identifier - Email hoặc username
 * @param {string} password - Mật khẩu
 * @returns {Promise<{user: object, token: string}>} - User info và token
 */
const loginUser = async (identifier, password) => {
  // Kiểm tra xem identifier có phải là email không (chứa @)
  const isEmail = identifier.includes('@');
  
  let user;
  if (isEmail) {
    // Nếu là email, tìm bằng email
    user = await userRepository.findByEmail(identifier);
  } else {
    // Nếu không phải email, tìm bằng username
    user = await userRepository.findByUsername(identifier);
  }
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatch) {
    throw new Error('Invalid credentials');
  }
  
  // Kiểm tra trạng thái isActive cho hotel_owner (roleId=2), hotel_staff (roleId=6), user (roleId=3)
  if (( user.roleId === 2 || user.roleId === 6 || user.roleId === 3) && user.isActive === false) {
    throw new Error('Tài khoản của bạn đã bị vô hiệu hóa');
  }
  
  const tokenPayload = {
    userId: user.userId,
    roleId: user.roleId,
  };
  const token = generateToken(tokenPayload);
  return { user: user.toJSON(), token };
};

/**
 * Lấy thông tin profile của người dùng.
 * @param {string} userId - ID của người dùng từ token.
 * @returns {Promise<User>} - Trả về đối tượng User.
 */
const getUserProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    // Lỗi này khó xảy ra nếu token hợp lệ, nhưng vẫn cần kiểm tra
    throw new Error('User not found');
  }
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};