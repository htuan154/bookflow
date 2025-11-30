// src/validators/blog.validator.js

const Joi = require('joi');

const createBlogSchema = Joi.object({
    title: Joi.string().min(10).max(500).required(),
    content: Joi.string().min(50).required(),
    hotel_id: Joi.string().uuid().allow(null),
    excerpt: Joi.string().allow('').max(1000),
    featured_image_url: Joi.string().uri().allow(''),
    tags: Joi.string().allow(''),
});

const updateBlogSchema = Joi.object({
    title: Joi.string().min(10).max(500),
    content: Joi.string().min(50),
    hotel_id: Joi.string().uuid().allow(null),
    excerpt: Joi.string().allow('').max(1000),
    featured_image_url: Joi.string().uri().allow(null),
    tags: Joi.string().allow(''),
    status: Joi.string().valid('draft', 'pending', 'published', 'archived', 'rejected'),
}).min(1);

module.exports = {
    createBlogSchema,
    updateBlogSchema,
};