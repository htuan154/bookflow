// src/api/v1/repositories/contract.repository.js

const pool = require('../../../config/db');
const Contract = require('../../../models/contract.model');

/**
 * Tạo một hợp đồng mới.
 * @param {object} contractData - Dữ liệu của hợp đồng.
 * @returns {Promise<Contract>} - Trả về instance của Contract vừa được tạo.
 */
const create = async (contractData) => {
    const {
        user_id, hotel_id, contract_number, contract_type, title, description,
        start_date, end_date, signed_date, contract_value, currency,
        payment_terms, status = 'draft', contract_file_url,
        terms_and_conditions, notes, created_by
    } = contractData;

    const query = `
        INSERT INTO contracts (
            user_id, hotel_id, contract_number, contract_type, title, description,
            start_date, end_date, signed_date, contract_value, currency,
            payment_terms, status, contract_file_url, terms_and_conditions, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *;
    `;
    const values = [
        user_id, hotel_id, contract_number, contract_type, title, description,
        start_date, end_date, signed_date, contract_value, currency,
        payment_terms, status, contract_file_url, terms_and_conditions, notes, created_by
    ];

    const result = await pool.query(query, values);
    return new Contract(result.rows[0]);
};

/**
 * Tìm một hợp đồng bằng ID.
 * @param {string} contractId - UUID của hợp đồng.
 * @returns {Promise<Contract|null>}
 */
const findById = async (contractId) => {
    const result = await pool.query('SELECT * FROM contracts WHERE contract_id = $1', [contractId]);
    if (!result.rows[0]) {
        return null;
    }
    return new Contract(result.rows[0]);
};

/**
 * Tìm tất cả các hợp đồng của một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @returns {Promise<Contract[]>}
 */
const findByHotelId = async (hotelId) => {
    const result = await pool.query('SELECT * FROM contracts WHERE hotel_id = $1 ORDER BY start_date DESC', [hotelId]);
    return result.rows.map(row => new Contract(row));
};

/**
 * Tìm tất cả các hợp đồng của một người dùng (chủ khách sạn).
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<Contract[]>}
 */
const findByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM contracts WHERE user_id = $1 ORDER BY start_date DESC', [userId]);
    return result.rows.map(row => new Contract(row));
};

/**
 * Cập nhật một hợp đồng.
 * @param {string} contractId - ID của hợp đồng cần cập nhật.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<Contract|null>}
 */
const update = async (contractId, updateData) => {
    // Xây dựng câu lệnh UPDATE một cách linh hoạt
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
    }

    if (fields.length === 0) {
        return findById(contractId); // Không có gì để cập nhật
    }

    values.push(contractId);
    const query = `
        UPDATE contracts
        SET ${fields.join(', ')}
        WHERE contract_id = $${paramIndex}
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    if (!result.rows[0]) {
        return null;
    }
    return new Contract(result.rows[0]);
};

/**
 * Xóa một hợp đồng.
 * @param {string} contractId - ID của hợp đồng cần xóa.
 * @returns {Promise<boolean>}
 */
const deleteById = async (contractId) => {
    const result = await pool.query('DELETE FROM contracts WHERE contract_id = $1', [contractId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    findById,
    findByHotelId,
    findByUserId,
    update,
    deleteById,
};
