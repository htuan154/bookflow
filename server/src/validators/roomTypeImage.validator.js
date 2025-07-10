// src/validators/roomTypeImage.validator.js
const Joi = require('joi');

/**
 * Schema kiểm tra cho **một đối tượng hình ảnh**
 */
const imageObjectSchema = Joi.object({
    image_url: Joi.string().uri().required().messages({
        'string.uri': 'Đường dẫn hình ảnh phải là một URI hợp lệ.',
        'any.required': 'Đường dẫn hình ảnh là bắt buộc.',
    }),
    caption: Joi.string().allow('').max(255), 
    is_thumbnail: Joi.boolean().default(false), 
});

/**
 * Schema kiểm tra cho **request body** khi upload nhiều hình ảnh
 */
const uploadImagesSchema = Joi.object({
    images: Joi.array().items(imageObjectSchema).min(1).required().messages({
        'array.base': 'Trường images phải là một mảng.',
        'array.min': 'Cần ít nhất một hình ảnh.',
        'any.required': 'Mảng hình ảnh là bắt buộc.',
    }),
});

module.exports = {
    uploadImagesSchema,
};
