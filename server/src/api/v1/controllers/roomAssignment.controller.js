// src/api/v1/controllers/roomAssignment.controller.js

const RoomAssignmentService = require('../services/roomAssignment.service');
const { successResponse } = require('../../../utils/response');

class RoomAssignmentController {
    /**
     * Gán một phòng cụ thể cho một chi tiết đặt phòng.
     * POST /api/v1/assignments
     */
    async assignRoom(req, res, next) {
        try {
            const userId = req.user.userId; // Lấy từ middleware 'authenticate'
            const assignmentData = req.body; // { booking_detail_id, room_id, notes }

            const newAssignment = await RoomAssignmentService.assignRoomToBooking(assignmentData, userId);
            successResponse(res, newAssignment, 'Room assigned successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách các phòng đã được gán cho một đơn đặt phòng.
     * GET /api/v1/bookings/:bookingId/assignments
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
            const userId = req.user.userId;

            await RoomAssignmentService.unassignRoom(assignmentId, userId);
            successResponse(res, null, 'Room assignment successfully removed');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoomAssignmentController();
