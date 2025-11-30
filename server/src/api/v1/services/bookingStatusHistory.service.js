// src/api/v1/services/bookingStatusHistory.service.js

const bookingStatusHistoryRepository = require('../repositories/bookingStatusHistory.repository');
const bookingRepository = require('../repositories/booking.repository');
const hotelStaffRepository = require('../repositories/hotelStaff.repository');
const { AppError } = require('../../../utils/errors');

class BookingStatusHistoryService {
    /**
     * Ghi lại một thay đổi trạng thái.
     * Đây là hàm nội bộ, được gọi bởi các service khác.
     * @param {object} logData - Dữ liệu cần ghi lại.
     * @param {string} currentUserId - ID của user đang thao tác
     * @returns {Promise<BookingStatusHistory>}
     */
    async createLog(logData, currentUserId) {
        // 1. Tìm thông tin booking để lấy hotel_id
        const booking = await bookingRepository.findById(logData.booking_id);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        // 2. Tìm staff_id dựa vào user_id và hotel_id
        const staff = await hotelStaffRepository.findByUserIdAndHotelId(currentUserId, booking.hotelId);
        if (!staff) {
            throw new AppError('Bạn không phải là nhân viên của khách sạn này', 403);
        }

        // 3. Cập nhật logData với staff_id
        const updatedLogData = {
            ...logData,
            changed_by_staff: staff.staffId
        };

        // 4. Tạo bản ghi lịch sử
        return await bookingStatusHistoryRepository.create(updatedLogData);
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
        if (currentUser.role !== 'admin' && currentUser.role !== 'hotel_owner' && currentUser.role !== 'hotel_staff' && booking.userId !== currentUser.userId) {
            throw new AppError('Forbidden: You do not have permission to view this history', 403);
        }

        return await bookingStatusHistoryRepository.findByBookingId(bookingId);
    }
}

module.exports = new BookingStatusHistoryService();
