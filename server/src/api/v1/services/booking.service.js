// src/api/v1/services/booking.service.js

const pool = require('../../../config/db');
const bookingRepository = require('../repositories/booking.repository');
const bookingDetailRepository = require('../repositories/bookingDetail.repository');
const roomTypeRepository = require('../repositories/roomType.repository');
const { AppError } = require('../../../utils/errors');

class BookingService {

    /**
     * Lấy tất cả booking có status 'no_show' của một user.
     * @param {string} userId
     * @returns {Promise<Booking[]>}
     */
    async findNoShowBookingsByUser(userId) {
        return await bookingRepository.findNoShowByUserId(userId);
    }

    /**
     * Lấy tất cả các booking đã hoàn thành của một user
     * @param {string} userId
     * @returns {Promise<Booking[]>}
     */
    async findCompletedBookingsByUser(userId) {
        return await bookingRepository.findCompletedByUserId(userId);
    }
    /**
     * Lấy tất cả các booking của một user
     * @param {string} userId
     * @returns {Promise<Booking[]>}
     */
    async findUserBookings(userId) {
        return await bookingRepository.findByUserId(userId);
    }

    /**
     * Lấy tất cả các booking của một khách sạn
     * @param {string} hotelId
     * @returns {Promise<Booking[]>}
     */
    async findBookingsByHotelId(hotelId) {
        return await bookingRepository.findBookingsByHotelId(hotelId);
    }
    
    /**
     * Khách hàng tạo một đơn đặt phòng mới.
     * @param {object} bookingData - Dữ liệu đặt phòng từ client.
     * @param {string} userId - ID của người dùng đặt phòng.
     * @returns {Promise<{booking: Booking, details: BookingDetail[]}>}
     */
    async createBooking(bookingData, userId) {
        const { hotel_id, check_in_date, check_out_date, total_guests /*, room_details*/ } = bookingData;

        // --- Bắt đầu một giao dịch (transaction) ---
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // --- Logic nghiệp vụ ---
            
            // 1. Kiểm tra xem user có booking no_show không
            const noShowBookings = await bookingRepository.findNoShowByUserId(userId);
            const defaultStatus = noShowBookings.length > 0 ? 'pending' : 'confirmed';
            
            console.log(`📋 User ${userId} has ${noShowBookings.length} no_show bookings -> default status: ${defaultStatus}`);

            // 2. Kiểm tra xem có chi tiết phòng nào được cung cấp không
            // if (!room_details || room_details.length === 0) {
            //     throw new AppError('Booking must include at least one room detail', 400);
            // }

            // 3. Tính toán tổng giá và kiểm tra phòng
            // let calculatedTotalPrice = 0;
            // for (const detail of room_details) {
            //     const roomType = await roomTypeRepository.findById(detail.room_type_id);
            //     if (!roomType) {
            //         throw new AppError(`Room type with ID ${detail.room_type_id} not found`, 404);
            //     }
            //     // TODO: Thêm logic kiểm tra phòng trống (availability) ở đây
                
            //     // Tính giá tiền cho từng chi tiết
            //     detail.unit_price = roomType.basePrice;
            //     detail.subtotal = roomType.basePrice * detail.quantity;
            //     calculatedTotalPrice += detail.subtotal;
            // }

            // 4. Tạo bản ghi chính (master booking) với status động
            const masterBookingData = {
                ...bookingData,
                user_id: userId,
                booking_status: defaultStatus, // Động: 'confirmed' hoặc 'pending'
                //total_price: total_price, // hoặc bạn có thể thay thế bằng giá cố định/tạm thời nếu cần
                // total_price: calculatedTotalPrice,
            };
            const newBooking = await bookingRepository.create(masterBookingData, client);

            // 5. Tạo các bản ghi chi tiết (booking details)
            // const newBookingDetails = await bookingDetailRepository.createMany(room_details, newBooking.bookingId, client);

            // --- Kết thúc giao dịch ---
            await client.query('COMMIT');

            return {
                booking: newBooking,
                details: [] // hoặc trả về undefined/null nếu bạn muốn bỏ hoàn toàn phần này
            };

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
     * Khách sạn tạo booking cho khách hàng (userId truyền vào)
     * @param {object} bookingData - Dữ liệu đặt phòng từ client.
     * @param {string} userId - ID của người dùng đặt phòng (truyền vào, không lấy từ token)
     * @returns {Promise<{booking: Booking, details: BookingDetail[]}>}
     */
    async createBookingForCustomer(bookingData, userId) {
        // Logic giống hệt createBooking nhưng userId lấy từ tham số
        const { hotel_id, check_in_date, check_out_date, total_guests } = bookingData;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // 1. Kiểm tra user có booking no_show không
            const noShowBookings = await bookingRepository.findNoShowByUserId(userId);
            const defaultStatus = noShowBookings.length > 0 ? 'pending' : 'confirmed';
            // 4. Tạo bản ghi chính (master booking) với status động
            const masterBookingData = {
                ...bookingData,
                user_id: userId,
                booking_status: defaultStatus,
            };
            const newBooking = await bookingRepository.create(masterBookingData, client);
            await client.query('COMMIT');
            return {
                booking: newBooking,
                details: []
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
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
        // if (currentUser.role !== 'admin' && booking.userId !== currentUser.id) {
        //     throw new AppError('Forbidden: You do not have permission to view this booking', 403);
        // }

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

    /**
     * Cập nhật booking (generic update - nhiều fields)
     * @param {String} bookingId
     * @param {Object} updateData - {paymentStatus, bookingStatus, ...}
     */
    async updateBooking(bookingId, updateData) {
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        // Validate paymentStatus nếu có
        if (updateData.paymentStatus) {
            const validPaymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
            if (!validPaymentStatuses.includes(updateData.paymentStatus)) {
                throw new AppError('Invalid payment status', 400);
            }
        }

        // Validate bookingStatus nếu có
        if (updateData.bookingStatus) {
            const validStatuses = ['pending', 'confirmed', 'canceled', 'completed', 'no_show'];
            if (!validStatuses.includes(updateData.bookingStatus)) {
                throw new AppError('Invalid booking status', 400);
            }
        }

        return await bookingRepository.update(bookingId, updateData);
    }
}

module.exports = new BookingService();
