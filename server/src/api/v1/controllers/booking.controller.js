// src/api/v1/controllers/booking.controller.js

const BookingService = require('../services/booking.service');
const { successResponse } = require('../../../utils/response');

class BookingController {
    /**
     * Lấy tất cả booking no_show của một user
     * GET /api/v1/bookings/user/:userId/no_show
     */
    async getUserNoShowBookings(req, res, next) {
        try {
            const { userId } = req.params;
            // Cho phép admin hoặc chính user xem
            if (req.user.role !== 'admin' && req.user.id !== userId) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            const bookings = await BookingService.findNoShowBookingsByUser(userId);
            successResponse(res, bookings);
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Lấy tất cả các booking đã hoàn thành của một user
     * GET /api/v1/bookings/user/:userId/completed
     */
    async getUserCompletedBookings(req, res, next) {
        try {
            const { userId } = req.params;
            // Cho phép admin hoặc chính user xem
            if (req.user.role !== 'admin' && req.user.id !== userId) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            const bookings = await BookingService.findCompletedBookingsByUser(userId);
            successResponse(res, bookings);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả các booking của một user
     * GET /api/v1/bookings/user/:userId
     */
    async getUserBookings(req, res, next) {
        try {
            const { userId } = req.params;
            // Cho phép admin hoặc chính user xem
            if (req.user.role !== 'admin' && req.user.id !== userId) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            const bookings = await BookingService.findUserBookings(userId);
            successResponse(res, bookings);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả các booking của một khách sạn
     * GET /api/v1/bookings/hotel/:hotelId
     */
    async getBookingsByHotelId(req, res, next) {
        try {
            const { hotelId } = req.params;
            // Chỉ cho phép chủ khách sạn hoặc admin xem
            if (req.user.role !== 'admin' && req.user.role !== 'hotel_owner') {
                return res.status(403).json({ message: 'Forbidden' });
            }
            const bookings = await BookingService.findBookingsByHotelId(hotelId);
            successResponse(res, bookings);
        } catch (error) {
            next(error);
        }
    }
    /**
     * Khách hàng tạo một đơn đặt phòng mới.
     * POST /api/v1/bookings
     */
    async createBooking(req, res, next) {
        try {
            const userId = req.user.id; // Lấy từ middleware 'authenticate'
            const bookingData = req.body;

            const result = await BookingService.createBooking(bookingData, userId);
            successResponse(res, result, 'Booking created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy thông tin chi tiết một đơn đặt phòng.
     * GET /api/v1/bookings/:bookingId
     */
    async getBookingDetails(req, res, next) {
        try {
            const { bookingId } = req.params;
            const currentUser = req.user; // Lấy từ middleware 'authenticate'

            const result = await BookingService.getBookingDetails(bookingId, currentUser);
            successResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật trạng thái của một đơn đặt phòng.
     * PATCH /api/v1/bookings/:bookingId/status 
     */
    async updateBookingStatus(req, res, next) {
        try {
            const { bookingId } = req.params;
            const { status } = req.body;

            const updatedBooking = await BookingService.updateBookingStatus(bookingId, status);
            successResponse(res, updatedBooking, 'Booking status updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin booking (generic update - nhiều fields)
     * PATCH /api/v1/bookings/:bookingId
     */
    async updateBooking(req, res, next) {
        try {
            const { bookingId } = req.params;
            const updateData = req.body;

            const updatedBooking = await BookingService.updateBooking(bookingId, updateData);
            successResponse(res, updatedBooking, 'Booking updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BookingController();
