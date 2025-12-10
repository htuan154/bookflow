'use strict';

const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

if (!RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not found in .env');
}

const resend = new Resend(RESEND_API_KEY);

/**
 * Gửi email OTP cho người dùng
 * @param {string} toEmail - Email người nhận
 * @param {string} otpCode - Mã OTP 6 số
 * @returns {Promise<object>} Kết quả gửi email
 */
async function sendOTPEmail(toEmail, otpCode) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Mã OTP xác thực - BookFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Mã OTP của bạn</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP sau để xác thực:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p><strong>Lưu ý:</strong> Mã OTP này chỉ có hiệu lực trong <strong>1 phút</strong>.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">Email này được gửi tự động từ hệ thống BookFlow.</p>
        </div>
      `
    });
    
    return result;
  } catch (error) {
    console.error('❌ Resend sendOTPEmail error:', error);
    throw error;
  }
}

module.exports = {
  sendOTPEmail
};
