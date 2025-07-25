// src/api/v1/services/bookingStatusHistory.service.js

const bookingStatusHistoryRepository = require('../repositories/bookingStatusHistory.repository');
const bookingRepository = require('../repositories/booking.repository');
const { AppError } = require('../../../utils/errors');

class BookingStatusHistoryService {
    /**
     * Ghi lại một thay đổi trạng thái.
     * Đây là hàm nội bộ, được gọi bởi các service khác.
     * @param {object} logData - Dữ liệu cần ghi lại.
     * @returns {Promise<BookingStatusHistory>}
     */
    async createLog(logData) {
        return await bookingStatusHistoryRepository.create(logData);
    }

    /**
     * Lấy lịch sử thay đổi của một đơn đặt phòng.
     * @param {string} bookingId - ID của đơn đặt phòng.
     * @param {object} currentUser - Thông tin người dùng hiện tại.
     * @returns {Promise<BookingStatusHistory[]>}
     */
    async getHistoryForBooking(bookingId, currentUser) {
        // Kiểm tra xem đơn đặt phòng có tồn tại không
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        // Phân quyền: Chỉ admin, chủ khách sạn, hoặc người đặt phòng mới được xem
        if (currentUser.role !== 'admin' && currentUser.role !== 'hotel_owner' && booking.userId !== currentUser.userId) {
            throw new AppError('Forbidden: You do not have permission to view this history', 403);
        }

        return await bookingStatusHistoryRepository.findByBookingId(bookingId);
    }
}

module.exports = new BookingStatusHistoryService();
