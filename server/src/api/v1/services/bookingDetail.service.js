// src/api/v1/services/bookingDetail.service.js

const bookingDetailRepository = require('../repositories/bookingDetail.repository');
const bookingRepository = require('../repositories/booking.repository');
const { AppError } = require('../../../utils/errors');

class BookingDetailService {
    /**
     * Lấy thông tin chi tiết đặt phòng bằng detail ID.
     * @param {string} detailId - ID của chi tiết đặt phòng.
     * @param {object} currentUser - Thông tin người dùng hiện tại từ token.
     * @returns {Promise<BookingDetail>}
     */
    async getBookingDetailById(detailId, currentUser) {
        const bookingDetail = await bookingDetailRepository.findById(detailId);
        if (!bookingDetail) {
            throw new AppError('Booking detail not found', 404);
        }

        // Kiểm tra quyền truy cập - cần lấy thông tin booking để kiểm tra user
        const booking = await bookingRepository.findById(bookingDetail.bookingId);
        if (!booking) {
            throw new AppError('Associated booking not found', 404);
        }

        // Logic phân quyền: Chỉ admin hoặc chính người đặt phòng mới được xem
        if (currentUser.role !== 'admin' && booking.userId !== currentUser.id) {
            throw new AppError('Forbidden: You do not have permission to view this booking detail', 403);
        }

        return bookingDetail;
    }

    /**
     * Lấy tất cả chi tiết đặt phòng của một booking.
     * @param {string} bookingId - ID của đơn đặt phòng.
     * @param {object} currentUser - Thông tin người dùng hiện tại từ token.
     * @returns {Promise<BookingDetail[]>}
     */
    async getBookingDetailsByBookingId(bookingId, currentUser) {
        // Kiểm tra booking có tồn tại không
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        // Logic phân quyền: Chỉ admin hoặc chính người đặt phòng mới được xem
        if (currentUser.role !== 'admin' && booking.userId !== currentUser.id) {
            throw new AppError('Forbidden: You do not have permission to view booking details', 403);
        }

        const bookingDetails = await bookingDetailRepository.findByBookingId(bookingId);
        return bookingDetails;
    }

    /**
     * Thêm booking details vào một booking đã tồn tại.
     * @param {string} bookingId - ID của đơn đặt phòng.
     * @param {Array<object>} roomDetails - Mảng các chi tiết phòng cần thêm.
     * @param {object} currentUser - Thông tin người dùng hiện tại từ token.
     * @returns {Promise<BookingDetail[]>}
     */
    async addBookingDetails(bookingId, roomDetails, currentUser) {
        // Kiểm tra booking có tồn tại không
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        // Logic phân quyền: Chỉ admin hoặc chính người đặt phòng mới được thêm details
        if (currentUser.role !== 'admin' && booking.userId !== currentUser.id) {
            throw new AppError('Forbidden: You do not have permission to modify this booking', 403);
        }

        // Kiểm tra booking status - không cho phép thêm details nếu đã confirmed/completed/canceled
        const restrictedStatuses = ['confirmed', 'completed', 'canceled', 'no_show'];
        if (restrictedStatuses.includes(booking.status)) {
            throw new AppError(`Cannot add booking details. Booking status is ${booking.status}`, 400);
        }

        // Validate room details
        if (!roomDetails || roomDetails.length === 0) {
            throw new AppError('Room details must include at least one room', 400);
        }

        // Bắt đầu transaction
        const pool = require('../../../config/db');
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // TODO: Thêm logic validation cho room_type_id, availability, pricing
            // Tạm thời chỉ tạo booking details với dữ liệu được cung cấp
            const newBookingDetails = await bookingDetailRepository.createMany(roomDetails, bookingId, client);

            // TODO: Cập nhật lại total_price của booking chính nếu cần
            
            await client.query('COMMIT');
            return newBookingDetails;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new BookingDetailService();