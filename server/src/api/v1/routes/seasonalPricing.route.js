// src/api/v1/routes/seasonalPricing.route.js

const express = require('express');
const seasonalPricingController = require('../controllers/seasonalPricing.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createPricingSchema, updatePricingSchema, bulkCreatePricingSchema } = require('../../../validators/seasonalPricing.validator');

const router = express.Router();


// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
//router.use(authenticate, authorize(['hotel_owner', 'admin']));
router.use(authenticate);

// POST /api/v1/seasonal-pricings -> Tạo một quy tắc giá mới
router.post(
    '/',
    validate(createPricingSchema),
    seasonalPricingController.createSeasonalPricing
);

// POST /api/v1/seasonal-pricings/bulk -> Tạo bulk seasonal pricing cho một room type với tất cả seasons của một năm
router.post(
    '/bulk',
    validate(bulkCreatePricingSchema),
    seasonalPricingController.bulkCreateSeasonalPricing
);

// GET /api/v1/seasonal-pricings/available/:roomTypeId -> Lấy các seasons chưa có pricing cho room type
router.get(
    '/available/:roomTypeId',
    seasonalPricingController.getAvailableSeasonsForRoomType
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
router.get(
    '/:roomTypeId',
    seasonalPricingController.getPricingsForRoomType
);

// Gắn router này vào một router khác (trong hotel.route.js hoặc roomType.route.js)
// Ví dụ: roomTypeRouter.use('/:roomTypeId/seasonal-pricings', router);

module.exports = router;
