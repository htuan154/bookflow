// src/validators/seasonalPricing.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi tạo một quy tắc giá mới.
 */
const createPricingSchema = Joi.object({
    room_type_id: Joi.string().uuid().required(),
    season_id: Joi.number().integer().allow(null), // Có thể không thuộc mùa nào cụ thể
    name: Joi.string().min(3).max(255).required(),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
    price_modifier: Joi.number().required().messages({
        'number.base': 'Price modifier must be a number (e.g., 1.2 for 20% increase, 0.9 for 10% decrease).'
    })
});

/**
 * Schema để kiểm tra dữ liệu khi cập nhật một quy tắc giá.
 */
const updatePricingSchema = Joi.object({
    name: Joi.string().min(3).max(255),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
    price_modifier: Joi.number()
}).min(1); // Yêu cầu có ít nhất một trường để cập nhật

/**
 * Schema để kiểm tra dữ liệu khi tạo bulk seasonal pricing cho một room type với tất cả seasons của một năm.
 */
const bulkCreatePricingSchema = Joi.object({
    room_type_id: Joi.string().uuid().required(),
    year: Joi.number().integer().min(2020).required(),
    price_modifier: Joi.number().required().messages({
        'number.base': 'Price modifier must be a number (e.g., 1.2 for 20% increase, 0.9 for 10% decrease).'
    })
});

module.exports = {
    createPricingSchema,
    updatePricingSchema,
    bulkCreatePricingSchema,
};
