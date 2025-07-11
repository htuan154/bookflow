// src/validators/foodRecommendation.validator.js

const Joi = require('joi');

const createFoodSchema = Joi.object({
    location_id: Joi.string().uuid().allow(null),
    name: Joi.string().min(3).max(255).required(),
    description: Joi.string().allow(''),
    image_url: Joi.string().uri().allow(''),
});

const updateFoodSchema = Joi.object({
    name: Joi.string().min(3).max(255),
    description: Joi.string().allow(''),
    image_url: Joi.string().uri().allow(''),
}).min(1);

module.exports = {
    createFoodSchema,
    updateFoodSchema,
};