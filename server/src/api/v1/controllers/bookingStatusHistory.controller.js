// src/api/v1/controllers/bookingStatusHistory.controller.js

const BookingStatusHistoryService = require('../services/bookingStatusHistory.service');
const { successResponse } = require('../../../utils/response');

class BookingStatusHistoryController {
    /**
     * Lấy lịch sử thay đổi của một đơn đặt phòng.
     * GET /api/v1/bookings/:bookingId/history
     */
    async getBookingHistory(req, res, next) {
        try {
            const { bookingId } = req.params;
            const currentUser = req.user;

            const history = await BookingStatusHistoryService.getHistoryForBooking(bookingId, currentUser);
            successResponse(res, history, 'Booking history retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới một bản ghi lịch sử trạng thái booking
     * POST /api/v1/bookings/:bookingId/history
     */
    async createBookingStatusHistory(req, res, next) {
        try {
            const { bookingId } = req.params;
            const currentUserId = req.user.id;
            const { old_status, new_status, change_reason, notes } = req.body;

            // Service sẽ tự động tìm staff_id dựa vào userId và hotelId của booking
            const logData = {
                booking_id: bookingId,
                old_status,
                new_status,
                change_reason,
                notes
            };
            
            const created = await BookingStatusHistoryService.createLog(logData, currentUserId);
            successResponse(res, created, 'Booking status history created successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BookingStatusHistoryController();
