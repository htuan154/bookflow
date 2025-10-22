// src/validators/season.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi tạo một mùa mới.
 */
const createSeasonSchema = Joi.object({
    name: Joi.string().min(3).max(255).required().messages({
        'string.base': `"Tên mùa" phải là một chuỗi ký tự`,
        'string.empty': `"Tên mùa" không được để trống`,
        'string.min': `"Tên mùa" phải có ít nhất {#limit} ký tự`,
        'any.required': `"Tên mùa" là trường bắt buộc`
    }),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
    year: Joi.number().integer().min(2020).required(),
    description: Joi.string().allow('').max(1000)
});

/**
 * Schema để kiểm tra dữ liệu khi cập nhật một mùa.
 */
const updateSeasonSchema = Joi.object({
    name: Joi.string().min(3).max(255),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
    year: Joi.number().integer().min(2020),
    description: Joi.string().allow('').max(1000)
}).min(1); // Yêu cầu có ít nhất một trường để cập nhật

module.exports = {
    createSeasonSchema,
    updateSeasonSchema,
};
