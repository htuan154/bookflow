// src/validators/promotion.validator.js

const Joi = require('joi');

const createPromotionSchema = Joi.object({
    hotel_id: Joi.string().uuid().allow(null),
    code: Joi.string().alphanum().uppercase().min(3).max(20).required(),
    name: Joi.string().min(5).max(255).required(),
    description: Joi.string().allow(''),
    discount_value: Joi.number().positive().max(999.99).required(), // ✅ Add max constraint
    min_booking_price: Joi.number().positive().max(99999999.99).allow(null), // ✅ Add max constraint
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

module.exports = {
    createPromotionSchema,
    validateCodeSchema,
};