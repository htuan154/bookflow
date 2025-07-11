// src/validators/touristLocation.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi tạo một địa điểm du lịch mới.
 */
const createLocationSchema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    description: Joi.string().allow(''),
    city: Joi.string().min(2).required(),
    image_url: Joi.string().uri().allow(''),
});

/**
 * Schema để kiểm tra dữ liệu khi cập nhật một địa điểm du lịch.
 */
const updateLocationSchema = Joi.object({
    name: Joi.string().min(3).max(255),
    description: Joi.string().allow(''),
    city: Joi.string().min(2),
    image_url: Joi.string().uri().allow(''),
}).min(1); // Yêu cầu có ít nhất một trường để cập nhật

module.exports = {
    createLocationSchema,
    updateLocationSchema,
};
