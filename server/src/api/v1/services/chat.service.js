// src/api/v1/services/chat.service.js

const chatRepository = require('../repositories/chat.repository');
const bookingRepository = require('../repositories/booking.repository'); // Giả định đã có
const hotelRepository = require('../repositories/hotel.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');
const hotelStaffRepository = require('../repositories/hotelStaff.repository');

class ChatService {
    /**
     * Gửi một tin nhắn mới.
     * @param {object} messageData - Dữ liệu tin nhắn.
     * @param {string} senderId - ID của người gửi.
     * @returns {Promise<Chat>}
     */
    async sendMessage(messageData, senderId) {
        const { booking_id } = messageData;

        // --- Kiểm tra nghiệp vụ ---
        const booking = await bookingRepository.findById(booking_id);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        const hotel = await hotelRepository.findById(booking.hotelId);
        

        // Chỉ khách hàng, chủ khách sạn, hoặc staff thuộc khách sạn đó mới được chat.
        let allowed = false;
        if (senderId === booking.userId || senderId === hotel.ownerId) {
            allowed = true;
        } else {
            // Kiểm tra staff thuộc khách sạn
            const staff = await hotelStaffRepository.findByUserIdAndHotelId(senderId, hotel.hotelId || hotel.hotel_id);
            if (staff) allowed = true;
        }
        if (!allowed) {
            throw new AppError('Forbidden: You are not part of this conversation', 403);
        }

        const fullMessageData = {
            ...messageData,
            sender_id: senderId,
        };

        const newMessage = await chatRepository.create(fullMessageData);

        // TODO: Tích hợp Supabase Realtime hoặc WebSockets để gửi tin nhắn real-time ở đây.

        return newMessage;
    }

    /**
     * Lấy lịch sử trò chuyện của một đơn đặt phòng.
     * @param {string} bookingId - ID của đơn đặt phòng.
     * @param {string} userId - ID của người dùng hiện tại.
     * @returns {Promise<Chat[]>}
     */
    async getChatHistory(bookingId, userId) {

        // Kiểm tra quyền truy cập: khách, owner, hoặc staff thuộc khách sạn
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) throw new AppError('Booking not found', 404);
        const hotel = await hotelRepository.findById(booking.hotelId);
        let allowed = false;
        if (userId === booking.userId || userId === hotel.ownerId) {
            allowed = true;
        } else {
            const staff = await hotelStaffRepository.findByUserIdAndHotelId(userId, hotel.hotelId || hotel.hotel_id);
            if (staff) allowed = true;
        }
        if (!allowed) {
            throw new AppError('Forbidden: You cannot view this conversation', 403);
        }

        // Sau khi lấy lịch sử, đánh dấu các tin nhắn là đã đọc
        await chatRepository.markAsRead(bookingId, userId);

        return await chatRepository.findByBookingId(bookingId);
    }
}

module.exports = new ChatService();