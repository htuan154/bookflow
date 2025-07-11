// src/validators/hotelStaff.validator.js

const Joi = require('joi');

const addStaffSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    job_position: Joi.string().min(3).max(100).required(),
    start_date: Joi.date().iso().required(),
    contact: Joi.string().allow(''),
});

const updateStaffSchema = Joi.object({
    job_position: Joi.string().min(3).max(100),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'terminated'),
    contact: Joi.string().allow(''),
    end_date: Joi.date().iso().allow(null),
}).min(1);

module.exports = {
    addStaffSchema,
    updateStaffSchema,
};