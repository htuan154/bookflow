// src/api/v1/repositories/hotel.repository.js
const pool = require('../../../config/db');
const Hotel = require('../../../models/hotel.model');

// --- CÁC HÀM CRUD CƠ BẢN ---

/**
 * Tạo mới một khách sạn
 * @param {Object} hotelData - Dữ liệu khách sạn
 * @param {string} ownerId - ID của chủ sở hữu
 * @returns {Promise<Hotel>}
 */
const create = async (hotelData, ownerId) => {
  const {
    name,
    description,
    address,
    city,
    starRating,
    phoneNumber,
    email,
    checkInTime,
    checkOutTime
  } = hotelData;

  // Đặt trạng thái mặc định là 'pending' cho khách sạn mới
  const status = 'pending';

  const query = `
    INSERT INTO hotels (
      owner_id, name, description, address, city, star_rating,
      phone_number, email, check_in_time, check_out_time, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) -- SỬA: Sử dụng $11 cho status
    RETURNING *;
  `;

  const values = [
    ownerId, name, description, address, city, starRating,
    phoneNumber, email, checkInTime, checkOutTime, status // SỬA: Thêm 'status' vào mảng values
  ];

  const result = await pool.query(query, values);
  return new Hotel(result.rows[0]);
};
/**
 * Tìm khách sạn theo ID
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<Hotel|null>}
 */
const findById = async (hotelId) => {
  const result = await pool.query('SELECT * FROM hotels WHERE hotel_id = $1', [hotelId]);
  if (!result.rows[0]) return null;
  return new Hotel(result.rows[0]);
};

/**
 * Tìm tất cả khách sạn với phân trang
 * @param {number} limit - Số lượng kết quả trên mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 * @returns {Promise<Array<Hotel>>}
 */
const findAll = async (limit = 10, offset = 0) => {
  const query = `
    SELECT * FROM hotels
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Cập nhật thông tin khách sạn
 * @param {string} hotelId - ID của khách sạn
 * @param {Object} hotelData - Dữ liệu cập nhật
 * @returns {Promise<Hotel|null>}
 */
const update = async (hotelId, hotelData) => {
  const { name, description, address, city, starRating, phoneNumber, email } = hotelData;
  const query = `
    UPDATE hotels
    SET name = $2, description = $3, address = $4, city = $5,
        star_rating = $6, phone_number = $7, email = $8
    WHERE hotel_id = $1
    RETURNING *;
  `;
  const values = [hotelId, name, description, address, city, starRating, phoneNumber, email];
  const result = await pool.query(query, values);
  if (!result.rows[0]) return null;
  return new Hotel(result.rows[0]);
};

/**
 * Xóa khách sạn (soft delete)
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<Hotel|null>}
 */
const softDelete = async (hotelId) => {
  const query = `
    UPDATE hotels
    SET status = 'rejected'
    WHERE hotel_id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [hotelId]);
  if (!result.rows[0]) return null;
  return new Hotel(result.rows[0]);
};

/**
 * Xóa khách sạn vĩnh viễn (hard delete)
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<boolean>}
 */
const hardDelete = async (hotelId) => {
  const query = 'DELETE FROM hotels WHERE hotel_id = $1';
  const result = await pool.query(query, [hotelId]);
  return result.rowCount > 0;
};

// --- CÁC HÀM MỚI CHO VIỆC XÉT DUYỆT ---

/**
 * Tìm các khách sạn theo một trạng thái cụ thể
 * @param {string} status - Trạng thái cần tìm (ví dụ: 'pending', 'approved', 'rejected')
 * @returns {Promise<Array<Hotel>>}
 */
