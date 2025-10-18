// src/api/v1/repositories/season.repository.js

const pool = require('../../../config/db');
const Season = require('../../../models/season.model');

/**
 * Tạo một mùa mới (ví dụ: 'Hè 2025', 'Tết Nguyên Đán').
 * @param {object} seasonData - Dữ liệu của mùa.
 * @returns {Promise<Season>}
 */
const create = async (seasonData) => {
    const { name, start_date, end_date, year, description } = seasonData;
    const query = `
        INSERT INTO seasons (name, start_date, end_date, year, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const result = await pool.query(query, [name, start_date, end_date, year, description]);
    return new Season(result.rows[0]);
};

/**
 * Tìm tất cả các mùa.
 * @returns {Promise<Season[]>}
 */
const findAll = async () => {
    const result = await pool.query('SELECT * FROM seasons ORDER BY start_date DESC');
    return result.rows.map(row => new Season(row));
};

/**
 * Tìm tất cả các mùa theo năm.
 * @param {number} year - Năm cần lấy các mùa.
 * @returns {Promise<Season[]>}
 */
const findByYear = async (year) => {
    const result = await pool.query('SELECT * FROM seasons WHERE year = $1 ORDER BY start_date ASC', [year]);
    return result.rows.map(row => new Season(row));
};

/**
 * Tìm một mùa bằng ID.
 * @param {number} seasonId - ID của mùa.
 * @returns {Promise<Season|null>}
 */
const findById = async (seasonId) => {
    const result = await pool.query('SELECT * FROM seasons WHERE season_id = $1', [seasonId]);
    if (!result.rows[0]) {
        return null;
    }
    return new Season(result.rows[0]);
};

/**
 * Kiểm tra xem có mùa nào bị trùng lặp khoảng thời gian không.
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD).
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD).
 * @param {number} [excludeSeasonId] - ID của mùa cần loại trừ (dùng khi cập nhật).
 * @returns {Promise<boolean>}
 */
const checkOverlap = async (startDate, endDate, excludeSeasonId = null) => {
    let query = `
        SELECT 1 FROM seasons
        WHERE (start_date, end_date) OVERLAPS ($1, $2)
    `;
    const values = [startDate, endDate];

    if (excludeSeasonId) {
        query += ` AND season_id != $3`;
        values.push(excludeSeasonId);
    }

    const result = await pool.query(query, values);
    return result.rowCount > 0;
};

/**
 * Cập nhật một mùa.
 * @param {number} seasonId - ID của mùa cần cập nhật.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<Season|null>}
 */
const update = async (seasonId, updateData) => {
    const { name, start_date, end_date, year, description } = updateData;
    const query = `
        UPDATE seasons
        SET name = $1, start_date = $2, end_date = $3, year = $4, description = $5
        WHERE season_id = $6
        RETURNING *;
    `;
    const values = [name, start_date, end_date, year, description, seasonId];
    const result = await pool.query(query, values);
    if (!result.rows[0]) {
        return null;
    }
    return new Season(result.rows[0]);
};

/**
 * Xóa một mùa.
 * @param {number} seasonId - ID của mùa cần xóa.
 * @returns {Promise<boolean>}
 */
const deleteById = async (seasonId) => {
    const result = await pool.query('DELETE FROM seasons WHERE season_id = $1', [seasonId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    findAll,
    findByYear,
    findById,
    checkOverlap,
    update,
    deleteById,
};
