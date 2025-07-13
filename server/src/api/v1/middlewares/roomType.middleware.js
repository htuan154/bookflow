const roomTypeService = require('../services/roomType.service');
const hotelRepository = require('../repositories/hotel.repository');

class RoomTypeMiddlewares {
  // Middleware kiểm tra room type ID hợp lệ
  validateRoomTypeId(req, res, next) {
    const roomTypeId = req.params.id;
    if (!roomTypeId || typeof roomTypeId !== 'string' || roomTypeId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room type ID'
      });
    }
    req.roomTypeId = roomTypeId;
    next();
  }

  // Middleware kiểm tra hotel ID hợp lệ
  validateHotelId(req, res, next) {
    const hotelId = req.params.hotelId || req.body.hotelId || req.query.hotelId;
    if (!hotelId || typeof hotelId !== 'string' || hotelId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hotel ID'
      });
    }
    req.hotelId = hotelId; 
    next();
  }


  // Middleware kiểm tra room type tồn tại
  async checkRoomTypeExists(req, res, next) {
    try {
      const roomTypeId = req.roomTypeId || parseInt(req.params.id);
      
      if (!roomTypeId) {
        return res.status(400).json({
          success: false,
          error: 'Room type ID is required'
        });
      }

      const result = await roomTypeService.getRoomTypeById(roomTypeId);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: 'Room type not found'
        });
      }

      req.roomType = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Middleware kiểm tra hotel tồn tại
  async checkHotelExists(req, res, next) {
  try {
    const hotelId = req.hotelId || req.params.hotelId || req.body.hotelId;

    if (!hotelId || typeof hotelId !== 'string' || hotelId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID is required'
      });
    }

    const hotelExists = await hotelRepository.exists(hotelId);

    if (!hotelExists) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found'
      });
    }

    req.hotelId = hotelId;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

  // Middleware validate dữ liệu tạo room type
  validateCreateRoomType(req, res, next) {
    const errors = [];
    const { hotelId, name, maxOccupancy, basePrice, numberOfRooms } = req.body;

    // Kiểm tra các field bắt buộc
    if (!hotelId || typeof hotelId !== 'string' || hotelId.trim().length === 0) {
      errors.push('Valid hotel ID is required');
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (!maxOccupancy || isNaN(maxOccupancy) || maxOccupancy < 1) {
      errors.push('Max occupancy must be a positive number');
    }

    if (basePrice === undefined || isNaN(basePrice) || basePrice < 0) {
      errors.push('Base price must be a non-negative number');
    }

    if (!numberOfRooms || isNaN(numberOfRooms) || numberOfRooms < 1) {
      errors.push('Number of rooms must be a positive number');
    }

    // Kiểm tra giới hạn độ dài
    if (name && name.length > 100) {
      errors.push('Name must not exceed 100 characters');
    }

    if (req.body.description && req.body.description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }

    if (req.body.bedType && req.body.bedType.length > 50) {
      errors.push('Bed type must not exceed 50 characters');
    }

    // Kiểm tra giới hạn số
    if (maxOccupancy && maxOccupancy > 20) {
      errors.push('Max occupancy cannot exceed 20');
    }

    if (basePrice && basePrice > 10000000) {
      errors.push('Base price cannot exceed 10,000,000');
    }

    if (numberOfRooms && numberOfRooms > 1000) {
      errors.push('Number of rooms cannot exceed 1000');
    }

    if (req.body.areaSqm && (isNaN(req.body.areaSqm) || req.body.areaSqm < 1 || req.body.areaSqm > 1000)) {
      errors.push('Area must be between 1 and 1000 square meters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Middleware validate dữ liệu cập nhật room type
  validateUpdateRoomType(req, res, next) {
    const errors = [];
    const { name, maxOccupancy, basePrice, numberOfRooms, description, bedType, areaSqm } = req.body;

    // Kiểm tra nếu không có field nào để update
    const allowedFields = ['name', 'description', 'maxOccupancy', 'basePrice', 'numberOfRooms', 'bedType', 'areaSqm'];
    const hasValidFields = allowedFields.some(field => req.body[field] !== undefined);

    if (!hasValidFields) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update'
      });
    }

    // Validate từng field nếu có
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Name must be a non-empty string');
      } else if (name.length > 100) {
        errors.push('Name must not exceed 100 characters');
      }
    }

    if (description !== undefined && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }

    if (bedType !== undefined && bedType.length > 50) {
      errors.push('Bed type must not exceed 50 characters');
    }

    if (maxOccupancy !== undefined) {
      if (isNaN(maxOccupancy) || maxOccupancy < 1 || maxOccupancy > 20) {
        errors.push('Max occupancy must be between 1 and 20');
      }
    }

    if (basePrice !== undefined) {
      if (isNaN(basePrice) || basePrice < 0 || basePrice > 10000000) {
        errors.push('Base price must be between 0 and 10,000,000');
      }
    }

    if (numberOfRooms !== undefined) {
      if (isNaN(numberOfRooms) || numberOfRooms < 1 || numberOfRooms > 1000) {
        errors.push('Number of rooms must be between 1 and 1000');
      }
    }

    if (areaSqm !== undefined) {
      if (isNaN(areaSqm) || areaSqm < 1 || areaSqm > 1000) {
        errors.push('Area must be between 1 and 1000 square meters');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Middleware validate pagination parameters
  validatePagination(req, res, next) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1) {
      return res.status(400).json({
        success: false,
        error: 'Page number must be greater than 0'
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100'
      });
    }

    req.pagination = { page, limit };
    next();
  }

  // Middleware validate search parameters
  validateSearch(req, res, next) {
    const searchTerm = req.query.search;

    if (!searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search term is required and must be a string'
      });
    }

    if (searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search term must be at least 2 characters long'
      });
    }

    if (searchTerm.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Search term must not exceed 100 characters'
      });
    }

    req.searchTerm = searchTerm.trim();
    next();
  }

  // Middleware validate bulk operations
  validateBulkCreate(req, res, next) {
    const { roomTypes } = req.body;

    if (!Array.isArray(roomTypes)) {
      return res.status(400).json({
        success: false,
        error: 'Room types must be an array'
      });
    }

    if (roomTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one room type is required'
      });
    }

    if (roomTypes.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create more than 50 room types at once'
      });
    }

    // Validate từng room type
    const errors = [];
    roomTypes.forEach((roomType, index) => {
      if (!roomType.hotelId || !roomType.name || !roomType.maxOccupancy || 
          roomType.basePrice === undefined || !roomType.numberOfRooms) {
        errors.push(`Room type at index ${index} is missing required fields`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Middleware validate bulk update
  validateBulkUpdate(req, res, next) {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Updates must be an array'
      });
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one update is required'
      });
    }

    if (updates.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update more than 50 room types at once'
      });
    }

    // Validate từng update
    const errors = [];
    updates.forEach((update, index) => {
      if (!update.roomTypeId || !update.updateData || typeof update.updateData !== 'object') {
        errors.push(`Update at index ${index} is missing roomTypeId or updateData`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Middleware validate bulk delete
  validateBulkDelete(req, res, next) {
    const { roomTypeIds } = req.body;

    if (!Array.isArray(roomTypeIds)) {
      return res.status(400).json({
        success: false,
        error: 'Room type IDs must be an array'
      });
    }

    if (roomTypeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one room type ID is required'
      });
    }

    if (roomTypeIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete more than 50 room types at once'
      });
    }

    // Validate từng ID
    const errors = [];
    roomTypeIds.forEach((id, index) => {
      if (!id || isNaN(id)) {
        errors.push(`ID at index ${index} is invalid`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Middleware validate availability check
  validateAvailabilityCheck(req, res, next) {
    const { checkIn, checkOut } = req.query;

    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD format'
        });
      }

      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          error: 'Check-in date must be before check-out date'
        });
      }

      if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({
          success: false,
          error: 'Check-in date cannot be in the past'
        });
      }

      req.checkIn = checkIn;
      req.checkOut = checkOut;
    }

    next();
  }

  // Middleware rate limiting cho search
  rateLimitSearch(req, res, next) {
    // Đơn giản - có thể implement redis-based rate limiting
    const userIP = req.ip;
    const now = Date.now();
    
    // Simulate rate limiting (trong thực tế nên dùng Redis)
    if (!req.app.locals.searchLimits) {
      req.app.locals.searchLimits = new Map();
    }

    const userLimits = req.app.locals.searchLimits.get(userIP) || { count: 0, resetTime: now + 60000 };
    
    if (now > userLimits.resetTime) {
      userLimits.count = 0;
      userLimits.resetTime = now + 60000;
    }

    if (userLimits.count >= 30) { // 30 requests per minute
      return res.status(429).json({
        success: false,
        error: 'Too many search requests. Please try again later.'
      });
    }

    userLimits.count++;
    req.app.locals.searchLimits.set(userIP, userLimits);
    next();
  }

  // Middleware logging
  logRequest(req, res, next) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('User-Agent');
    const ip = req.ip;

    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);
    next();
  }

  // Middleware xử lý lỗi async
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = new RoomTypeMiddlewares();