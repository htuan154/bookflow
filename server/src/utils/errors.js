// src/utils/errors.js

/**
 * Lớp lỗi tùy chỉnh để xử lý các lỗi nghiệp vụ một cách nhất quán.
 * @extends Error
 */
class AppError extends Error {
  /**
   * @param {string} message - Tin nhắn lỗi.
   * @param {number} statusCode - Mã trạng thái HTTP.
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Đánh dấu đây là lỗi có thể dự đoán được

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
