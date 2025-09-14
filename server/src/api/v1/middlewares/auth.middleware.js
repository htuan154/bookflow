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

// Middleware không bắt buộc - nếu có token hợp lệ thì parse user, không có thì để null
const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Không có token -> anonymous user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const userRes = await pool.query('SELECT * FROM users WHERE user_id = $1', [decoded.userId]);

      if (userRes.rows.length === 0) {
        // User không tồn tại -> anonymous
        req.user = null;
        return next();
      }

      req.user = {
        id: userRes.rows[0].user_id,
        role: userRes.rows[0].role_id === 1 ? 'admin' : userRes.rows[0].role_id === 2 ? 'hotel_owner' : 'user',
        email: userRes.rows[0].email,
        name: userRes.rows[0].full_name
      };

      console.log('✅ Auth optional success:', { id: req.user.id, email: req.user.email });
      next();
    } catch (jwtError) {
      // Token không hợp lệ hoặc hết hạn -> anonymous
      console.log('⚠️ JWT error in optional auth:', jwtError.message);
      req.user = null;
      next();
    }
  } catch (error) {
    // Lỗi khác -> anonymous (không throw error để không break flow)
    console.log('⚠️ Auth optional error:', error.message);
    req.user = null;
    next();
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
  authenticateOptional,
  authorize  
};