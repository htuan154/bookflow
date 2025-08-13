const Joi = require('joi');
const { validationResult } = require('express-validator');

/**
 * Middleware để validate dữ liệu request với Joi schema
 * @param {Object} schema - Joi schema
 * @returns {Function} Middleware function
 */
const validateWithJoi = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Input validation error',
      errors: error.details.map((detail) => detail.message),
    });
  }

  next(); 
};

/**
 * Middleware để validate dữ liệu request với express-validator
 * @param {Array} validationRules - Mảng các rule validation
 * @returns {Function} Middleware function
 */
const validate = (validationRules = []) => {
  return async (req, res, next) => {
    try {
      // Kiểm tra đầu vào
      if (!Array.isArray(validationRules)) {
        throw new Error('Validation rules phải là một mảng');
      }

      // Chạy tất cả các validation rules
      for (let validation of validationRules) {
        if (typeof validation.run === 'function') {
          await validation.run(req);
        }
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
          }))
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi trong middleware validate',
        error: err.message
      });
    }
  };
};


// Joi Schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().optional(),
});

const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Email or username is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

/**
 * Middleware để validate ID parameters
 */
const validateId = (req, res, next) => {
  const { id } = req.params;
  
  // Kiểm tra ID có phải là UUID không
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID không hợp lệ'
    });
  }
  
  next();
};

/**
 * Middleware để validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  // Validate page
  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Trang phải là số nguyên dương'
    });
  }
  
  // Validate limit
  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Limit phải là số nguyên từ 1 đến 100'
    });
  }
  
  next();
};

/**
 * Middleware để validate search parameters
 */
const validateSearch = (req, res, next) => {
  const { q, city, minRating, maxRating, priceRange } = req.query;
  
  // Validate search query
  if (q && (typeof q !== 'string' || q.length < 2)) {
    return res.status(400).json({
      success: false,
      message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
    });
  }
  
  // Validate city
  if (city && (typeof city !== 'string' || city.length < 2)) {
    return res.status(400).json({
      success: false,
      message: 'Tên thành phố phải có ít nhất 2 ký tự'
    });
  }
  
  // Validate rating
  if (minRating && (!Number.isInteger(Number(minRating)) || Number(minRating) < 1 || Number(minRating) > 5)) {
    return res.status(400).json({
      success: false,
      message: 'Đánh giá tối thiểu phải từ 1 đến 5'
    });
  }
  
  if (maxRating && (!Number.isInteger(Number(maxRating)) || Number(maxRating) < 1 || Number(maxRating) > 5)) {
    return res.status(400).json({
      success: false,
      message: 'Đánh giá tối đa phải từ 1 đến 5'
    });
  }
  
  if (minRating && maxRating && Number(minRating) > Number(maxRating)) {
    return res.status(400).json({
      success: false,
      message: 'Đánh giá tối thiểu không thể lớn hơn đánh giá tối đa'
    });
  }
  
  // Validate price range
  if (priceRange && !['budget', 'mid-range', 'luxury'].includes(priceRange)) {
    return res.status(400).json({
      success: false,
      message: 'Khoảng giá phải là: budget, mid-range, hoặc luxury'
    });
  }
  
  next();
};

/**
 * Middleware để validate file upload
 */
const validateFileUpload = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Không có file nào được tải lên'
    });
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  for (let key in req.files) {
    const file = req.files[key];
    
    // Kiểm tra định dạng file
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG'
      });
    }
    
    // Kiểm tra kích thước file
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Kích thước file không được vượt quá 5MB'
      });
    }
  }
  
  next();
};

module.exports = {
  validate,                // Cho express-validator
  validateWithJoi,        // Cho Joi
  validateId,
  validatePagination,
  validateSearch,
  validateFileUpload,
  registerSchema,
  loginSchema,
};