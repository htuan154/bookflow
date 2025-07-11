// src/validators/promotion.validator.js

const Joi = require('joi');

const createPromotionSchema = Joi.object({
    hotel_id: Joi.string().uuid().allow(null), // Có thể là khuyến mãi chung
    code: Joi.string().alphanum().uppercase().min(3).max(20).required(),
    name: Joi.string().min(5).max(255).required(),
    description: Joi.string().allow(''),
    discount_value: Joi.number().positive().required(),
    min_booking_price: Joi.number().positive().allow(null),
    valid_from: Joi.date().iso().required(),
    valid_until: Joi.date().iso().greater(Joi.ref('valid_from')).required(),
    usage_limit: Joi.number().integer().min(1).allow(null),
});

const validateCodeSchema = Joi.object({
    code: Joi.string().required(),
    bookingTotal: Joi.number().positive().required(),
});

module.exports = {
    createPromotionSchema,
    validateCodeSchema,
};