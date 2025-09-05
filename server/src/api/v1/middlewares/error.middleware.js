/*
===================================================================
File: /src/middlewares/error.middleware.js
Mục đích: Middleware xử lý lỗi tập trung cho toàn bộ ứng dụng.
Bắt tất cả các lỗi được truyền qua next(error).
===================================================================
*/
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log lỗi ra console để debug ở môi trường development
    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR ', err);
    }

    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message || 'Đã có lỗi xảy ra trên server.',
        // Chỉ hiện stack trace ở môi trường dev
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
module.exports = function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) console.error('ERROR ', err);

  res.status(status).json({
    success: false,
    code: status,
    message: err.message || 'Đã có lỗi xảy ra trên server.',
    ...(isDev && { stack: err.stack }),
  });
};
module.exports = errorHandler;