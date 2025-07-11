// src/validators/hotelImage.validator.js

const Joi = require('joi');

const imageObjectSchema = Joi.object({
    image_url: Joi.string().uri().required(),
    caption: Joi.string().allow('').max(255),
    is_thumbnail: Joi.boolean().default(false),
});

const uploadHotelImagesSchema = Joi.object({
    images: Joi.array().items(imageObjectSchema).min(1).required(),
});

module.exports = {
    uploadHotelImagesSchema,
};