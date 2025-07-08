// src/api/v1/middlewares/hotel.middleware.js
const jwt = require('jsonwebtoken');
const { AppError } = require('../../../utils/errors');
const pool = require('../../../config/db');

/**
 * Middleware để xác thực người dùng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const protect = async (req, res, next) => {
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

    const user = userRes.rows[0];
    req.user = {
      id: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role_id === 1 ? 'admin' : user.role_id === 2 ? 'hotel_owner' : 'user',
      roleId: user.role_id,
      role_id: user.role_id
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Token không hợp lệ', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token đã hết hạn', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware xác thực optional (không bắt buộc đăng nhập)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userRes = await pool.query('SELECT * FROM users WHERE user_id = $1', [decoded.userId]);

      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        req.user = {
          id: user.user_id,
          email: user.email,
          username: user.username,
          role: user.role_id === 1 ? 'admin' : user.role_id === 2 ? 'hotel_owner' : 'user',
          roleId: user.role_id,
          role_id: user.role_id
        };
      } else {
        req.user = null;
      }
    } catch (tokenError) {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền sở hữu khách sạn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const checkHotelOwnership = async (req, res, next) => {
  try {
    const { id: hotelId } = req.params;
    const userId = req.user.id;

    // Admin có quyền truy cập tất cả
    if (req.user.role === 'admin') {
      return next();
    }

    // Kiểm tra quyền sở hữu khách sạn
    const hotelRes = await pool.query(
      'SELECT owner_id FROM hotels WHERE hotel_id = $1',
      [hotelId]
    );

    if (hotelRes.rows.length === 0) {
      throw new AppError('Không tìm thấy khách sạn', 404);
    }

    const hotel = hotelRes.rows[0];
    if (hotel.owner_id !== userId) {
      throw new AppError('Bạn không có quyền truy cập khách sạn này', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền chỉnh sửa khách sạn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const checkHotelEditPermission = async (req, res, next) => {
  try {
    const { id: hotelId } = req.params;
    const userId = req.user.id;

    // Admin có quyền chỉnh sửa tất cả
    if (req.user.role === 'admin') {
      return next();
    }

    // Chỉ hotel_owner mới có quyền chỉnh sửa
    if (req.user.role !== 'hotel_owner') {
      throw new AppError('Chỉ chủ khách sạn mới có quyền chỉnh sửa', 403);
    }

    // Kiểm tra quyền sở hữu
    const hotelRes = await pool.query(
      'SELECT owner_id FROM hotels WHERE hotel_id = $1',
      [hotelId]
    );

    if (hotelRes.rows.length === 0) {
      throw new AppError('Không tìm thấy khách sạn', 404);
    }

    const hotel = hotelRes.rows[0];
    if (hotel.owner_id !== userId) {
      throw new AppError('Bạn không có quyền chỉnh sửa khách sạn này', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền xem thông tin khách sạn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const checkHotelViewPermission = async (req, res, next) => {
  try {
    const { id: hotelId } = req.params;

    // Kiểm tra khách sạn có tồn tại không
    const hotelRes = await pool.query(
      'SELECT hotel_id, status FROM hotels WHERE hotel_id = $1',
      [hotelId]
    );

    if (hotelRes.rows.length === 0) {
      throw new AppError('Không tìm thấy khách sạn', 404);
    }

    const hotel = hotelRes.rows[0];

    // Nếu khách sạn đang inactive và user không phải admin hoặc owner
    if (hotel.status === 'inactive') {
      if (!req.user || req.user.role === 'user') {
        throw new AppError('Khách sạn không khả dụng', 403);
      }

      // Kiểm tra quyền owner nếu không phải admin
      if (req.user.role === 'hotel_owner') {
        const ownerRes = await pool.query(
          'SELECT owner_id FROM hotels WHERE hotel_id = $1',
          [hotelId]
        );

        if (ownerRes.rows[0].owner_id !== req.user.id) {
          throw new AppError('Khách sạn không khả dụng', 403);
        }
      }
    }

    req.hotel = hotel;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền quản lý phòng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const checkRoomManagementPermission = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user.id;

    // Admin có quyền quản lý tất cả
    if (req.user.role === 'admin') {
      return next();
    }

    // Chỉ hotel_owner mới có quyền quản lý phòng
    if (req.user.role !== 'hotel_owner') {
      throw new AppError('Chỉ chủ khách sạn mới có quyền quản lý phòng', 403);
    }

    // Kiểm tra quyền sở hữu khách sạn
    const hotelRes = await pool.query(
      'SELECT owner_id FROM hotels WHERE hotel_id = $1',
      [hotelId]
    );

    if (hotelRes.rows.length === 0) {
      throw new AppError('Không tìm thấy khách sạn', 404);
    }

    const hotel = hotelRes.rows[0];
    if (hotel.owner_id !== userId) {
      throw new AppError('Bạn không có quyền quản lý phòng của khách sạn này', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra trạng thái khách sạn
 * @param {Array} allowedStatuses - Danh sách trạng thái được phép
 * @returns {Function} Middleware function
 */
const checkHotelStatus = (allowedStatuses = ['active']) => {
  return async (req, res, next) => {
    try {
      const { id: hotelId } = req.params;

      const hotelRes = await pool.query(
        'SELECT status FROM hotels WHERE hotel_id = $1',
        [hotelId]
      );

      if (hotelRes.rows.length === 0) {
        throw new AppError('Không tìm thấy khách sạn', 404);
      }

      const hotel = hotelRes.rows[0];
      if (!allowedStatuses.includes(hotel.status)) {
        throw new AppError('Khách sạn không trong trạng thái phù hợp', 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware logging cho hotel actions
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const logHotelAction = (req, res, next) => {
  if (req.user) {
    const { hotelId, id } = req.params;
    const targetHotel = hotelId || id;
    
    console.log(`[HOTEL ACTION] User: ${req.user.id}, Role: ${req.user.role}, Hotel: ${targetHotel}, Action: ${req.method} ${req.originalUrl}, Time: ${new Date().toISOString()}`);
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  checkHotelOwnership,
  checkHotelEditPermission,
  checkHotelViewPermission,
  checkRoomManagementPermission,
  checkHotelStatus,
  logHotelAction
};