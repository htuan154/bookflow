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
}

module.exports = new BookingStatusHistoryController();
