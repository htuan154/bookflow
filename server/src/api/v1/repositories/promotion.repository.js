// src/api/v1/repositories/promotion.repository.js

const pool = require('../../../config/db');
const Promotion = require('../../../models/promotion.model');

/**
 * Tạo một chương trình khuyến mãi mới (dynamic build giống update).
 * @param {object} promotionData - Dữ liệu của khuyến mãi.
 * @returns {Promise<Promotion>}
 */
const create = async (promotionData) => {
    const fields = Object.keys(promotionData);
    const values = Object.values(promotionData);

    const columns = fields.join(', ');
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');

    const query = `
        INSERT INTO promotions (${columns})
        VALUES (${placeholders})
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    return new Promotion(result.rows[0]);
};


/**
 * Tìm một khuyến mãi bằng ID.
 * @param {string} promotionId - UUID của khuyến mãi.
 * @returns {Promise<Promotion|null>}
 */
const findById = async (promotionId) => {
    const result = await pool.query('SELECT * FROM promotions WHERE promotion_id = $1', [promotionId]);
    return result.rows[0] ? new Promotion(result.rows[0]) : null;
};

/**
 * Tìm một khuyến mãi bằng mã code.
 * @param {string} code - Mã khuyến mãi.
 * @returns {Promise<Promotion|null>}
 */
const findByCode = async (code) => {
    const result = await pool.query('SELECT * FROM promotions WHERE code = $1', [code]);
    return result.rows[0] ? new Promotion(result.rows[0]) : null;
};

/**
 * Tìm tất cả các khuyến mãi (có thể lọc theo khách sạn).
 * @param {object} [filters={}] - Bộ lọc (ví dụ: { hotelId }).
 * @returns {Promise<Promotion[]>}
 */
const findAll = async (filters = {}) => {
    let query = 'SELECT * FROM promotions';
    const values = [];
    if (filters.hotelId) {
        query += ' WHERE hotel_id = $1';
        values.push(filters.hotelId);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows.map(row => new Promotion(row));
};

/**
 * Tìm tất cả các khuyến mãi với bộ lọc động theo status, code, ngày bắt đầu/kết thúc.
 * @param {object} filters - { status, code, startDate, endDate, hotelId }
 * @returns {Promise<Promotion[]>}
 */
const findAllAndFilter = async (filters = {}) => {
    let query = 'SELECT * FROM promotions';
    const conditions = [];
    const values = [];

    if (filters.status) {
        conditions.push(`status = $${values.length + 1}`);
        values.push(filters.status);
    }
    if (filters.code) {
        conditions.push(`code ILIKE $${values.length + 1}`);
        values.push(`%${filters.code}%`);
    }
    if (filters.startDate) {
        conditions.push(`valid_from >= $${values.length + 1}`);
        values.push(filters.startDate);
    }
    if (filters.endDate) {
        conditions.push(`valid_until <= $${values.length + 1}`);
        values.push(filters.endDate);
    }
    if (filters.hotelId) {
        conditions.push(`hotel_id = $${values.length + 1}`);
        values.push(filters.hotelId);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows.map(row => new Promotion(row));
};

/**
 * Cập nhật một khuyến mãi.
 * @param {string} promotionId - ID của khuyến mãi.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<Promotion|null>}
 */
const update = async (promotionId, updateData) => {
    // Dynamically build the update query
    const fields = Object.keys(updateData).map((key, index) => `${key} = $${index + 1}`);
    const values = Object.values(updateData);
    values.push(promotionId);

    const query = `
        UPDATE promotions SET ${fields.join(', ')}
        WHERE promotion_id = $${values.length}
        RETURNING *;
    `;
    const result = await pool.query(query, values);
    return result.rows[0] ? new Promotion(result.rows[0]) : null;
};

/**
 * Xóa một khuyến mãi.
 * @param {string} promotionId - ID của khuyến mãi.
 * @returns {Promise<boolean>}
 */
const deleteById = async (promotionId) => {
    const result = await pool.query('DELETE FROM promotions WHERE promotion_id = $1', [promotionId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    findById,
    findByCode,
    findAll,
    findAllAndFilter, // thêm hàm mới này
    update,
    deleteById,
};
