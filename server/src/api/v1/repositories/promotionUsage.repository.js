// src/api/v1/repositories/promotionUsage.repository.js

const pool = require('../../../config/db');
const PromotionUsage = require('../../../models/promotionUsage.model');

/**
 * Ghi lại một lần sử dụng khuyến mãi.
 * Hàm này nên được chạy bên trong một giao dịch (transaction).
 * @param {object} usageData - Dữ liệu sử dụng.
 * @param {object} client - Đối tượng client của pg để thực hiện giao dịch.
 * @returns {Promise<PromotionUsage>}
 */
const create = async (usageData, client) => {
    const {
        promotion_id, user_id, booking_id, discount_amount,
        original_amount, final_amount, ip_address, user_agent
    } = usageData;

    const query = `
        INSERT INTO promotion_usage (
            promotion_id, user_id, booking_id, discount_amount,
            original_amount, final_amount, ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;
    const values = [
        promotion_id, user_id, booking_id, discount_amount,
        original_amount, final_amount, ip_address, user_agent
    ];
    
    // Sử dụng client đã được cung cấp để đảm bảo nó là một phần của transaction
    const result = await client.query(query, values);
    return new PromotionUsage(result.rows[0]);
};

/**
 * Lấy lịch sử sử dụng của một mã khuyến mãi.
 * @param {string} promotionId - ID của khuyến mãi.
 * @returns {Promise<PromotionUsage[]>}
 */
const findByPromotionId = async (promotionId) => {
    const query = 'SELECT * FROM promotion_usage WHERE promotion_id = $1 ORDER BY used_at DESC';
    const result = await pool.query(query, [promotionId]);
    return result.rows.map(row => new PromotionUsage(row));
};
const incrementUsageCount = async (promotionId, client) => {
    const query = `
        UPDATE promotions
        SET used_count = used_count + 1
        WHERE promotion_id = $1;
    `;
    await client.query(query, [promotionId]);
};
module.exports = {
    create,
    findByPromotionId,
    incrementUsageCount
};