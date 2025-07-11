// src/validators/blogComment.validator.js

const Joi = require('joi');

const createCommentSchema = Joi.object({
    content: Joi.string().min(1).max(2000).required(),
    parent_comment_id: Joi.string().uuid().allow(null),
});

module.exports = {
    createCommentSchema,
};