// src/api/v1/repositories/foodRecommendation.repository.js

const pool = require('../../../config/db');
const FoodRecommendation = require('../../../models/foodRecommendation.model');

/**
 * Tạo một gợi ý món ăn mới.
 * @param {object} foodData - Dữ liệu của gợi ý.
 * @returns {Promise<FoodRecommendation>}
 */
const create = async (foodData) => {
    const { location_id, name, description, image_url } = foodData;
    const query = `
        INSERT INTO food_recommendations (location_id, name, description, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [location_id, name, description, image_url];
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
    const { name, description, image_url } = updateData;
    const query = `
        UPDATE food_recommendations
        SET name = $1, description = $2, image_url = $3
        WHERE food_id = $4
        RETURNING *;
    `;
    const values = [name, description, image_url, foodId];
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

module.exports = {
    create,
    findByLocationId,
    findById,
    update,
    deleteById,
};