// src/api/v1/middlewares/validation.middleware.js
const { AppError } = require('../../../utils/errors');

/**
 * Một middleware factory để tạo ra các hàm validate dựa trên schema của Joi.
 * Middleware này sẽ kiểm tra req.body.
 * @param {Joi.Schema} schema - Schema của Joi để validate.
 * @returns {Function} - Middleware của Express.
 */
const validate = (schema) => async (req, res, next) => {
try {
    // Validate req.body với schema được cung cấp
    await schema.validateAsync(req.body, {
      abortEarly: false, // Báo cáo tất cả các lỗi cùng lúc, không dừng lại ở lỗi đầu tiên
      stripUnknown: true, // Tự động loại bỏ các trường không được định nghĩa trong schema
    });
    next(); // Nếu không có lỗi, cho phép đi tiếp
} catch (error) {
    // Nếu có lỗi validation từ Joi, tạo một tin nhắn lỗi rõ ràng và chuyển cho error handler
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    next(new AppError(errorMessage, 400)); // 400 Bad Request
}
};

module.exports = { validate };
