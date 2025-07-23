// src/validators/promotionDetail.validator.js

const Joi = require('joi');

const detailObjectSchema = Joi.object({
    room_type_id: Joi.string().uuid().required(),
    discount_type: Joi.string().valid('percentage', 'fixed_amount').required(),
    discount_value: Joi.number().positive().required(),
});

const createPromotionDetailsSchema = Joi.object({
    details: Joi.array().items(detailObjectSchema).min(1).required(),
});

module.exports = {
    createPromotionDetailsSchema,
};