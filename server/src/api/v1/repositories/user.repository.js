// src/api/v1/repositories/user.repository.js
const pool = require('../../../config/db');
const User = require('../../../models/user.model');

/**
 * Tìm một user bằng email hoặc username.
 * @param {string} email
 * @param {string} username
 * @returns {Promise<User|null>} - Trả về một instance của User hoặc null.
 */
const findByEmailOrUsername = async (email, username) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );
  if (!result.rows[0]) {
    return null;
  }
  return new User(result.rows[0]);
};

/**
 * Tìm một user chỉ bằng email.
 * @param {string} email
 * @returns {Promise<User|null>} - Trả về một instance của User hoặc null.
 */
const findByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  if (!result.rows[0]) {
    return null;
  }
  return new User(result.rows[0]);
};

/**
 * Tạo một user mới trong database.
 * @param {object} userData - Dữ liệu của user mới.
 * @returns {Promise<User>} - Trả về instance của User vừa được tạo.
 */
const create = async (userData) => {
  const { username, email, passwordHash, fullName, roleId } = userData;
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, full_name, role_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`, // Lấy tất cả các cột để tạo model
    [username, email, passwordHash, fullName, roleId]
  );
  return new User(result.rows[0]);
};

/**
 * Bổ sung: Tìm một user bằng ID.
 * @param {string} userId - UUID của người dùng.
 * @returns {Promise<User|null>} - Trả về một instance của User hoặc null.
 */
const findById = async (userId) => {
  const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  if (!result.rows[0]) {
    return null;
  }
  return new User(result.rows[0]);
};

module.exports = {
  findByEmailOrUsername,
  findByEmail,
  create,
  findById,
};