const findByStatus = async (status) => {
  const query = 'SELECT * FROM hotels WHERE status = $1 ORDER BY created_at ASC';
  const result = await pool.query(query, [status]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Cập nhật trạng thái của một khách sạn
 * @param {string} hotelId - ID của khách sạn
 * @param {string} newStatus - Trạng thái mới ('approved', 'rejected', 'pending')
 * @returns {Promise<Hotel|null>}
 */
const updateStatus = async (hotelId, newStatus) => {
  const query = 'UPDATE hotels SET status = $1 WHERE hotel_id = $2 RETURNING *';
  const result = await pool.query(query, [newStatus, hotelId]);
  if (!result.rows[0]) return null;
  return new Hotel(result.rows[0]);
};

// --- CÁC HÀM TÌM KIẾM VÀ LỌC ---

/**
 * Tìm khách sạn theo chủ sở hữu
 * @param {string} ownerId - ID của chủ sở hữu
 * @returns {Promise<Array<Hotel>>}
 */
const findByOwner = async (ownerId) => {
  const query = 'SELECT * FROM hotels WHERE owner_id = $1 ORDER BY created_at DESC';
  const result = await pool.query(query, [ownerId]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Tìm khách sạn theo thành phố
 * @param {string} city - Tên thành phố
 * @returns {Promise<Array<Hotel>>}
 */
const findByCity = async (city) => {
  const query = 'SELECT * FROM hotels WHERE LOWER(city) = LOWER($1) AND status = \'approved\' ORDER BY star_rating DESC';
  const result = await pool.query(query, [city]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Tìm kiếm khách sạn theo tên
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @returns {Promise<Array<Hotel>>}
 */
const searchByName = async (searchTerm) => {
  const query = `
    SELECT * FROM hotels
    WHERE LOWER(name) LIKE LOWER($1) AND status = 'approved'
    ORDER BY name ASC
  `;
  const result = await pool.query(query, [`%${searchTerm}%`]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Tìm khách sạn theo rating
 * @param {number} minRating - Rating tối thiểu
 * @param {number} maxRating - Rating tối đa
 * @returns {Promise<Array<Hotel>>}
 */
const findByRating = async (minRating, maxRating) => {
  const query = `
    SELECT * FROM hotels
    WHERE star_rating >= $1 AND star_rating <= $2 AND status = 'approved'
    ORDER BY star_rating DESC
  `;
  const result = await pool.query(query, [minRating, maxRating]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Đếm tổng số khách sạn theo trạng thái
 * @param {string} status - Trạng thái cần đếm
 * @returns {Promise<number>}
 */
const countByStatus = async (status) => {
  const query = 'SELECT COUNT(*) as total FROM hotels WHERE status = $1';
  const result = await pool.query(query, [status]);
  return parseInt(result.rows[0].total);
};

/**
 * Tìm kiếm khách sạn với nhiều bộ lọc
 * @param {Object} filters - Các bộ lọc
 * @param {number} limit - Số lượng kết quả
 * @param {number} offset - Vị trí bắt đầu
 * @returns {Promise<Array<Hotel>>}
 */
const findWithFilters = async (filters = {}, limit = 10, offset = 0) => {
  let query = 'SELECT * FROM hotels WHERE 1=1';
  let values = [];
  let paramIndex = 1;

  // Thêm các điều kiện lọc
  if (filters.city) {
    query += ` AND LOWER(city) = LOWER($${paramIndex})`;
    values.push(filters.city);
    paramIndex++;
  }

  if (filters.status) {
    query += ` AND status = $${paramIndex}`;
    values.push(filters.status);
    paramIndex++;
  }

  if (filters.minRating) {
    query += ` AND star_rating >= $${paramIndex}`;
    values.push(filters.minRating);
    paramIndex++;
  }

  if (filters.maxRating) {
    query += ` AND star_rating <= $${paramIndex}`;
    values.push(filters.maxRating);
    paramIndex++;
  }

  if (filters.searchTerm) {
    query += ` AND (LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(description) LIKE LOWER($${paramIndex}))`;
    values.push(`%${filters.searchTerm}%`);
    paramIndex++;
  }

  // Thêm sắp xếp và phân trang
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Kiểm tra khách sạn có tồn tại hay không
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<boolean>}
 */
const exists = async (hotelId) => {
  const query = 'SELECT 1 FROM hotels WHERE hotel_id = $1';
  const result = await pool.query(query, [hotelId]);
  return result.rows.length > 0;
};

module.exports = {
  // CRUD cơ bản
  create,
  findById,
  findAll,
  update,
  softDelete,
  hardDelete,
  
  // Quản lý trạng thái
  findByStatus,
  updateStatus,
  
  // Tìm kiếm và lọc
  findByOwner,
  findByCity,
  searchByName,
  findByRating,
  findWithFilters,
  
  // Tiện ích
  countByStatus,
  exists
};
