// src/api/v1/routes/hotel.route.js
const express = require('express');
const hotelController = require('../controllers/hotel.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const hotelAmenityRoutes = require('./hotelAmenity.route');
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
// ===============================================
// PUBLIC ROUTES
// ===============================================
router.get('/', hotelController.getAllHotels);
router.get('/search', hotelController.searchHotels);
router.get('/search/location', hotelController.getHotelsByCityAndWard);
router.post('/search/availability', hotelController.searchAvailableRoomsPost); // Thêm POST
router.get('/count/location', hotelController.countHotelsByCityAndWard);
router.get('/popular', hotelController.getPopularHotels);
// ===============================================
// AUTHENTICATED ROUTES (Đặt trước /:id)
// ===============================================
router.get('/my-hotels', authenticate, hotelController.getMyHotels);
// ===============================================
// PUBLIC ROUTES (với params - đặt sau)
// ===============================================
router.get('/owner/:ownerId', authenticate, hotelController.getHotelsByOwner);
router.get('/:id', hotelController.getHotelById);
// ===============================================
// HOTEL OWNER ROUTES (Yêu cầu đăng nhập)
// ===============================================
router.post('/', authenticate, validate(validateHotelData), hotelController.createHotel);
router.put('/:id', authenticate, validate(validateHotelUpdate), hotelController.updateHotel);
router.delete('/:id', authenticate, hotelController.deleteHotel);
// ===============================================
// ADMIN ROUTES
// ===============================================
const adminRouter = express.Router();
adminRouter.use(authenticate); // Admin routes need authentication
adminRouter.use(isAdmin);
adminRouter.get('/all', hotelController.getAllHotelsAdmin);
adminRouter.get('/pending', hotelController.getPendingHotels);
adminRouter.get('/statistics', hotelController.getHotelStatistics);
adminRouter.patch('/:id/status', hotelController.updateHotelStatus);
adminRouter.get('/status/:status', hotelController.getHotelsByStatus);
router.use('/admin', adminRouter);
router.use('/:hotelId/amenities', hotelAmenityRoutes);
module.exports = router;