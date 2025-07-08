const jwt = require('jsonwebtoken');
const { AppError } = require('../../../utils/errors');
const pool = require('../../../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Bạn chưa đăng nhập', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRes = await pool.query('SELECT * FROM users WHERE user_id = $1', [decoded.userId]);

    if (userRes.rows.length === 0) {
      throw new AppError('Không tìm thấy người dùng', 401);
    }

    req.user = {
      id: userRes.rows[0].user_id,
      role: userRes.rows[0].role_id === 1 ? 'admin' : userRes.rows[0].role_id === 2 ? 'hotel_owner' : 'user',
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Thêm hàm authorize
const authorize = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Bạn cần đăng nhập trước', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('Bạn không có quyền truy cập', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize  
};