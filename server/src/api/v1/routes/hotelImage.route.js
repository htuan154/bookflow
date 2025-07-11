
const express = require('express');
const hotelImageController = require('../controllers/hotelImage.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { uploadHotelImagesSchema } = require('../../../validators/hotelImage.validator');

const router = express.Router();


// --- Áp dụng middleware xác thực cho tất cả các route ---
router.use(authenticate);

// POST /api/v1/hotels/:hotelId/images -> Thêm ảnh vào khách sạn
router.post(
    '/hotels/:hotelId/images',
    authorize(['hotel_owner', 'admin']),
    validate(uploadHotelImagesSchema),
    hotelImageController.uploadImages
);

// DELETE /api/v1/hotel-images/:imageId -> Xóa một ảnh
router.delete(
    '/hotel-images/:imageId',
    authorize(['hotel_owner', 'admin']),
    hotelImageController.deleteImage
);

// PATCH /api/v1/hotel-images/:imageId/set-thumbnail -> Đặt làm ảnh đại diện
router.patch(
    '/hotel-images/:imageId/set-thumbnail',
    authorize(['hotel_owner', 'admin']),
    hotelImageController.setThumbnail
);

module.exports = router;