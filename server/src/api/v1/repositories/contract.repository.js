// src/api/v1/repositories/contract.repository.js

const pool = require('../../../config/db');
const Contract = require('../../../models/contract.model');
const Contract_custom = require('../../../models/contract_hotel');

// /**
//  * Tạo một hợp đồng mới.
//  * @param {object} contractData - Dữ liệu của hợp đồng.
//  * @returns {Promise<Contract>} - Trả về instance của Contract vừa được tạo.
//  */
// const create = async (contractData) => {
//     const {
//         user_id, hotel_id, contract_number, contract_type, title, description,
//         start_date, end_date, signed_date, contract_value, currency,
//         payment_terms, status = 'draft', contract_file_url,
//         terms_and_conditions, notes, created_by
//     } = contractData;

//     const query = `
//         INSERT INTO contracts (
//             user_id, hotel_id, contract_number, contract_type, title, description,
//             start_date, end_date, signed_date, contract_value, currency,
//             payment_terms, status, contract_file_url, terms_and_conditions, notes, created_by
//         )
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
//         RETURNING *;
//     `;
//     const values = [
//         user_id, hotel_id, contract_number, contract_type, title, description,
//         start_date, end_date, signed_date, contract_value, currency,
//         payment_terms, status, contract_file_url, terms_and_conditions, notes, created_by
//     ];

//     const result = await pool.query(query, values);
//     return new Contract(result.rows[0]);
// };

/**
 * Tạo một hợp đồng mới.ngay 23/8
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

    // ✅ Logging toàn bộ đầu vào để kiểm tra từ Postman
    console.log('[Create Contract] Input:', contractData);
    console.log('[Create Contract] created_by:', created_by);

    // ✅ Ràng buộc bắt buộc nếu cần
    if (!created_by) {
        console.warn('[Create Contract] ⚠️ created_by is missing or null.');
    }

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
        payment_terms, status, contract_file_url, terms_and_conditions, notes, created_by || null
    ];

    // ✅ Logging values chuẩn bị insert
    console.log('[Create Contract] Insert values:', values);

    try {
        const result = await pool.query(query, values);
        console.log('[Create Contract] ✅ Inserted contract:', result.rows[0]);
        return new Contract(result.rows[0]);
    } catch (err) {
        console.error('[Create Contract] ❌ DB Insert Error:', err);
        throw err;
    }
};


/**
 * Tìm một hợp đồng bằng ID, kèm tên khách sạn.
 * @param {string} contractId - UUID của hợp đồng.
 * @returns {Promise<Contract|null>}
 */
const findById = async (contractId) => {
    const query = `
        SELECT c.*, h.name AS hotel_name
        FROM contracts c
        LEFT JOIN hotels h ON c.hotel_id = h.hotel_id
        WHERE c.contract_id = $1
        LIMIT 1
    `;
    const result = await pool.query(query, [contractId]);
    if (!result.rows[0]) {
        return null;
    }
    const contract = new Contract(result.rows[0]);
    contract.hotelName = result.rows[0].hotel_name;
    return contract;
};

/**
 * Tìm tất cả các hợp đồng của một khách sạn, kèm tên khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @returns {Promise<Contract[]>}
 */
const findByHotelId = async (hotelId) => {
    const query = `
        SELECT c.*, h.name AS hotel_name
        FROM contracts c
        LEFT JOIN hotels h ON c.hotel_id = h.hotel_id
        WHERE c.hotel_id = $1
        ORDER BY c.start_date DESC
    `;
    const result = await pool.query(query, [hotelId]);
    return result.rows.map(row => {
        const contract = new Contract(row);
        contract.hotelName = row.hotel_name;
        return contract;
    });
};

/**
 * Tìm tất cả các hợp đồng của một người dùng (chủ khách sạn), kèm tên khách sạn.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<Contract[]>}
 */
const findByUserId = async (userId) => {
    const query = `
        SELECT c.*, h.name AS hotel_name
        FROM contracts c
        LEFT JOIN hotels h ON c.hotel_id = h.hotel_id
        WHERE c.user_id = $1
        ORDER BY c.start_date DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => {
        const contract = new Contract_custom(row);
        contract.hotelName = row.hotel_name;
        return contract;
    });
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

/**
 * Lấy tất cả hợp đồng, kèm tên khách sạn.
 * @returns {Promise<Contract_custom[]>}
 */
const findAll = async () => {
    const query = `
        SELECT c.*, h.name AS hotel_name
        FROM contracts c
        LEFT JOIN hotels h ON c.hotel_id = h.hotel_id
        ORDER BY c.created_at DESC;
    `;
    try {
        const result = await pool.query(query);
        return result.rows.map(row => {
            const contract = new Contract_custom(row);
            contract.hotelName = row.hotel_name; // Bỏ comment dòng này!
            console.log('[DEBUG Contract_custom]', contract); // Thêm dòng này để debug

            return contract;
        });
    } catch (error) {
        console.error('[findAll] ❌ Error fetching all contracts:', error);
        throw error;
    }
};

/**
 * Lấy hợp đồng theo trạng thái, kèm tên khách sạn.
 * @param {string} status
 * @returns {Promise<Contract[]>}
 */
async function findByStatus(status) {
    const query = `
        SELECT c.*, h.name AS hotel_name
        FROM contracts c
        LEFT JOIN hotels h ON c.hotel_id = h.hotel_id
        WHERE c.status = $1
        ORDER BY c.start_date DESC;
    `;
    const values = [status];
    try {
        const result = await pool.query(query, values);
        return result.rows.map(row => {
            const contract = new Contract(row);
            contract.hotelName = row.hotel_name;
            return contract;
        });
    } catch (error) {
        console.error('Error fetching contracts by status:', error);
        throw error;
    }
}

/**
 * Gửi duyệt hợp đồng (hotel owner)
 * @param {string} contractId - ID hợp đồng
 * @param {string} userId - ID của chủ khách sạn (người gửi duyệt)
 * @returns {Promise<Object|null>}
 */
const sendForApproval = async (contractId, userId) => {
    const query = `
        UPDATE contracts
        SET status = 'pending',
            signed_date = NOW()::DATE
        WHERE contract_id = $1
          AND user_id = $2
          AND status = 'draft'
          AND hotel_id IN (
              SELECT hotel_id FROM hotels WHERE owner_id = $2
          )
        RETURNING *;
    `;

    try {
        const result = await pool.query(query, [contractId, userId]);
        if (result.rows.length === 0) {
            return null; // Không tìm thấy hoặc không phải draft / không phải chủ khách sạn
        }
        return result.rows[0];
    } catch (error) {
        console.error('[ContractRepo] ❌ Error sendForApproval:', error);
        throw error;
    }
};

module.exports = {
    create,
    findById,
    findByHotelId,
    findByUserId,
    update,
    deleteById,
    findAll,
    findByStatus,
    sendForApproval
};

