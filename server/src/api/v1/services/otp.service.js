'use strict';

const { getDb } = require('../../../config/mongodb');
const { sendOTPEmail } = require('../../../config/resend');

const OTP_COLLECTION = 'otp_codes';
const OTP_EXPIRY_SECONDS = 60; // 1 phút

/**
 * Tạo mã OTP 6 số ngẫu nhiên
 * @returns {string} Mã OTP 6 số
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Gửi OTP qua email và lưu vào MongoDB
 * @param {string} email - Email người dùng
 * @returns {Promise<object>} Kết quả gửi OTP
 */
async function sendOTP(email) {
  try {
    const db = getDb();
    const otpCollection = db.collection(OTP_COLLECTION);
    
    // Tạo mã OTP 6 số
    const otpCode = generateOTP();
    
    // Gửi email
    await sendOTPEmail(email, otpCode);
    
    // Lưu vào MongoDB với TTL index (tự động xóa sau 1 phút)
    const otpDoc = {
      email,
      otp: otpCode,
      status: true, // true = chưa verify, false = đã verify hoặc hết hạn
      created_at: new Date(),
      expires_at: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000)
    };
    
    await otpCollection.insertOne(otpDoc);
    
    // Tạo TTL index để tự động xóa document sau khi hết hạn
    await otpCollection.createIndex(
      { expires_at: 1 },
      { expireAfterSeconds: 0, name: 'otp_ttl_index' }
    );
    
    console.log(`✅ OTP sent to ${email}: ${otpCode}`);
    
    return {
      success: true,
      message: 'OTP đã được gửi đến email của bạn',
      email
    };
  } catch (error) {
    console.error('❌ sendOTP error:', error);
    throw new Error('Không thể gửi OTP. Vui lòng thử lại sau.');
  }
}

/**
 * Xác thực OTP
 * @param {string} email - Email người dùng
 * @param {string} otpCode - Mã OTP cần verify
 * @returns {Promise<object>} Kết quả xác thực
 */
async function verifyOTP(email, otpCode) {
  try {
    const db = getDb();
    const otpCollection = db.collection(OTP_COLLECTION);
    
    // Tìm OTP còn hiệu lực
    const otpDoc = await otpCollection.findOne({
      email,
      otp: otpCode,
      status: true,
      expires_at: { $gt: new Date() } // Chưa hết hạn
    });
    
    if (!otpDoc) {
      return {
        success: false,
        message: 'OTP không hợp lệ hoặc đã hết hạn'
      };
    }
    
    // Cập nhật status thành false (đã verify, không thể dùng lại)
    await otpCollection.updateOne(
      { _id: otpDoc._id },
      { 
        $set: { 
          status: false,
          verified_at: new Date()
        } 
      }
    );
    
    console.log(`✅ OTP verified successfully for ${email}`);
    
    return {
      success: true,
      message: 'Xác thực OTP thành công',
      email: otpDoc.email
    };
  } catch (error) {
    console.error('❌ verifyOTP error:', error);
    throw new Error('Không thể xác thực OTP. Vui lòng thử lại sau.');
  }
}

/**
 * Xóa các OTP đã hết hạn hoặc đã verify của một email
 * @param {string} email - Email người dùng
 * @returns {Promise<number>} Số lượng OTP đã xóa
 */
async function cleanupOTP(email) {
  try {
    const db = getDb();
    const otpCollection = db.collection(OTP_COLLECTION);
    
    const result = await otpCollection.deleteMany({
      email,
      $or: [
        { status: false },
        { expires_at: { $lt: new Date() } }
      ]
    });
    
    return result.deletedCount;
  } catch (error) {
    console.error('❌ cleanupOTP error:', error);
    return 0;
  }
}

/**
 * Reset mật khẩu sau khi verify OTP thành công
 * @param {string} email - Email người dùng
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise<object>} Kết quả reset password
 */
async function resetPassword(email, newPassword) {
  try {
    const bcrypt = require('bcrypt');
    const pool = require('../../../config/db');
    
    // Hash mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu trong Supabase/Postgres
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING user_id, email, username',
      [passwordHash, email]
    );
    
    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Không tìm thấy người dùng với email này'
      };
    }
    
    console.log(`✅ Password reset successfully for ${email}`);
    
    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công',
      user: result.rows[0]
    };
  } catch (error) {
    console.error('❌ resetPassword error:', error);
    throw new Error('Không thể đặt lại mật khẩu. Vui lòng thử lại sau.');
  }
}

module.exports = {
  sendOTP,
  verifyOTP,
  cleanupOTP,
  generateOTP,
  resetPassword
};
