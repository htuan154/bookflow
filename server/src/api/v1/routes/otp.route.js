'use strict';

const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');

/**
 * @route POST /api/v1/otp/send
 * @desc Gửi OTP đến email người dùng
 * @access Public
 */
router.post('/send', otpController.sendOTP);

/**
 * @route POST /api/v1/otp/verify
 * @desc Xác thực OTP
 * @access Public
 */
router.post('/verify', otpController.verifyOTP);

/**
 * @route DELETE /api/v1/otp/cleanup
 * @desc Xóa các OTP đã hết hạn của một email
 * @access Public (hoặc có thể thêm middleware auth nếu muốn bảo vệ)
 */
router.delete('/cleanup', otpController.cleanupOTP);

/**
 * @route POST /api/v1/otp/reset-password
 * @desc Đặt lại mật khẩu sau khi verify OTP thành công
 * @access Public
 */
router.post('/reset-password', otpController.resetPassword);

module.exports = router;
