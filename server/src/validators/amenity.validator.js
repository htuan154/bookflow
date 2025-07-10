// src/validators/amenity.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi tạo một tiện nghi mới.
 */
const createAmenitySchema = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
        'string.base': `"Tên tiện nghi" phải là một chuỗi ký tự`,
        'string.empty': `"Tên tiện nghi" không được để trống`,
        'string.min': `"Tên tiện nghi" phải có ít nhất {#limit} ký tự`,
        'any.required': `"Tên tiện nghi" là trường bắt buộc`
    }),
    description: Joi.string().allow('').max(500),
    icon_url: Joi.string().uri().allow('').messages({
        'string.uri': 'Icon URL phải là một đường dẫn hợp lệ'
    })
});

/**
 * Schema để kiểm tra dữ liệu khi cập nhật một tiện nghi.
 */
const updateAmenitySchema = Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().allow('').max(500),
    icon_url: Joi.string().uri().allow('')
});

module.exports = {
    createAmenitySchema,
    updateAmenitySchema,
};
