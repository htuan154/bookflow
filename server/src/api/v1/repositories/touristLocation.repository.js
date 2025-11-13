// src/api/v1/repositories/touristLocation.repository.js

const pool = require('../../../config/db');
const TouristLocation = require('../../../models/touristLocation.model');

/**
 * Tạo một địa điểm du lịch mới.
 * @param {object} locationData - Dữ liệu của địa điểm.
 * @param {string} createdBy - ID của người tạo (Admin).
 * @returns {Promise<TouristLocation>}
 */
const create = async (locationData, createdBy) => {
    const { name, description, city, image_url, latitude, longitude } = locationData;
    const query = `
        INSERT INTO tourist_locations (name, description, city, image_url, latitude, longitude, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    const values = [name, description, city, image_url, latitude, longitude, createdBy];
    const result = await pool.query(query, values);
    return new TouristLocation(result.rows[0]);
};

/**
 * Tìm tất cả các địa điểm du lịch.
 * @returns {Promise<TouristLocation[]>}
 */
const findAll = async () => {
    const result = await pool.query('SELECT * FROM tourist_locations ORDER BY name ASC');
    return result.rows.map(row => new TouristLocation(row));
};

/**
 * Tìm một địa điểm du lịch bằng ID.
 * @param {string} locationId - UUID của địa điểm.
 * @returns {Promise<TouristLocation|null>}
 */
const findById = async (locationId) => {
    const result = await pool.query('SELECT * FROM tourist_locations WHERE location_id = $1', [locationId]);
    if (!result.rows[0]) {
        return null;
    }
    return new TouristLocation(result.rows[0]);
};

/**
 * Tìm các địa điểm du lịch theo thành phố.
 * @param {string} city - Tên thành phố.
 * @returns {Promise<TouristLocation[]>}
 */
const findByCity = async (city) => {
    const query = 'SELECT * FROM tourist_locations WHERE LOWER(city) = LOWER($1) ORDER BY name ASC';
    const result = await pool.query(query, [city]);
    return result.rows.map(row => new TouristLocation(row));
};

/**
 * Cập nhật một địa điểm du lịch.
 * @param {string} locationId - ID của địa điểm cần cập nhật.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<TouristLocation|null>}
 */
const update = async (locationId, updateData) => {
    const { name, description, city, image_url, latitude, longitude } = updateData;
    const query = `
        UPDATE tourist_locations
        SET name = $1, description = $2, city = $3, image_url = $4, latitude = $5, longitude = $6
        WHERE location_id = $7
        RETURNING *;
    `;
    const values = [name, description, city, image_url, latitude, longitude, locationId];
    const result = await pool.query(query, values);
    if (!result.rows[0]) {
        return null;
    }
    return new TouristLocation(result.rows[0]);
};

/**
 * Xóa một địa điểm du lịch.
 * @param {string} locationId - ID của địa điểm cần xóa.
 * @returns {Promise<boolean>}
 */
const deleteById = async (locationId) => {
    const result = await pool.query('DELETE FROM tourist_locations WHERE location_id = $1', [locationId]);
    return result.rowCount > 0;
};

/**
 * Tìm các địa điểm du lịch theo đúng tên thành phố (phân biệt hoa thường, hỗ trợ tiếng Việt).
 * @param {string} city - Tên thành phố.
 * @returns {Promise<TouristLocation[]>}
 */
const findByCityVn = async (city) => {
    const query = 'SELECT * FROM tourist_locations WHERE city = $1 ORDER BY name ASC';
    const result = await pool.query(query, [city]);
    return result.rows.map(row => new TouristLocation(row));
};

module.exports = {
    create,
    findAll,
    findById,
    findByCity,
    findByCityVn,
    update,
    deleteById,
};
