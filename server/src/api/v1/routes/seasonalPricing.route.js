// src/api/v1/routes/seasonalPricing.route.js

const express = require('express');
const seasonalPricingController = require('../controllers/seasonalPricing.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createPricingSchema, updatePricingSchema } = require('../../../validators/seasonalPricing.validator');

const router = express.Router();


// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate, authorize(['hotel_owner', 'admin']));

// POST /api/v1/seasonal-pricings -> Tạo một quy tắc giá mới
router.post(
    '/',
    validate(createPricingSchema),
    seasonalPricingController.createSeasonalPricing
);

// PUT /api/v1/seasonal-pricings/:pricingId -> Cập nhật một quy tắc giá
router.put(
    '/:pricingId',
    validate(updatePricingSchema),
    seasonalPricingController.updateSeasonalPricing
);

// DELETE /api/v1/seasonal-pricings/:pricingId -> Xóa một quy tắc giá
router.delete(
    '/:pricingId',
    seasonalPricingController.deleteSeasonalPricing
);

// --- Route riêng để lấy tất cả quy tắc giá của một loại phòng ---
// GET /api/v1/room-types/:roomTypeId/seasonal-pricings
const roomTypeRouter = express.Router({ mergeParams: true });
roomTypeRouter.get('/', seasonalPricingController.getPricingsForRoomType);

// Gắn router này vào một router khác (trong hotel.route.js hoặc roomType.route.js)
// Ví dụ: roomTypeRouter.use('/:roomTypeId/seasonal-pricings', router);

module.exports = router;
