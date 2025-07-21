// src/validators/bookingDetail.validator.js

const Joi = require('joi');

const addBookingDetailsSchema = Joi.object({
    room_details: Joi.array().items(
        Joi.object({
            room_type_id: Joi.string().uuid().required().messages({
                'string.guid': 'room_type_id must be a valid UUID',
                'any.required': 'room_type_id is required'
            }),
            quantity: Joi.number().integer().min(1).required().messages({
                'number.base': 'quantity must be a number',
                'number.integer': 'quantity must be an integer',
                'number.min': 'quantity must be at least 1',
                'any.required': 'quantity is required'
            }),
            unit_price: Joi.number().precision(2).positive().required().messages({
                'number.base': 'unit_price must be a number',
                'number.positive': 'unit_price must be a positive number',
                'number.precision': 'unit_price can have at most 2 decimal places',
                'any.required': 'unit_price is required'
            }),
            subtotal: Joi.number().precision(2).positive().required().messages({
                'number.base': 'subtotal must be a number',
                'number.positive': 'subtotal must be a positive number',
                'number.precision': 'subtotal can have at most 2 decimal places',
                'any.required': 'subtotal is required'
            }),
            guests_per_room: Joi.number().integer().min(1).default(1).messages({
                'number.base': 'guests_per_room must be a number',
                'number.integer': 'guests_per_room must be an integer',
                'number.min': 'guests_per_room must be at least 1'
            })
        })
    ).min(1).required().messages({
        'array.min': 'At least one room detail is required',
        'any.required': 'room_details is required'
    })
});

module.exports = {
    addBookingDetailsSchema
};