// src/validators/hotelAmenity.validator.js

const Joi = require('joi');

const addAmenitySchema = Joi.object({
    amenity_id: Joi.string().uuid().required(),
});

module.exports = {
    addAmenitySchema,
};