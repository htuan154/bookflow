// src/api/v1/routes/hotelStaff.route.js

const express = require('express');
const hotelStaffController = require('../controllers/hotelStaff.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { 
    addStaffWithAccountSchema, 
    addExistingUserAsStaffSchema,
    updateStaffSchema 
} = require('../../../validators/hotelStaff.validator');

const router = express.Router();

// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// ==========================================================================
// --- ROUTES CHO KHÁCH SẠN CỤ THỂ ---
// ==========================================================================

/**
 * GET /api/v1/staff/user/:userId
 * Lấy tất cả staff record của một user (ở tất cả khách sạn)
 */
router.get('/staff/user/:userId',
    authorize(['hotel_owner', 'admin', 'hotel_staff']),
    hotelStaffController.getStaffByUserId
);

/**
 * GET /api/v1/hotels/:hotelId/staff
 * Lấy danh sách nhân viên của một khách sạn
 */
router.get('/hotels/:hotelId/staff', 
    authorize(['hotel_owner', 'admin', 'hotel_staff']),
    hotelStaffController.getStaff
);

/**
 * GET /api/v1/hotels/:hotelId/staff/search
 * Tìm kiếm nhân viên trong khách sạn
 * Query params: ?q=search_term&position=job_position&status=active
 */
router.get('/hotels/:hotelId/staff/search',
    authorize(['hotel_owner', 'admin']),
    hotelStaffController.searchStaff
);

/**
 * GET /api/v1/hotels/:hotelId/staff/statistics
 * Lấy thống kê nhân viên của khách sạn
 */
router.get('/hotels/:hotelId/staff/statistics',
    authorize(['hotel_owner', 'admin']),
    hotelStaffController.getStaffStatistics
);

/**
 * POST /api/v1/hotels/:hotelId/staff
 * Thêm nhân viên (method tổng hợp - backward compatibility)
 * Tự động phát hiện: nếu có user_id thì add existing user, ngược lại tạo mới
 */
router.post('/hotels/:hotelId/staff',
    authorize(['hotel_owner', 'admin']),
    // Dynamic validation based on request body
    (req, res, next) => {
        if (req.body.user_id) {
            // Validate for existing user
            validate(addExistingUserAsStaffSchema)(req, res, next);
        } else {
            // Validate for new user creation
            validate(addStaffWithAccountSchema)(req, res, next);
        }
    },
    hotelStaffController.addStaff
);

/**
 * POST /api/v1/hotels/:hotelId/staff/new
 * Tạo nhân viên mới kèm tài khoản user
 */
router.post('/hotels/:hotelId/staff/new',
    authorize(['hotel_owner', 'admin']),
    validate(addStaffWithAccountSchema),
    hotelStaffController.addNewStaff
);

/**
 * POST /api/v1/hotels/:hotelId/staff/existing
 * Thêm user đã tồn tại làm nhân viên
 */
router.post('/hotels/:hotelId/staff/existing',
    authorize(['hotel_owner', 'admin']),
    validate(addExistingUserAsStaffSchema),
    hotelStaffController.addExistingUserAsStaff
);

/**
 * POST /api/v1/hotels/:hotelId/staff/bulk
 * Thêm nhiều nhân viên cùng lúc (bulk operation)
 */
router.post('/hotels/:hotelId/staff/bulk',
    authorize(['hotel_owner', 'admin']),
    hotelStaffController.bulkAddStaff
);

// ==========================================================================
// --- ROUTES CHO NHÂN VIÊN CỤ THỂ ---
// ==========================================================================

/**
 * GET /api/v1/staff/:staffId
 * Lấy thông tin chi tiết một nhân viên
 */
router.get('/staff/:staffId',
    authorize(['hotel_owner', 'admin', 'hotel_staff']),
    hotelStaffController.getStaffById
);

/**
 * PUT /api/v1/staff/:staffId
 * Cập nhật thông tin nhân viên
 */
router.put('/staff/:staffId',
    authorize(['hotel_owner', 'admin']),
    validate(updateStaffSchema),
    hotelStaffController.updateStaff
);

/**
 * DELETE /api/v1/staff/:staffId
 * Xóa (sa thải) nhân viên khỏi khách sạn (không xóa user account)
 */
router.delete('/staff/:staffId',
    authorize(['hotel_owner', 'admin']),
    hotelStaffController.removeStaff
);

/**
 * DELETE /api/v1/staff/:staffId/permanent
 * Xóa nhân viên và user account liên quan (permanent delete)
 * Cần confirmation trong request body: { "confirm": "DELETE_USER_ACCOUNT" }
 */
router.delete('/staff/:staffId/permanent',
    authorize(['admin']), // Only admin can permanently delete user accounts
    hotelStaffController.removeStaffPermanently
);

// ==========================================================================
// --- MIDDLEWARE XỬ LÝ LỖI ---
// ==========================================================================

/**
 * Error handling middleware for routes
 */
router.use((error, req, res, next) => {
    console.error('Hotel Staff Route Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: error.details || error.message
        });
    }
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    // Handle authorization errors
    if (error.name === 'UnauthorizedError') {
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    }
    
    // Default error
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

module.exports = router;