// src/validators/blogImage.validator.js

const Joi = require('joi');

const imageObjectSchema = Joi.object({
    image_url: Joi.string().uri().required(),
    caption: Joi.string().allow('').max(500),
    order_index: Joi.number().integer().default(0),
});

const uploadBlogImagesSchema = Joi.object({
    images: Joi.array().items(imageObjectSchema).min(1).required(),
});

module.exports = {
    uploadBlogImagesSchema,
};