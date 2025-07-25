// src/api/v1/routes/admin.routes.js
const express = require('express');
const hotelController = require('../controllers/hotel.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

const router = express.Router();

// Tất cả các route trong file này đều yêu cầu xác thực và quyền admin
router.use(authenticate);
router.use(isAdmin);

// Định nghĩa các route cho việc quản lý khách sạn của admin
router.get('/hotels/statistics', hotelController.getHotelStatistics);
router.get('/hotels/all', hotelController.getAllHotelsAdmin);
router.get('/hotels/pending', hotelController.getPendingHotels);
router.patch('/hotels/:id/status', hotelController.updateHotelStatus);
router.get('/hotels/status/:status', hotelController.getHotelsByStatus);
router.post('/hotels/:id/approve', hotelController.approveHotel);
router.post('/hotels/:id/reject', hotelController.rejectHotel);
router.post('/hotels/:id/restore', hotelController.restoreHotel);


module.exports = router;