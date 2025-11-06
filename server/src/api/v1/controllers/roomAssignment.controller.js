// src/api/v1/controllers/roomAssignment.controller.js

const RoomAssignmentService = require('../services/roomAssignment.service');
const { successResponse } = require('../../../utils/response');

class RoomAssignmentController {
    /**
     * Lấy danh sách phòng trống để xếp phòng cho một booking theo loại phòng.
     * GET /api/v1/assignments/available-rooms
     */
    async getAvailableRooms(req, res, next) {
        try {
            const { roomTypeId, checkInDate, checkOutDate, limit } = req.query;
            const rooms = await RoomAssignmentService.getAvailableRooms(roomTypeId, checkInDate, checkOutDate, Number(limit) || 10);
            successResponse(res, rooms);
        } catch (error) {
            next(error);
        }
    }
    /**
     * Gán một phòng cụ thể cho một chi tiết đặt phòng.
     * POST /api/v1/assignments
     */
    async assignRoom(req, res, next) {
        try {
            const userId = req.user.id; // Lấy từ middleware 'authenticate'
            const assignmentData = req.body; // { booking_detail_id, room_id, notes }

            const newAssignment = await RoomAssignmentService.assignRoomToBooking(assignmentData, userId);
            successResponse(res, newAssignment, 'Room assigned successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách các phòng đã được gán cho một đơn đặt phòng.
     * GET /api/v1/assignments/booking/:bookingId
     */
    async getAssignmentsForBooking(req, res, next) {
        try {
            const { bookingId } = req.params;
            const assignments = await RoomAssignmentService.getAssignmentsForBooking(bookingId);
            successResponse(res, assignments);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Hủy việc gán một phòng.
     * DELETE /api/v1/assignments/:assignmentId
     */
    async unassignRoom(req, res, next) {
        try {
            const { assignmentId } = req.params;
            const userId = req.user.id;

            await RoomAssignmentService.unassignRoom(assignmentId, userId);
            successResponse(res, null, 'Room assignment successfully removed');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoomAssignmentController();
