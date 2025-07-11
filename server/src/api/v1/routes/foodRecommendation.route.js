// src/api/v1/routes/foodRecommendation.route.js

const express = require('express');
const foodRecommendationController = require('../controllers/foodRecommendation.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createFoodSchema, updateFoodSchema } = require('../../../validators/foodRecommendation.validator');

const router = express.Router();


// --- PUBLIC ROUTE ---
// GET /api/v1/tourist-locations/:locationId/food-recommendations -> Lấy gợi ý món ăn của một địa điểm
// Route này sẽ được lồng vào touristLocation.route.js
router.get('/tourist-locations/:locationId/food-recommendations', foodRecommendationController.getRecommendationsByLocation);


// --- ADMIN-ONLY ROUTES ---

// POST /api/v1/food-recommendations -> Tạo gợi ý mới
router.post(
    '/',
    authenticate,
    authorize(['admin']),
    validate(createFoodSchema),
    foodRecommendationController.createFoodRecommendation
);

// PUT /api/v1/food-recommendations/:id -> Cập nhật gợi ý
router.put(
    '/:id',
    authenticate,
    authorize(['admin']),
    validate(updateFoodSchema),
    foodRecommendationController.updateFoodRecommendation
);

// DELETE /api/v1/food-recommendations/:id -> Xóa gợi ý
router.delete(
    '/:id',
    authenticate,
    authorize(['admin']),
    foodRecommendationController.deleteFoodRecommendation
);

module.exports = router;
