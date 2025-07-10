const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomType.controller');
const roomTypeMiddlewares = require('../middlewares/roomType.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Apply logging middleware
if (roomTypeMiddlewares.logRequest) {
  router.use(roomTypeMiddlewares.logRequest);
}

// ======= Public Routes =======

router.get('/', roomTypeController.getAllRoomTypes);

router.get('/paginated',
  roomTypeMiddlewares.validatePagination,
  roomTypeController.getRoomTypesWithPagination
);

router.get('/search',
  roomTypeMiddlewares.rateLimitSearch,
  roomTypeMiddlewares.validateSearch,
  roomTypeController.searchRoomTypes
);

router.get('/stats', roomTypeController.getRoomTypeStats);

router.get('/available',
  roomTypeMiddlewares.validateAvailabilityCheck,
  roomTypeController.getAvailableRoomTypes
);

router.get('/hotel/:hotelId',
  roomTypeMiddlewares.validateHotelId,
  roomTypeMiddlewares.checkHotelExists,
  roomTypeController.getRoomTypesByHotelId
);

router.get('/:id',
  roomTypeMiddlewares.validateRoomTypeId,
  roomTypeController.getRoomTypeById
);

router.get('/:id/rooms',
  roomTypeMiddlewares.validateRoomTypeId,
  roomTypeMiddlewares.checkRoomTypeExists,
  roomTypeMiddlewares.asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Room listing endpoint - to be implemented when Room model is ready',
      roomTypeId: req.roomTypeId,
      roomType: req.roomType
    });
  })
);

// ======= authenticateed Routes =======

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

// // Bulk Update
// router.put('/bulk',
//   authMiddleware.authenticate,
//   authMiddleware.authorize(['admin']),
//   roomTypeMiddlewares.validateBulkUpdate,
//   roomTypeController.bulkUpdateRoomTypes
// );

// // Bulk Delete
// router.delete('/bulk',
//   authMiddleware.authenticate,
//   authMiddleware.authorize(['admin']),
//   roomTypeMiddlewares.validateBulkDelete,
//   roomTypeController.bulkDeleteRoomTypes
// );

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