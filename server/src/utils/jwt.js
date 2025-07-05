// src/utils/jwt.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in your .env file');
}

/**
 * Tạo một JWT mới.
 * @param {object} payload - Dữ liệu muốn chứa trong token (ví dụ: { userId, roleId }).
 * @param {string} expiresIn - Thời gian hết hạn (ví dụ: '1d', '7h'). Mặc định là '1d'.
 * @returns {string} - Chuỗi token.
 */
const generateToken = (payload, expiresIn = '1d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Xác thực một JWT.
 * @param {string} token - Chuỗi token cần xác thực.
 * @returns {object | null} - Trả về payload đã giải mã nếu token hợp lệ, ngược lại trả về null.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Token không hợp lệ hoặc đã hết hạn
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};