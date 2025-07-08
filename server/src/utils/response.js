// src/utils/response.js

/**
 * Gửi phản hồi thành công.
 * @param {object} res - Đối tượng response của Express.
 * @param {object} data - Dữ liệu trả về.
 * @param {string} message - Tin nhắn.
 * @param {number} statusCode - Mã trạng thái HTTP.
 * @param {object} pagination - Thông tin phân trang (nếu có).
 */
const successResponse = (res, data, message = 'Success', statusCode = 200, pagination) => {
  const response = {
    status: 'success',
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.status(statusCode).json(response);
};

/**
 * Gửi phản hồi lỗi.
 * @param {object} res - Đối tượng response của Express.
 * @param {string} message - Tin nhắn lỗi.
 * @param {number} statusCode - Mã trạng thái HTTP.
 */
const errorResponse = (res, message = 'An error occurred', statusCode = 500) => {
  res.status(statusCode).json({
    status: 'error',
    message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
