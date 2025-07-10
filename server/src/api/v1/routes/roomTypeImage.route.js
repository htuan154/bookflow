// src/api/v1/routes/roomTypeImage.route.js

const express = require('express');
const roomTypeImageController = require('../controllers/roomTypeImage.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { uploadImagesSchema } = require('../../../validators/roomTypeImage.validator');

const router = express.Router();

// ROUTE GROUP 1: Actions on a collection of images for a room type

router.get('/room-types/:roomTypeId/images', roomTypeImageController.getImages);

router.post(
    '/room-types/:roomTypeId/images',
    authenticate,
    authorize(['hotel_owner', 'admin']),
    validate(uploadImagesSchema),
    roomTypeImageController.uploadImages
);

// ROUTE GROUP 2: Actions on a single image

router.delete(
    '/room-type-images/:imageId',
    authenticate,
    authorize(['hotel_owner', 'admin']),
    roomTypeImageController.deleteImage
);

router.patch(
    '/room-type-images/:imageId/set-thumbnail',
    authenticate,
    authorize(['hotel_owner', 'admin']),
    roomTypeImageController.setThumbnail
);

module.exports = router;
