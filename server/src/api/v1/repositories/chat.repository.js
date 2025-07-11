// src/api/v1/repositories/chat.repository.js

const pool = require('../../../config/db');
const Chat = require('../../../models/chat.model');

/**
 * Tạo một tin nhắn mới.
 * @param {object} messageData - Dữ liệu của tin nhắn.
 * @returns {Promise<Chat>}
 */
const create = async (messageData) => {
    const { booking_id, sender_id, message_content } = messageData;
    const query = `
        INSERT INTO chat (booking_id, sender_id, message_content)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [booking_id, sender_id, message_content];
    const result = await pool.query(query, values);
    return new Chat(result.rows[0]);
};

/**
 * Tìm tất cả các tin nhắn của một cuộc trò chuyện (theo booking_id).
 * @param {string} bookingId - ID của đơn đặt phòng.
 * @returns {Promise<Chat[]>}
 */
const findByBookingId = async (bookingId) => {
    const query = 'SELECT * FROM chat WHERE booking_id = $1 ORDER BY created_at ASC';
    const result = await pool.query(query, [bookingId]);
    return result.rows.map(row => new Chat(row));
};

/**
 * Đánh dấu các tin nhắn là đã đọc.
 * @param {string} bookingId - ID của đơn đặt phòng.
 * @param {string} recipientId - ID của người nhận tin nhắn (để không đánh dấu tin nhắn của chính mình là đã đọc).
 * @returns {Promise<void>}
 */
const markAsRead = async (bookingId, recipientId) => {
    const query = `
        UPDATE chat
        SET is_read = true
        WHERE booking_id = $1 AND sender_id != $2 AND is_read = false;
    `;
    await pool.query(query, [bookingId, recipientId]);
};


module.exports = {
    create,
    findByBookingId,
    markAsRead,
};