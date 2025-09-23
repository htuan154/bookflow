// src/api/v1/repositories/promotionDetail.repository.js

const pool = require('../../../config/db');
const PromotionDetail = require('../../../models/promotionDetail.model');

/**
 * Tạo một hoặc nhiều chi tiết khuyến mãi trong một giao dịch.
 * @param {string} promotionId - ID của chương trình khuyến mãi cha.
 * @param {Array<object>} detailsData - Mảng các đối tượng chi tiết.
 * @param {object} client - Đối tượng client của pg từ transaction.
 * @returns {Promise<PromotionDetail[]>}
 */
const createMany = async (promotionId, detailsData, client) => {
    const createdDetails = [];
    for (const detail of detailsData) {
        const { room_type_id, discount_type, discount_value } = detail;
        const query = `
            INSERT INTO promotion_details (promotion_id, room_type_id, discount_type, discount_value)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [promotionId, room_type_id, discount_type, discount_value];
        const result = await client.query(query, values);
        createdDetails.push(new PromotionDetail(result.rows[0]));
    }
    return createdDetails;
};

/**
 * Lấy tất cả các chi tiết của một chương trình khuyến mãi.
 * @param {string} promotionId - ID của khuyến mãi.
 * @returns {Promise<PromotionDetail[]>}
 */
const findByPromotionId = async (promotionId) => {
    const query = 'SELECT * FROM promotion_details WHERE promotion_id = $1';
    const result = await pool.query(query, [promotionId]);
    return result.rows.map(row => new PromotionDetail(row));
};

/**
 * Xóa tất cả các chi tiết của một chương trình khuyến mãi.
 * @param {string} promotionId - ID của khuyến mãi.
 * @param {object} client - Đối tượng client của pg từ transaction.
 * @returns {Promise<void>}
 */
const deleteByPromotionId = async (promotionId, client) => {
    const query = 'DELETE FROM promotion_details WHERE promotion_id = $1';
    await client.query(query, [promotionId]);
};

/**
 * Lấy chi tiết khuyến mãi theo ID
 * @param {string} detailId - ID của chi tiết.
 * @returns {Promise<PromotionDetail|null>}
 */
const findById = async (detailId) => {
    const query = 'SELECT * FROM promotion_details WHERE detail_id = $1';
    const result = await pool.query(query, [detailId]);
    return result.rows.length > 0 ? new PromotionDetail(result.rows[0]) : null;
};

/**
 * Cập nhật chi tiết khuyến mãi
 * @param {string} detailId - ID của chi tiết.
 * @param {object} updateData - Dữ liệu cập nhật.
 * @returns {Promise<PromotionDetail>}
 */
const update = async (detailId, updateData) => {
    const { discount_type, discount_value } = updateData;
    const query = `
        UPDATE promotion_details 
        SET discount_type = $2, discount_value = $3
        WHERE detail_id = $1
        RETURNING *;
    `;
    const values = [detailId, discount_type, discount_value];
    const result = await pool.query(query, values);
    return new PromotionDetail(result.rows[0]);
};

/**
 * Cập nhật nhiều chi tiết khuyến mãi (bulk update)
 * @param {Array<object>} detailsData - Mảng các đối tượng cần cập nhật.
 * @returns {Promise<PromotionDetail[]>}
 */
const updateMany = async (detailsData) => {
    const updatedDetails = [];
    
    for (const detail of detailsData) {
        const { detailId, discount_type, discount_value } = detail;
        const query = `
            UPDATE promotion_details 
            SET discount_type = $2, discount_value = $3
            WHERE detail_id = $1
            RETURNING *;
        `;
        const values = [detailId, discount_type, discount_value];
        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
            updatedDetails.push(new PromotionDetail(result.rows[0]));
        }
    }
    
    return updatedDetails;
};

/**
 * Xóa chi tiết khuyến mãi theo ID
 * @param {string} detailId - ID của chi tiết.
 * @returns {Promise<void>}
 */
const deleteById = async (detailId) => {
    const query = 'DELETE FROM promotion_details WHERE detail_id = $1';
    await pool.query(query, [detailId]);
};

module.exports = {
    createMany,
    findByPromotionId,
    deleteByPromotionId,
    findById,
    update,
    updateMany,
    delete: deleteById,
};



