// src/api/v1/repositories/foodRecommendation.repository.js

const pool = require('../../../config/db');
const FoodRecommendation = require('../../../models/foodRecommendation.model');

/**
 * Tạo một gợi ý món ăn mới.
 * @param {object} foodData - Dữ liệu của gợi ý.
 * @returns {Promise<FoodRecommendation>}
 */
const create = async (foodData) => {
    const { location_id, name, description, image_url, latitude, longitude } = foodData;
    const query = `
        INSERT INTO food_recommendations (location_id, name, description, image_url, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [location_id, name, description, image_url, latitude, longitude];
    const result = await pool.query(query, values);
    return new FoodRecommendation(result.rows[0]);
};

/**
 * Tìm tất cả các gợi ý món ăn của một địa điểm du lịch.
 * @param {string} locationId - ID của địa điểm du lịch.
 * @returns {Promise<FoodRecommendation[]>}
 */
const findByLocationId = async (locationId) => {
    const query = 'SELECT * FROM food_recommendations WHERE location_id = $1 ORDER BY name ASC';
    const result = await pool.query(query, [locationId]);
    return result.rows.map(row => new FoodRecommendation(row));
};

/**
 * Tìm một gợi ý món ăn bằng ID.
 * @param {string} foodId - UUID của gợi ý.
 * @returns {Promise<FoodRecommendation|null>}
 */
const findById = async (foodId) => {
    const result = await pool.query('SELECT * FROM food_recommendations WHERE food_id = $1', [foodId]);
    return result.rows[0] ? new FoodRecommendation(result.rows[0]) : null;
};

/**
 * Cập nhật một gợi ý món ăn.
 * @param {string} foodId - ID của gợi ý cần cập nhật.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<FoodRecommendation|null>}
 */
const update = async (foodId, updateData) => {
    const { name, description, image_url, latitude, longitude } = updateData;
    const query = `
        UPDATE food_recommendations
        SET name = $1, description = $2, image_url = $3, latitude = $4, longitude = $5
        WHERE food_id = $6
        RETURNING *;
    `;
    const values = [name, description, image_url, latitude, longitude, foodId];
    const result = await pool.query(query, values);
    return result.rows[0] ? new FoodRecommendation(result.rows[0]) : null;
};

/**
 * Xóa một gợi ý món ăn.
 * @param {string} foodId - ID của gợi ý cần xóa.
 * @returns {Promise<boolean>}
 */
const deleteById = async (foodId) => {
    const result = await pool.query('DELETE FROM food_recommendations WHERE food_id = $1', [foodId]);
    return result.rowCount > 0;
};

/**
 * Lấy tất cả gợi ý món ăn theo tên thành phố (join với tourist_locations).
 * @param {string} city - Tên thành phố.
 * @returns {Promise<FoodRecommendation[]>}
 */
const findByCity = async (city) => {
    const query = `
        SELECT f.* FROM food_recommendations f
        JOIN tourist_locations t ON f.location_id = t.location_id
        WHERE t.city = $1
        ORDER BY f.name ASC
    `;
    const result = await pool.query(query, [city]);
    return result.rows.map(row => new FoodRecommendation(row));
};

module.exports = {
    create,
    findByLocationId,
    findById,
    findByCity,
    update,
    deleteById,
};