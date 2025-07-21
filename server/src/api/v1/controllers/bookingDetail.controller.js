// src/api/v1/controllers/bookingDetail.controller.js

const BookingDetailService = require('../services/bookingDetail.service');
const { successResponse } = require('../../../utils/response');

class BookingDetailController {
    /**
     * Lấy thông tin chi tiết đặt phòng bằng detail ID.
     * GET /api/v1/booking-details/:detailId
     */
    async getBookingDetailById(req, res, next) {
        try {
            const { detailId } = req.params;
            const currentUser = req.user; // Lấy từ middleware 'authenticate'

            const result = await BookingDetailService.getBookingDetailById(detailId, currentUser);
            successResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả chi tiết đặt phòng của một booking.
     * GET /api/v1/booking-details/booking/:bookingId
     */
    async getBookingDetailsByBookingId(req, res, next) {
        try {
            const { bookingId } = req.params;
            const currentUser = req.user; // Lấy từ middleware 'authenticate'

            const result = await BookingDetailService.getBookingDetailsByBookingId(bookingId, currentUser);
            successResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thêm booking details vào một booking đã tồn tại.
     * POST /api/v1/booking-details/booking/:bookingId
     */
    async addBookingDetails(req, res, next) {
        try {
            const { bookingId } = req.params;
            const roomDetails = req.body.room_details;
            const currentUser = req.user; // Lấy từ middleware 'authenticate'

            const result = await BookingDetailService.addBookingDetails(bookingId, roomDetails, currentUser);
            successResponse(res, result, 'Booking details added successfully', 201);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BookingDetailController();