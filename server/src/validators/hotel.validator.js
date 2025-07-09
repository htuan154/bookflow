// src/validators/hotel.validator.js
const { body, param, query } = require('express-validator');

/**
 * Validation rules cho việc tạo khách sạn
 */
const validateHotelData = [
  body('name')
    .notEmpty().withMessage('Tên khách sạn không được để trống')
    .isLength({ min: 3, max: 100 }).withMessage('Tên khách sạn phải từ 3-100 ký tự'),

  body('description')
    .notEmpty().withMessage('Mô tả không được để trống')
    .isLength({ min: 10, max: 1000 }).withMessage('Mô tả phải từ 10-1000 ký tự'),

  body('address')
    .notEmpty().withMessage('Địa chỉ không được để trống')
    .isLength({ min: 10, max: 200 }).withMessage('Địa chỉ phải từ 10-200 ký tự'),

  body('city')
    .notEmpty().withMessage('Thành phố không được để trống')
    .isLength({ min: 2, max: 50 }).withMessage('Tên thành phố phải từ 2-50 ký tự'),


  // SỬA: 'phone' -> 'phoneNumber'
  body('phoneNumber')
    .notEmpty().withMessage('Số điện thoại không được để trống')
    .matches(/^[0-9+\-\s()]{10,15}$/).withMessage('Số điện thoại không hợp lệ'),

  body('email')
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ'),
  
  // SỬA: 'star_rating' -> 'starRating'
  body('starRating')
    .notEmpty().withMessage('Xếp hạng sao không được để trống') // Bỏ optional() để đảm bảo test gửi lên
    .isInt({ min: 1, max: 5 }).withMessage('Xếp hạng sao phải từ 1-5'),

  // SỬA: 'check_in_time' -> 'checkInTime'
  body('checkInTime')
    .notEmpty().withMessage('Giờ check-in không được để trống')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Giờ check-in phải đúng định dạng HH:MM'),
  
  // SỬA: 'check_out_time' -> 'checkOutTime'
  body('checkOutTime')
    .notEmpty().withMessage('Giờ check-out không được để trống')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Giờ check-out phải đúng định dạng HH:MM'),
  
  // Các trường optional khác giữ nguyên
  body('website').optional().isURL().withMessage('Website không hợp lệ'),
  body('amenities').optional().isArray().withMessage('Tiện ích phải là mảng'),
  body('amenities.*').optional().isString().withMessage('Mỗi tiện ích phải là chuỗi'),
  body('images').optional().isArray().withMessage('Hình ảnh phải là mảng'),
  body('images.*').optional().isURL().withMessage('Mỗi hình ảnh phải là URL hợp lệ'),
];

/**
 * Validation rules cho việc cập nhật khách sạn
 */
const validateHotelUpdate = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tên khách sạn phải từ 3-100 ký tự'),

  body('description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Mô tả phải từ 10-1000 ký tự'),

  body('address')
    .optional()
    .isLength({ min: 10, max: 200 })
    .withMessage('Địa chỉ phải từ 10-200 ký tự'),

  body('city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên thành phố phải từ 2-50 ký tự'),

  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]{10,15}$/)
    .withMessage('Số điện thoại không hợp lệ'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ'),

  body('website')
    .optional()
    .isURL()
    .withMessage('Website không hợp lệ'),

  body('star_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Xếp hạng sao phải từ 1-5'),

  body('check_in_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Giờ check-in phải đúng định dạng HH:MM'),

  body('check_out_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Giờ check-out phải đúng định dạng HH:MM'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Tiện ích phải là mảng'),

  body('amenities.*')
    .optional()
    .isString()
    .withMessage('Mỗi tiện ích phải là chuỗi'),

  body('policies')
    .optional()
    .isArray()
    .withMessage('Chính sách phải là mảng'),

  body('policies.*')
    .optional()
    .isString()
    .withMessage('Mỗi chính sách phải là chuỗi'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Vĩ độ phải từ -90 đến 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Kinh độ phải từ -180 đến 180'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Hình ảnh phải là mảng'),

  body('images.*')
    .optional()
    .isURL()
    .withMessage('Mỗi hình ảnh phải là URL hợp lệ'),
];

/**
 * Validation rules cho việc cập nhật trạng thái khách sạn (Admin)
 */
const validateHotelStatus = [
  body('status')
    .notEmpty()
    .withMessage('Trạng thái không được để trống')
    .isIn(['pending', 'approved', 'rejected', 'inactive'])
    .withMessage('Trạng thái phải là: pending, approved, rejected, hoặc inactive'),

  body('reason')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Lý do phải từ 10-500 ký tự'),
];

/**
 * Validation rules cho tham số ID
 */
const validateHotelId = [
  param('id')
    .notEmpty()
    .withMessage('ID khách sạn không được để trống')
    .isUUID()
    .withMessage('ID khách sạn phải là UUID hợp lệ'),
];

/**
 * Validation rules cho tham số tìm kiếm
 */
const validateSearchParams = [
  query('q')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Từ khóa tìm kiếm phải từ 2-100 ký tự'),

  query('city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên thành phố phải từ 2-50 ký tự'),

  
  query('min_rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Đánh giá tối thiểu phải từ 1-5'),

  query('max_rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Đánh giá tối đa phải từ 1-5'),

  query('star_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Xếp hạng sao phải từ 1-5'),

  query('price_range')
    .optional()
    .isIn(['budget', 'mid-range', 'luxury'])
    .withMessage('Khoảng giá phải là: budget, mid-range, hoặc luxury'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1-100'),
];

/**
 * Validation rules cho pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1-100'),
];

module.exports = {
  validateHotelData,
  validateHotelUpdate,
  validateHotelStatus,
  validateHotelId,
  validateSearchParams,
  validatePagination,
};
