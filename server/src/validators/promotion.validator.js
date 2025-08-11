// src/validators/promotion.validator.js

const Joi = require('joi');

const createPromotionSchema = Joi.object({
    hotel_id: Joi.string().uuid().allow(null),
    code: Joi.string().alphanum().uppercase().min(3).max(20).required(),
    name: Joi.string().min(5).max(255).required(),
    description: Joi.string().allow(''),
    discount_value: Joi.number().positive().max(999.99).required(), // ✅ Add max constraint
    min_booking_price: Joi.number().positive().max(99999999.99).allow(null), // ✅ Add max constraint
    max_discount_amount: Joi.number().min(0).max(99999999.99).allow(null), // ✅ thêm
    valid_from: Joi.date().iso().required(),
    valid_until: Joi.date().iso().greater(Joi.ref('valid_from')).required(),
    usage_limit: Joi.number().integer().min(1).max(2147483647).allow(null), // ✅ Add max constraint
    
    // ✅ FIX: Add enum validation for promotion_type
    promotion_type: Joi.string().valid('general', 'room_specific').required(),
    
    // ✅ ADD: Missing status field validation  
    status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'inactive').default('active'),
});

const validateCodeSchema = Joi.object({
    code: Joi.string().required(),
    bookingTotal: Joi.number().positive().required(),
});

const updatePromotionSchema = Joi.object({
    hotel_id: Joi.string().uuid().allow(null),
    code: Joi.string().alphanum().uppercase().min(3).max(20),
    name: Joi.string().min(5).max(255),
    description: Joi.string().allow(''),
    discount_value: Joi.number().positive().max(999.99),
    min_booking_price: Joi.number().positive().max(99999999.99).allow(null),
    max_discount_amount: Joi.number().min(0).max(99999999.99).allow(null),
    valid_from: Joi.date().iso(),
    valid_until: Joi.date().iso().greater(Joi.ref('valid_from')),
    usage_limit: Joi.number().integer().min(1).max(2147483647).allow(null),
    promotion_type: Joi.string().valid('general', 'room_specific'),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'inactive')
}).min(1); // phải có ít nhất 1 trường để update


module.exports = {
    createPromotionSchema,
    validateCodeSchema,
    updatePromotionSchema,
};