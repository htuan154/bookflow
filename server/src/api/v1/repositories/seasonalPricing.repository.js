// src/api/v1/repositories/seasonalPricing.repository.js

const pool = require('../../../config/db');
const SeasonalPricing = require('../../../models/seasonalPricing.model');

/**
 * Tạo một quy tắc giá theo mùa mới.
 * @param {object} pricingData - Dữ liệu của quy tắc giá.
 * @returns {Promise<SeasonalPricing>}
 */
const create = async (pricingData) => {
    const { room_type_id, season_id, name, start_date, end_date, price_modifier } = pricingData;
    const query = `
        INSERT INTO seasonal_pricing (room_type_id, season_id, name, start_date, end_date, price_modifier)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [room_type_id, season_id, name, start_date, end_date, price_modifier];
    const result = await pool.query(query, values);
    return new SeasonalPricing(result.rows[0]);
};

/**
 * Tìm tất cả các quy tắc giá của một loại phòng.
 * @param {string} roomTypeId - ID của loại phòng.
 * @returns {Promise<SeasonalPricing[]>}
 */
const findByRoomTypeId = async (roomTypeId) => {
    const query = 'SELECT * FROM seasonal_pricing WHERE room_type_id = $1 ORDER BY start_date ASC';
    const result = await pool.query(query, [roomTypeId]);
    return result.rows.map(row => new SeasonalPricing(row));
};

/**
 * Tìm một quy tắc giá bằng ID.
 * @param {string} pricingId - UUID của quy tắc giá.
 * @returns {Promise<SeasonalPricing|null>}
 */
const findById = async (pricingId) => {
    const result = await pool.query('SELECT * FROM seasonal_pricing WHERE pricing_id = $1', [pricingId]);
    if (!result.rows[0]) {
        return null;
    }
    return new SeasonalPricing(result.rows[0]);
};

/**
 * Cập nhật một quy tắc giá.
 * @param {string} pricingId - ID của quy tắc giá cần cập nhật.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<SeasonalPricing|null>}
 */
const update = async (pricingId, updateData) => {
    const { name, start_date, end_date, price_modifier } = updateData;
    const query = `
        UPDATE seasonal_pricing
        SET name = $1, start_date = $2, end_date = $3, price_modifier = $4
        WHERE pricing_id = $5
        RETURNING *;
    `;
    const values = [name, start_date, end_date, price_modifier, pricingId];
    const result = await pool.query(query, values);
    if (!result.rows[0]) {
        return null;
    }
    return new SeasonalPricing(result.rows[0]);
};

/**
 * Xóa một quy tắc giá.
 * @param {string} pricingId - ID của quy tắc giá cần xóa.
 * @returns {Promise<boolean>}
 */
const deleteById = async (pricingId) => {
    const result = await pool.query('DELETE FROM seasonal_pricing WHERE pricing_id = $1', [pricingId]);
    return result.rowCount > 0;
};

/**
 * Kiểm tra xem room_type_id đã có seasonal_pricing với season_id nào chưa.
 * @param {string} roomTypeId - ID của loại phòng.
 * @param {number[]} seasonIds - Mảng các season_id cần kiểm tra.
 * @returns {Promise<number[]>} - Trả về mảng các season_id đã tồn tại.
 */
const findExistingSeasonIds = async (roomTypeId, seasonIds) => {
    const query = `
        SELECT DISTINCT season_id 
        FROM seasonal_pricing 
        WHERE room_type_id = $1 AND season_id = ANY($2::int[])
    `;
    const result = await pool.query(query, [roomTypeId, seasonIds]);
    return result.rows.map(row => row.season_id);
};

/**
 * Tạo nhiều quy tắc giá cùng lúc (bulk insert).
 * @param {Array} pricingDataArray - Mảng các dữ liệu quy tắc giá.
 * @returns {Promise<SeasonalPricing[]>}
 */
const bulkCreate = async (pricingDataArray) => {
    if (!pricingDataArray || pricingDataArray.length === 0) {
        return [];
    }

    const values = [];
    const placeholders = [];
    
    pricingDataArray.forEach((data, index) => {
        const offset = index * 6;
        placeholders.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
        );
        values.push(
            data.room_type_id,
            data.season_id,
            data.name,
            data.start_date,
            data.end_date,
            data.price_modifier
        );
    });

    const query = `
        INSERT INTO seasonal_pricing (room_type_id, season_id, name, start_date, end_date, price_modifier)
        VALUES ${placeholders.join(', ')}
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows.map(row => new SeasonalPricing(row));
};

module.exports = {
    create,
    findByRoomTypeId,
    findById,
    update,
    deleteById,
    findExistingSeasonIds,
    bulkCreate,
};
