// src/api/v1/routes/season.route.js

const express = require('express');
const seasonController = require('../controllers/season.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createSeasonSchema, updateSeasonSchema } = require('../../../validators/season.validator');

const router = express.Router();


// --- PUBLIC ROUTE ---
// GET /api/v1/seasons -> Lấy tất cả các mùa
router.get('/', seasonController.getAllSeasons);

// GET /api/v1/seasons/year/:year -> Lấy các mùa theo năm
router.get('/year/:year', seasonController.getSeasonsByYear);

// --- ADMIN-ONLY ROUTES ---
// Các route dưới đây yêu cầu phải đăng nhập với vai trò 'admin'
router.use(authenticate, authorize(['admin']));

// POST /api/v1/seasons -> Tạo một mùa mới
router.post('/', validate(createSeasonSchema), seasonController.createSeason);

// PUT /api/v1/seasons/:id -> Cập nhật một mùa
router.put('/:id', validate(updateSeasonSchema), seasonController.updateSeason);

// DELETE /api/v1/seasons/:id -> Xóa một mùa
router.delete('/:id', seasonController.deleteSeason);

module.exports = router;
