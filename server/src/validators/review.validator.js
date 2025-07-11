// src/validators/review.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi tạo một đánh giá mới.
 */
const createReviewSchema = Joi.object({
    booking_id: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().allow('').max(2000),
    cleanliness_rating: Joi.number().integer().min(1).max(5),
    comfort_rating: Joi.number().integer().min(1).max(5),
    service_rating: Joi.number().integer().min(1).max(5),
    location_rating: Joi.number().integer().min(1).max(5),
    value_rating: Joi.number().integer().min(1).max(5),
});

module.exports = {
    createReviewSchema,
};
