// src/validators/reviewImage.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi tải ảnh cho một đánh giá.
 */
const uploadReviewImagesSchema = Joi.object({
    image_urls: Joi.array().items(Joi.string().uri()).min(1).required().messages({
        'array.base': 'image_urls phải là một mảng.',
        'array.min': 'Cần ít nhất một đường dẫn ảnh.',
        'any.required': 'Trường image_urls là bắt buộc.',
        'string.uri': 'Mỗi phần tử trong image_urls phải là một URI hợp lệ.'
    }),
});

module.exports = {
    uploadReviewImagesSchema,
};
