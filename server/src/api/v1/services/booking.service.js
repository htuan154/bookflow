// src/api/v1/services/booking.service.js

const pool = require('../../../config/db');
const bookingRepository = require('../repositories/booking.repository');
const bookingDetailRepository = require('../repositories/bookingDetail.repository');
const roomTypeRepository = require('../repositories/roomType.repository');
const { AppError } = require('../../../utils/errors');

class BookingService {
    /**
     * Khách hàng tạo một đơn đặt phòng mới.
     * @param {object} bookingData - Dữ liệu đặt phòng từ client.
     * @param {string} userId - ID của người dùng đặt phòng.
     * @returns {Promise<{booking: Booking, details: BookingDetail[]}>}
     */
    async createBooking(bookingData, userId) {
        const { hotel_id, check_in_date, check_out_date, total_guests, room_details } = bookingData;

        // --- Bắt đầu một giao dịch (transaction) ---
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // --- Logic nghiệp vụ ---
            // 1. Kiểm tra xem có chi tiết phòng nào được cung cấp không
            if (!room_details || room_details.length === 0) {
                throw new AppError('Booking must include at least one room detail', 400);
            }

            // 2. Tính toán tổng giá và kiểm tra phòng
            let calculatedTotalPrice = 0;
            for (const detail of room_details) {
                const roomType = await roomTypeRepository.findById(detail.room_type_id);
                if (!roomType) {
                    throw new AppError(`Room type with ID ${detail.room_type_id} not found`, 404);
                }
                // TODO: Thêm logic kiểm tra phòng trống (availability) ở đây
                
                // Tính giá tiền cho từng chi tiết
                detail.unit_price = roomType.basePrice;
                detail.subtotal = roomType.basePrice * detail.quantity;
                calculatedTotalPrice += detail.subtotal;
            }

            // 3. Tạo bản ghi chính (master booking)
            const masterBookingData = {
                ...bookingData,
                user_id: userId,
                total_price: calculatedTotalPrice,
            };
            const newBooking = await bookingRepository.create(masterBookingData, client);

            // 4. Tạo các bản ghi chi tiết (booking details)
            const newBookingDetails = await bookingDetailRepository.createMany(room_details, newBooking.bookingId, client);

            // --- Kết thúc giao dịch ---
            await client.query('COMMIT');

            return { booking: newBooking, details: newBookingDetails };

        } catch (error) {
            // Nếu có bất kỳ lỗi nào, hủy bỏ tất cả các thay đổi
            await client.query('ROLLBACK');
            // Ném lỗi ra ngoài để controller xử lý
            throw error;
        } finally {
            // Luôn trả client về pool sau khi xong việc
            client.release();
        }
    }

    /**
     * Lấy thông tin chi tiết một đơn đặt phòng.
     * @param {string} bookingId - ID của đơn đặt phòng.
     * @param {object} currentUser - Thông tin người dùng hiện tại từ token.
     * @returns {Promise<any>}
     */
    async getBookingDetails(bookingId, currentUser) {
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        // Logic phân quyền: Chỉ admin hoặc chính người đặt phòng mới được xem
        if (currentUser.role !== 'admin' && booking.userId !== currentUser.userId) {
            throw new AppError('Forbidden: You do not have permission to view this booking', 403);
        }

        const details = await bookingDetailRepository.findByBookingId(bookingId);
        return { booking, details };
    }

    /**
     * Chủ khách sạn hoặc Admin thay đổi trạng thái của một đơn đặt phòng.
     * @param {string} bookingId - ID của đơn đặt phòng.
     * @param {string} newStatus - Trạng thái mới ('confirmed', 'canceled', 'completed', 'no_show').
     * @returns {Promise<Booking>}
     */
    async updateBookingStatus(bookingId, newStatus) {
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        // TODO: Thêm logic kiểm tra quyền của người cập nhật (phải là chủ khách sạn hoặc admin)

        const validStatuses = ['confirmed', 'canceled', 'completed', 'no_show'];
        if (!validStatuses.includes(newStatus)) {
            throw new AppError('Invalid booking status', 400);
        }

        return await bookingRepository.updateStatus(bookingId, newStatus);
    }
}

module.exports = new BookingService();
