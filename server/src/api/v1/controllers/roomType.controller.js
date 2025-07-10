const roomTypeService = require('../services/roomType.service');

// Tạo room type mới
const createRoomType = async (req, res) => {
  try {
    const roomTypeData = {
      hotelId: req.body.hotelId,
      name: req.body.name,
      description: req.body.description,
      maxOccupancy: req.body.maxOccupancy,
      basePrice: req.body.basePrice,
      numberOfRooms: req.body.numberOfRooms,
      bedType: req.body.bedType,
      areaSqm: req.body.areaSqm
    };

    const result = await roomTypeService.createRoomType(roomTypeData);

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Lấy tất cả room types
const getAllRoomTypes = async (req, res) => {
  try {
    const result = await roomTypeService.getAllRoomTypes();

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.count
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Lấy room type theo ID
const getRoomTypeById = async (req, res) => {
  try {
    const roomTypeId = req.params.id; // giữ nguyên dạng string

    const result = await roomTypeService.getRoomTypeById(roomTypeId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Lấy room types theo hotel ID
const getRoomTypesByHotelId = async (req, res) => {
  try {
    const hotelId = req.params.hotelId; // giữ nguyên dạng string
    const result = await roomTypeService.getRoomTypesByHotelId(hotelId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.count
      });
    } else {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Cập nhật room type
const updateRoomType = async (req, res) => {
  try {
    const roomTypeId = req.params.id; // giữ nguyên dạng string
    const updateData = {};

    // Chỉ lấy các field có trong request body
    const allowedFields = ['name', 'description', 'maxOccupancy', 'basePrice', 'numberOfRooms', 'bedType', 'areaSqm'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const result = await roomTypeService.updateRoomType(roomTypeId, updateData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Xóa room type
const deleteRoomType = async (req, res) => {
  try {
    const roomTypeId = req.params.id; // giữ nguyên dạng string
    const result = await roomTypeService.deleteRoomType(roomTypeId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Lấy room types với phân trang
const getRoomTypesWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const hotelId = req.query.hotelId ? parseInt(req.query.hotelId) : null;

    const result = await roomTypeService.getRoomTypesWithPagination(page, limit, hotelId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Tìm kiếm room types
const searchRoomTypes = async (req, res) => {
  try {
    const searchTerm = req.query.search;
    const hotelId = req.query.hotelId ? parseInt(req.query.hotelId) : null;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }

    const result = await roomTypeService.searchRoomTypes(searchTerm, hotelId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.count
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Helper function: tính phân bố loại giường
const calculateBedTypeDistribution = (roomTypes) => {
  const distribution = {};
  roomTypes.forEach(rt => {
    const bedType = rt.bedType || 'Unknown';
    distribution[bedType] = (distribution[bedType] || 0) + rt.numberOfRooms;
  });
  return distribution;
};

// Helper function: tính phân bố sức chứa
const calculateOccupancyDistribution = (roomTypes) => {
  const distribution = {};
  roomTypes.forEach(rt => {
    const occupancy = rt.maxOccupancy;
    distribution[occupancy] = (distribution[occupancy] || 0) + rt.numberOfRooms;
  });
  return distribution;
};

// Lấy thống kê room types
const getRoomTypeStats = async (req, res) => {
  try {
    const hotelId = req.query.hotelId ? parseInt(req.query.hotelId) : null;
    
    // Lấy tất cả room types (theo hotel nếu có)
    const result = hotelId 
      ? await roomTypeService.getRoomTypesByHotelId(hotelId)
      : await roomTypeService.getAllRoomTypes();

    if (result.success) {
      const roomTypes = result.data;
      
      // Tính toán thống kê
      const stats = {
        totalRoomTypes: roomTypes.length,
        totalRooms: roomTypes.reduce((sum, rt) => sum + rt.numberOfRooms, 0),
        totalCapacity: roomTypes.reduce((sum, rt) => sum + (rt.numberOfRooms * rt.maxOccupancy), 0),
        averagePrice: roomTypes.length > 0 
          ? roomTypes.reduce((sum, rt) => sum + rt.basePrice, 0) / roomTypes.length 
          : 0,
        priceRange: roomTypes.length > 0 
          ? {
              min: Math.min(...roomTypes.map(rt => rt.basePrice)),
              max: Math.max(...roomTypes.map(rt => rt.basePrice))
            }
          : { min: 0, max: 0 },
        bedTypeDistribution: calculateBedTypeDistribution(roomTypes),
        occupancyDistribution: calculateOccupancyDistribution(roomTypes)
      };

      return res.status(200).json({
        success: true,
        data: stats
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Lấy room types có sẵn (còn phòng trống)
const getAvailableRoomTypes = async (req, res) => {
  try {
    const hotelId = req.query.hotelId || null;
    const checkIn = req.query.checkIn;
    const checkOut = req.query.checkOut;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID is required'
      });
    }

    // Lấy tất cả room types của hotel
    const result = await roomTypeService.getRoomTypesByHotelId(hotelId);

    if (result.success) {
      // TODO: Implement logic to check room availability based on bookings
      // For now, return all room types
      const availableRoomTypes = result.data.map(rt => ({
        ...rt.toJSON(),
        availableRooms: rt.numberOfRooms // Placeholder - should check actual availability
      }));

      return res.status(200).json({
        success: true,
        data: availableRoomTypes,
        count: availableRoomTypes.length,
        checkIn,
        checkOut
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Bulk create room types
const bulkCreateRoomTypes = async (req, res) => {
  try {
    const roomTypesData = req.body.roomTypes;

    if (!Array.isArray(roomTypesData) || roomTypesData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Room types array is required'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < roomTypesData.length; i++) {
      try {
        const result = await roomTypeService.createRoomType(roomTypesData[i]);
        if (result.success) {
          results.push(result.data);
        } else {
          errors.push({
            index: i,
            error: result.error,
            data: roomTypesData[i]
          });
        }
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          data: roomTypesData[i]
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully created ${results.length} room types`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: roomTypesData.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

module.exports = {
  createRoomType,
  getAllRoomTypes,
  getRoomTypeById,
  getRoomTypesByHotelId,
  updateRoomType,
  deleteRoomType,
  getRoomTypesWithPagination,
  searchRoomTypes,
  getRoomTypeStats,
  getAvailableRoomTypes,
  bulkCreateRoomTypes
};