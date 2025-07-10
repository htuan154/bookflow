// src/api/v1/routes/roomTypeImage.route.js

const express = require('express');
const roomTypeImageController = require('../controllers/roomTypeImage.controller');
// Cập nhật để import authenticate và authorize
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { uploadImagesSchema } = require('../../../validators/roomTypeImage.validator');
const authMiddleware = require('../middlewares/auth.middleware');
const roomTypeMiddlewares = require('../middlewares/roomType.middleware');
const roomTypeController = require('../controllers/roomType.controller');

const router = express.Router();


// ===============================================
// PUBLIC ROUTE
// ===============================================

// GET /api/v1/room-types/:roomTypeId/images -> Lấy tất cả hình ảnh của một loại phòng
router.get('/room-types/:roomTypeId/images', roomTypeImageController.getImages);


// ===============================================
// PROTECTED ROUTES (Yêu cầu đăng nhập và có quyền)
// ===============================================

// Create
router.post('/',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'hotel_owner']),
  roomTypeMiddlewares.validateCreateRoomType,
  roomTypeMiddlewares.checkHotelExists,
  roomTypeController.createRoomType
);

// Update
router.put('/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'hotel_owner']),
  roomTypeMiddlewares.validateRoomTypeId,
  roomTypeMiddlewares.checkRoomTypeExists,
  roomTypeMiddlewares.validateUpdateRoomType,
  roomTypeController.updateRoomType
);

// Delete
router.delete('/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'hotel_owner']),
  roomTypeMiddlewares.validateRoomTypeId,
  roomTypeMiddlewares.checkRoomTypeExists,
  roomTypeController.deleteRoomType
);

// Bulk Create
router.post('/bulk',
  authMiddleware.authenticate,           // Kiểm tra user đã đăng nhập
  authMiddleware.authorize(['admin', 'hotel_owner']),   // Kiểm tra user có role 'admin'
  roomTypeMiddlewares.validateBulkCreate,
  roomTypeController.bulkCreateRoomTypes
);

// Duplicate
router.post('/:id/duplicate',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'hotel_owner']),
  roomTypeMiddlewares.validateRoomTypeId,
  roomTypeMiddlewares.checkRoomTypeExists,
  roomTypeMiddlewares.asyncHandler(async (req, res) => {
    const original = req.roomType;
    const newRoomTypeData = {
      hotelId: original.hotelId,
      name: `${original.name} (Copy)`,
      description: original.description,
      maxOccupancy: original.maxOccupancy,
      basePrice: original.basePrice,
      numberOfRooms: original.numberOfRooms,
      bedType: original.bedType,
      areaSqm: original.areaSqm
    };

    // Create new request object with the new data
    const newReq = {
      ...req,
      body: newRoomTypeData
    };

    // Call the createRoomType controller
    await roomTypeController.createRoomType(newReq, res);
  })
);

// Room Type Bookings
router.get('/:id/bookings',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'hotel_owner']),
  roomTypeMiddlewares.validateRoomTypeId,
  roomTypeMiddlewares.checkRoomTypeExists,
  roomTypeMiddlewares.asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Booking statistics endpoint - to be implemented when Booking model is ready',
      roomTypeId: req.roomTypeId,
      roomType: req.roomType
    });
  })
);

// Status Update
router.put('/:id/status',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'hotel_owner']),
  roomTypeMiddlewares.validateRoomTypeId,
  roomTypeMiddlewares.checkRoomTypeExists,
  roomTypeMiddlewares.asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "active" or "inactive"'
      });
    }

    // TODO: Cập nhật trạng thái trong DB
    return res.status(200).json({
      success: true,
      message: `Room type status updated to ${status}`,
      roomTypeId: req.roomTypeId,
      status: status
    });
  })
);

// ======= Error Middleware =======

router.use((error, req, res, next) => {
  console.error('Room Type Route Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.message
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;
