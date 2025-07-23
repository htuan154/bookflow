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


module.exports = {
    createMany,
    findByPromotionId,
    deleteByPromotionId,
};



