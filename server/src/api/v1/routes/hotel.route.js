// src/api/v1/routes/hotel.routes.js (SỬA: thêm 's' vào routes)
const express = require('express');
const hotelController = require('../controllers/hotel.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const hotelAmenityRoutes = require('./hotelAmenity.route'); // Kiểm tra file này có tồn tại không
// Import với error handling
let isAdmin;
try {
  isAdmin = require('../middlewares/admin.middleware').isAdmin;
} catch (error) {
  console.warn('Admin middleware not found, using fallback');
  isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Cần quyền admin để truy cập'
      });
    }
  };
}
// Import validator với error handling
let validate, validateHotelData, validateHotelUpdate;
try {
  validate = require('../middlewares/validator.middleware').validate;
  const hotelValidators = require('../../../validators/hotel.validator');
  validateHotelData = hotelValidators.validateHotelData;
  validateHotelUpdate = hotelValidators.validateHotelUpdate;
} catch (error) {
  console.warn('Validator middleware not found, using fallback');
  validate = (schema) => (req, res, next) => next(); // Fallback - no validation
  validateHotelData = {};
  validateHotelUpdate = {};
}
const router = express.Router();

// Debug middleware để track requests
router.use((req, res, next) => {
  console.log(`📍 Hotel Route: ${req.method} ${req.originalUrl}`);
  next();
});

// ===============================================
// SPECIFIC ROUTES FIRST - CRITICAL ORDER
// ===============================================

// Public routes WITHOUT params first
router.get('/search', hotelController.searchHotels);
router.get('/search/location', hotelController.getHotelsByCityAndWard);
router.post('/search/availability', hotelController.searchAvailableRoomsPost); // Thêm POST
router.get('/count/location', hotelController.countHotelsByCityAndWard);
router.get('/popular', hotelController.getPopularHotels);

// Authenticated specific routes BEFORE /:id
router.get('/my-hotels/dropdown', authenticate, hotelController.getApprovedHotelsDropdown);
router.get('/my-hotels', authenticate, hotelController.getMyHotels);

// ===============================================
// ADMIN ROUTES
// ===============================================
const adminRouter = express.Router();
adminRouter.use(authenticate);
adminRouter.use(isAdmin);

adminRouter.get('/all', hotelController.getAllHotelsAdmin);
adminRouter.get('/pending', hotelController.getPendingHotels);
adminRouter.get('/statistics', hotelController.getHotelStatistics);
adminRouter.get('/status/:status', hotelController.getHotelsByStatus);
adminRouter.patch('/:id/status', hotelController.updateHotelStatus);

router.use('/admin', adminRouter);

// ===============================================
// PARAMETERIZED ROUTES - MUST BE LAST
// ===============================================

// Owner routes
router.get('/owner/:ownerId', authenticate, hotelController.getHotelsByOwner);

// These MUST be at the very end
router.get('/', hotelController.getAllHotels);
router.get('/:id', hotelController.getHotelById);

// ===============================================
// CRUD OPERATIONS
// ===============================================
router.post('/', authenticate, validate(validateHotelData), hotelController.createHotel);
router.put('/:id', authenticate, validate(validateHotelUpdate), hotelController.updateHotel);
router.delete('/:id', authenticate, hotelController.deleteHotel);

// ===============================================
// SUB ROUTES
// ===============================================
router.use('/:hotelId/amenities', hotelAmenityRoutes);
module.exports = router;