'use strict';

const otpService = require('../services/otp.service');

/**
 * Gửi OTP đến email người dùng
 * POST /api/v1/otp/send
 * Body: { email }
 */
exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }
    
    const result = await otpService.sendOTP(email);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ sendOTP controller error:', error);
    next(error);
  }
};

/**
 * Xác thực OTP
 * POST /api/v1/otp/verify
 * Body: { email, otp }
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email và OTP là bắt buộc'
      });
    }
    
    // Validate OTP format (6 chữ số)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP phải là 6 chữ số'
      });
    }
    
    const result = await otpService.verifyOTP(email, otp);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ verifyOTP controller error:', error);
    next(error);
  }
};

/**
 * Xóa các OTP đã hết hạn của một email (optional, cho admin)
 * DELETE /api/v1/otp/cleanup
 * Body: { email }
 */
exports.cleanupOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }
    
    const deletedCount = await otpService.cleanupOTP(email);
    
    res.status(200).json({
      success: true,
      message: `Đã xóa ${deletedCount} OTP`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('❌ cleanupOTP controller error:', error);
    next(error);
  }
};

/**
 * Reset mật khẩu sau khi verify OTP
 * POST /api/v1/otp/reset-password
 * Body: { email, newPassword }
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu mới là bắt buộc'
      });
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }
    
    const result = await otpService.resetPassword(email, newPassword);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ resetPassword controller error:', error);
    next(error);
  }
};
