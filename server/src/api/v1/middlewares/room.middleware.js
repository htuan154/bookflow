const { AppError } = require('../../../utils/errors');
const pool = require('../../../config/db');

// Validate room creation data
const validateRoomCreation = (req, res, next) => {
  try {
    const { roomTypeId, roomNumber, floorNumber } = req.body;
    const errors = [];

    // Required fields validation
    if (!roomTypeId) {
      errors.push('Room type ID is required');
    }

    if (!roomNumber) {
      errors.push('Room number is required');
    }

    if (!floorNumber) {
      errors.push('Floor number is required');
    }

    // Data type validation
    if (roomTypeId && !Number.isInteger(Number(roomTypeId))) {
      errors.push('Room type ID must be a valid number');
    }

    if (roomNumber && typeof roomNumber !== 'string') {
      errors.push('Room number must be a string');
    }

    if (floorNumber && !Number.isInteger(Number(floorNumber))) {
      errors.push('Floor number must be a valid number');
    }

    // Room number format validation
    if (roomNumber && (roomNumber.length < 1 || roomNumber.length > 10)) {
      errors.push('Room number must be between 1-10 characters');
    }

    // Floor number range validation
    if (floorNumber && (Number(floorNumber) < 1 || Number(floorNumber) > 50)) {
      errors.push('Floor number must be between 1-50');
    }

    // Status validation (if provided)
    if (req.body.status) {
      const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order', 'cleaning'];
      if (!validStatuses.includes(req.body.status)) {
        errors.push('Invalid room status. Must be one of: available, occupied, maintenance, out_of_order, cleaning');
      }
    }

    if (errors.length > 0) {
      throw new AppError(errors.join(', '), 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validate room update data
const validateRoomUpdate = (req, res, next) => {
  try {
    const { roomTypeId, roomNumber, floorNumber, status } = req.body;
    const errors = [];

    // Check if at least one field is provided
    if (!roomTypeId && !roomNumber && !floorNumber && !status) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    // Data type validation
    if (roomTypeId && !Number.isInteger(Number(roomTypeId))) {
      errors.push('Room type ID must be a valid number');
    }

    if (roomNumber && typeof roomNumber !== 'string') {
      errors.push('Room number must be a string');
    }

    if (floorNumber && !Number.isInteger(Number(floorNumber))) {
      errors.push('Floor number must be a valid number');
    }

    // Room number format validation
    if (roomNumber && (roomNumber.length < 1 || roomNumber.length > 10)) {
      errors.push('Room number must be between 1-10 characters');
    }

    // Floor number range validation
    if (floorNumber && (Number(floorNumber) < 1 || Number(floorNumber) > 50)) {
      errors.push('Floor number must be between 1-50');
    }

    // Status validation
    if (status) {
      const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order', 'cleaning'];
      if (!validStatuses.includes(status)) {
        errors.push('Invalid room status. Must be one of: available, occupied, maintenance, out_of_order, cleaning');
      }
    }

    if (errors.length > 0) {
      throw new AppError(errors.join(', '), 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validate room ID parameter
const validateRoomId = (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      throw new AppError('Room ID is required', 400);
    }

    if (!Number.isInteger(Number(roomId)) || Number(roomId) <= 0) {
      throw new AppError('Room ID must be a positive integer', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validate hotel ID parameter
const validateHotelId = (req, res, next) => {
  try {
    const { hotelId } = req.params;

    if (!hotelId) {
      throw new AppError('Hotel ID is required', 400);
    }

    if (!Number.isInteger(Number(hotelId)) || Number(hotelId) <= 0) {
      throw new AppError('Hotel ID must be a positive integer', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validate room type ID parameter
const validateRoomTypeId = (req, res, next) => {
  try {
    const { roomTypeId } = req.params;

    if (!roomTypeId) {
      throw new AppError('Room type ID is required', 400);
    }

    if (!Number.isInteger(Number(roomTypeId)) || Number(roomTypeId) <= 0) {
      throw new AppError('Room type ID must be a positive integer', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validate room status parameter
const validateRoomStatus = (req, res, next) => {
  try {
    const { status } = req.params;

    if (!status) {
      throw new AppError('Room status is required', 400);
    }

    const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order', 'cleaning'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid room status. Must be one of: available, occupied, maintenance, out_of_order, cleaning', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validate availability check data
const validateAvailabilityCheck = (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate } = req.query;
    const errors = [];

    // Hotel ID validation
    if (!hotelId) {
      errors.push('Hotel ID is required');
    } else if (!Number.isInteger(Number(hotelId)) || Number(hotelId) <= 0) {
      errors.push('Hotel ID must be a positive integer');
    }

    // Date validation
    if (!checkInDate) {
      errors.push('Check-in date is required');
    }

    if (!checkOutDate) {
      errors.push('Check-out date is required');
    }

    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset time to start of day

      // Check if dates are valid
      if (isNaN(checkIn.getTime())) {
        errors.push('Invalid check-in date format');
      }

      if (isNaN(checkOut.getTime())) {
        errors.push('Invalid check-out date format');
      }

      if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
        // Check if check-in is not in the past
        if (checkIn < now) {
          errors.push('Check-in date cannot be in the past');
        }

        // Check if check-out is after check-in
        if (checkOut <= checkIn) {
          errors.push('Check-out date must be after check-in date');
        }
      }
    }

    if (errors.length > 0) {
      throw new AppError(errors.join(', '), 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if room exists
const checkRoomExists = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    
    const roomRes = await pool.query('SELECT room_id FROM rooms WHERE room_id = $1', [roomId]);
    
    if (roomRes.rows.length === 0) {
      throw new AppError('Room not found', 404);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if room type exists
const checkRoomTypeExists = async (req, res, next) => {
  try {
    const { roomTypeId } = req.body;
    
    if (roomTypeId) {
      const roomTypeRes = await pool.query('SELECT room_type_id FROM room_types WHERE room_type_id = $1', [roomTypeId]);
      
      if (roomTypeRes.rows.length === 0) {
        throw new AppError('Room type not found', 404);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if hotel exists
const checkHotelExists = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    
    const hotelRes = await pool.query('SELECT hotel_id FROM hotels WHERE hotel_id = $1', [hotelId]);
    
    if (hotelRes.rows.length === 0) {
      throw new AppError('Hotel not found', 404);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check room ownership (for hotel owners)
const checkRoomOwnership = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    // Skip check for admin users
    if (req.user.role === 'admin') {
      return next();
    }
    
    // For hotel owners, check if they own the hotel that contains this room
    if (req.user.role === 'hotel_owner') {
      const ownershipRes = await pool.query(`
        SELECT r.room_id 
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.room_type_id
        JOIN hotels h ON rt.hotel_id = h.hotel_id
        WHERE r.room_id = $1 AND h.owner_id = $2
      `, [roomId, userId]);
      
      if (ownershipRes.rows.length === 0) {
        throw new AppError('You do not have permission to access this room', 403);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check hotel ownership (for hotel owners)
const checkHotelOwnership = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user.id;
    
    // Skip check for admin users
    if (req.user.role === 'admin') {
      return next();
    }
    
    // For hotel owners, check if they own the hotel
    if (req.user.role === 'hotel_owner') {
      const ownershipRes = await pool.query('SELECT hotel_id FROM hotels WHERE hotel_id = $1 AND owner_id = $2', [hotelId, userId]);
      
      if (ownershipRes.rows.length === 0) {
        throw new AppError('You do not have permission to access this hotel', 403);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Sanitize room data
const sanitizeRoomData = (req, res, next) => {
  try {
    const { roomNumber, floorNumber, roomTypeId, status } = req.body;
    
    // Sanitize and convert data types
    if (roomNumber) {
      req.body.roomNumber = roomNumber.toString().trim();
    }
    
    if (floorNumber) {
      req.body.floorNumber = parseInt(floorNumber);
    }
    
    if (roomTypeId) {
      req.body.roomTypeId = parseInt(roomTypeId);
    }
    
    if (status) {
      req.body.status = status.toString().trim().toLowerCase();
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateRoomCreation,
  validateRoomUpdate,
  validateRoomId,
  validateHotelId,
  validateRoomTypeId,
  validateRoomStatus,
  validateAvailabilityCheck,
  checkRoomExists,
  checkRoomTypeExists,
  checkHotelExists,
  checkRoomOwnership,
  checkHotelOwnership,
  sanitizeRoomData
};