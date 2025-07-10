// src/validators/contract.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi tạo một hợp đồng mới.
 */
const createContractSchema = Joi.object({
    hotel_id: Joi.string().uuid().required(),
    contract_type: Joi.string().required(),
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().allow(''),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().greater(Joi.ref('start_date')).allow(null),
    signed_date: Joi.date().iso().allow(null),
    contract_value: Joi.number().positive().allow(null),
    currency: Joi.string().default('VND'),
    payment_terms: Joi.string().allow(''),
    contract_file_url: Joi.string().uri().allow(''),
    terms_and_conditions: Joi.string().allow(''),
    notes: Joi.string().allow('')
});

/**
 * Schema để kiểm tra dữ liệu khi cập nhật trạng thái hợp đồng.
 */
const updateStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'active', 'expired', 'terminated', 'cancelled').required()
});

module.exports = {
    createContractSchema,
    updateStatusSchema,
};
