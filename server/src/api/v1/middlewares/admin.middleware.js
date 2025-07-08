// src/api/v1/middlewares/admin.middleware.js
const jwt = require('jsonwebtoken');
const { AppError } = require('../../../utils/errors');

/**
 * Middleware kiểm tra quyền admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Kiểm tra xem user đã được authenticate từ middleware trước chưa
    if (!req.user) {
      throw new AppError('Không có thông tin xác thực', 401);
    }

    // Kiểm tra role admin - hỗ trợ cả roleId và role
    const isAdmin = req.user.role === 'admin' || 
                   req.user.roleId === 1 || 
                   req.user.role_id === 1;

    if (!isAdmin) {
      throw new AppError('Chỉ admin mới có quyền truy cập', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền admin hoặc owner
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const requireAdminOrOwner = async (req, res, next) => {
  try {
    // Kiểm tra xem user đã được authenticate từ middleware trước chưa
    if (!req.user) {
      throw new AppError('Không có thông tin xác thực', 401);
    }

    // Kiểm tra role admin hoặc hotel_owner
    const isAdmin = req.user.role === 'admin' || req.user.roleId === 1 || req.user.role_id === 1;
    const isOwner = req.user.role === 'hotel_owner' || req.user.roleId === 2 || req.user.role_id === 2;

    if (!isAdmin && !isOwner) {
      throw new AppError('Không có quyền truy cập', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền chỉnh sửa khách sạn
 * Chỉ admin hoặc chủ sở hữu khách sạn mới được phép
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const requireHotelOwnership = async (req, res, next) => {
  try {
    // Kiểm tra đã có thông tin user từ middleware trước
    if (!req.user) {
      throw new AppError('Không có thông tin xác thực', 401);
    }

    // Nếu là admin thì có quyền truy cập tất cả
    const isAdmin = req.user.role === 'admin' || req.user.roleId === 1 || req.user.role_id === 1;
    if (isAdmin) {
      return next();
    }

    // Nếu là hotel_owner, kiểm tra ownership sẽ được thực hiện ở service layer
    const isOwner = req.user.role === 'hotel_owner' || req.user.roleId === 2 || req.user.role_id === 2;
    if (isOwner) {
      return next();
    }

    throw new AppError('Không có quyền truy cập', 403);
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
const requireViewPermission = async (req, res, next) => {
  try {
    // Kiểm tra token từ header (optional cho một số route public)
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        // Token không hợp lệ nhưng vẫn cho phép truy cập public content
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền admin với các action cụ thể
 * @param {Array} allowedActions - Danh sách action được phép
 * @returns {Function} Middleware function
 */
const requireAdminAction = (allowedActions = []) => {
  return async (req, res, next) => {
    try {
      // Kiểm tra đã có thông tin user từ middleware trước
      if (!req.user) {
        throw new AppError('Không có thông tin xác thực', 401);
      }

      // Kiểm tra role admin
      const isAdmin = req.user.role === 'admin' || req.user.roleId === 1 || req.user.role_id === 1;
      if (!isAdmin) {
        throw new AppError('Chỉ admin mới có quyền thực hiện hành động này', 403);
      }

      // Kiểm tra action cụ thể nếu có
      if (allowedActions.length > 0) {
        const action = req.body.action || req.query.action || req.params.action;
        if (!allowedActions.includes(action)) {
          throw new AppError('Không có quyền thực hiện hành động này', 403);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware logging cho admin actions
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const logAdminAction = (req, res, next) => {
  // Log admin action for audit trail
  if (req.user && (req.user.role === 'admin' || req.user.roleId === 1 || req.user.role_id === 1)) {
    console.log(`[ADMIN ACTION] User: ${req.user.id}, Email: ${req.user.email}, Action: ${req.method} ${req.originalUrl}, Time: ${new Date().toISOString()}`);
  }
  next();
};

module.exports = {
  requireAdmin,
  isAdmin: requireAdmin,
  requireAdminOrOwner,
  requireHotelOwnership,
  requireViewPermission,
  requireAdminAction,
  logAdminAction
};