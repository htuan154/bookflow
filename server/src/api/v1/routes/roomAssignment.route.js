// src/api/v1/routes/roomAssignment.route.js
const express = require('express');
// Import trực tiếp instance của controller đã được export
const roomAssignmentController = require('../controllers/roomAssignment.controller');

const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { assignRoomSchema } = require('../../../validators/roomAssignment.validator');

const router = express.Router();

// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// POST /api/v1/assignments -> Gán một phòng mới cho một chi tiết đặt phòng
// Yêu cầu: Đã đăng nhập VÀ là 'hotel_owner' hoặc 'admin'
router.post(
    '/',
    authorize(['hotel_owner', 'admin', 'hotel_staff']),
    validate(assignRoomSchema),
    roomAssignmentController.assignRoom
);

// DELETE /api/v1/assignments/:assignmentId -> Hủy việc gán một phòng
// Yêu cầu: Đã đăng nhập VÀ là 'hotel_owner' hoặc 'admin'
router.delete(
    '/:assignmentId',
    authorize(['hotel_owner', 'admin', 'hotel_staff']),
    roomAssignmentController.unassignRoom
);

// GET /api/v1/assignments/bookings/:bookingId -> Lấy danh sách các phòng đã gán cho một đơn đặt phòng
// Yêu cầu: Đã đăng nhập (chủ khách sạn, admin, hoặc chính khách hàng đó có thể xem)
router.get(
    '/bookings/:bookingId',
    roomAssignmentController.getAssignmentsForBooking
);

// GET /api/v1/assignments/available-rooms?roomTypeId=...&checkInDate=...&checkOutDate=...&limit=...
router.get(
    '/available-rooms',
    roomAssignmentController.getAvailableRooms
);

// POST /api/v1/assignments/release-rooms/:bookingId -> Cập nhật trạng thái phòng về available khi booking checkout
// Yêu cầu: Đã đăng nhập VÀ là 'hotel_owner' hoặc 'admin'
router.post(
    '/release-rooms/:bookingId',
    authorize(['hotel_owner', 'admin', 'hotel_staff']),
    roomAssignmentController.releaseRoomsByBooking
);

module.exports = router;