// src/api/v1/routes/roomTypeImage.route.js

const express = require('express');
const RoomTypeImageController = require('../controllers/roomTypeImage.controller');
// Cập nhật để import authenticate và authorize
const { authenticate, authorize } = require('../middlewares/auth.middleware'); 
const { validate } = require('../middlewares/validation.middleware');
const { uploadImagesSchema } = require('../../../validators/roomTypeImage.validator');

const router = express.Router();
const roomTypeImageController = new RoomTypeImageController();

// ===============================================
// PUBLIC ROUTE
// ===============================================

// GET /api/v1/room-types/:roomTypeId/images -> Lấy tất cả hình ảnh của một loại phòng
router.get('/room-types/:roomTypeId/images', roomTypeImageController.getImages);


// ===============================================
// PROTECTED ROUTES (Yêu cầu đăng nhập và có quyền)
// ===============================================

// POST /api/v1/room-types/:roomTypeId/images -> Tải lên hình ảnh mới
// Yêu cầu: Đã đăng nhập VÀ là 'hotel_owner' hoặc 'admin'
router.post(
    '/room-types/:roomTypeId/images', 
    authenticate, 
    authorize(['hotel_owner']),
    validate(uploadImagesSchema), 
    roomTypeImageController.uploadImages
);

// DELETE /api/v1/room-type-images/:imageId -> Xóa một hình ảnh
// Yêu cầu: Đã đăng nhập VÀ là 'hotel_owner' hoặc 'admin'
router.delete(
    '/room-type-images/:imageId', 
    authenticate, 
    authorize(['hotel_owner']), 
    roomTypeImageController.deleteImage
);

// PATCH /api/v1/room-type-images/:imageId/set-thumbnail -> Đặt làm ảnh đại diện
// Yêu cầu: Đã đăng nhập VÀ là 'hotel_owner' hoặc 'admin'
router.patch(
    '/room-type-images/:imageId/set-thumbnail', 
    authenticate, 
    authorize(['hotel_owner']), 
    roomTypeImageController.setThumbnail
);


module.exports = router;
