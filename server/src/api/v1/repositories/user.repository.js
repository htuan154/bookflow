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
 * Tìm một user chỉ bằng username.
 * @param {string} username
 * @returns {Promise<User|null>} - Trả về một instance của User hoặc null.
 */
const findByUsername = async (username) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
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
  const {
    username,
    email,
    passwordHash,
    fullName,
    roleId,
    phoneNumber,
    address
  } = userData;

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, full_name, role_id, phone_number, address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [username, email, passwordHash, fullName, roleId, phoneNumber, address]
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

/**
 * Lấy danh sách người dùng, có thể lọc theo vai trò (roleId).
 * @param {object} [filters={}] - Đối tượng chứa các bộ lọc.
 * @param {number} [filters.roleId] - Lọc người dùng theo role_id.
 * @returns {Promise<User[]>} - Trả về một mảng các instance của User.
 */
const findAll = async (filters = {}) => {
  let query = 'SELECT user_id, username, email, full_name, role_id, created_at, phone_number, address FROM users';
  const queryParams = [];
  
  // Kiểm tra nếu có bộ lọc roleId được cung cấp
  if (filters.roleId) {
    query += ' WHERE role_id = $1';
    queryParams.push(filters.roleId);
  }
  
  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, queryParams);
  return result.rows.map(row => new User(row));
};
/**
 * Cập nhật thông tin người dùng.
 * @param {string} userId - ID của người dùng cần cập nhật.
 * @param {object} userData - Dữ liệu cần cập nhật (fullName, email, phoneNumber, address).
 * @returns {Promise<User|null>}
 */
const update = async (userId, userData) => {
    const { fullName, email, phoneNumber, address } = userData;

    const result = await pool.query(
        `UPDATE users 
         SET full_name = $1, 
             email = $2, 
             phone_number = $3, 
             address = $4
         WHERE user_id = $5
         RETURNING *`,
        [fullName, email, phoneNumber, address, userId]
    );

    if (result.rowCount === 0) return null;
    return new User(result.rows[0]);
};

/**
 * Xóa người dùng khỏi cơ sở dữ liệu.
 * @param {string} userId - ID của người dùng cần xóa.
 * @returns {Promise<boolean>} - Trả về true nếu xóa thành công.
 */
const remove = async (userId) => {
    const result = await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
    return result.rowCount > 0;
};

module.exports = {
  findByEmailOrUsername,
  findByEmail,
  findByUsername,
  create,
  findById,
  findAll,
  update,
  remove
};