// src/api/v1/middlewares/validator.middleware.js

const Joi = require('joi');

// Định nghĩa một hàm middleware chung để validate
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    // Nếu có lỗi, trả về lỗi 400 với chi tiết
    return res.status(400).json({
      message: 'Input validation error',
      details: error.details.map((detail) => detail.message),
    });
  }

  next(); // Không có lỗi, cho đi tiếp
};

// Định nghĩa các schema để kiểm tra dữ liệu cho từng route
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
};