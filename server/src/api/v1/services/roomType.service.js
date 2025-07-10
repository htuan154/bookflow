const roomTypeRepository = require('../repositories/roomType.repository');
const hotelRepository = require('../repositories/hotel.repository');
const RoomRepository = require('../repositories/room.repository');
const roomRepository = new RoomRepository();

class RoomTypeService {
  // Tạo room type mới
  async createRoomType(roomTypeData) {
    try {
      // Validate dữ liệu đầu vào
      this.validateRoomTypeData(roomTypeData);

      // Kiểm tra hotel có tồn tại không
      const hotelExists = await hotelRepository.exists(roomTypeData.hotelId);
      if (!hotelExists) {
        throw new Error('Hotel not found');
      }

      // Kiểm tra tên room type đã tồn tại trong hotel chưa
      const existingRoomTypes = await roomTypeRepository.findByHotelId(roomTypeData.hotelId);
      const isDuplicateName = existingRoomTypes.some(rt => 
        rt.name.toLowerCase() === roomTypeData.name.toLowerCase()
      );

      if (isDuplicateName) {
        throw new Error('Room type name already exists in this hotel');
      }

      // Tạo room type mới
      const newRoomType = await roomTypeRepository.create(roomTypeData);
      return {
        success: true,
        data: newRoomType,
        message: 'Room type created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy tất cả room types
  async getAllRoomTypes() {
    try {
      const roomTypes = await roomTypeRepository.findAll();
      return {
        success: true,
        data: roomTypes,
        count: roomTypes.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy room type theo ID
  async getRoomTypeById(roomTypeId) {
    try {
      if (!roomTypeId || typeof roomTypeId !== 'string') {
        throw new Error(`Invalid room type ID received: "${roomTypeId}", type: ${typeof roomTypeId}`);
      }

      const roomType = await roomTypeRepository.findById(roomTypeId);
      if (!roomType) {
        return {
          success: false,
          error: 'Room type not found'
        };
      }

      return {
        success: true,
        data: roomType
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy room types theo hotel ID
  async getRoomTypesByHotelId(hotelId) {
    try {
      if (!hotelId || typeof hotelId !== 'string') {
        throw new Error('Invalid hotel ID');
      }

      // Kiểm tra hotel có tồn tại không
      const hotelExists = await hotelRepository.exists(hotelId);
      if (!hotelExists) {
        return {
          success: false,
          error: 'Hotel not found'
        };
      }

      const roomTypes = await roomTypeRepository.findByHotelId(hotelId);
      return {
        success: true,
        data: roomTypes,
        count: roomTypes.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cập nhật room type
  async updateRoomType(roomTypeId, updateData) {
    try {
      if (!roomTypeId || typeof roomTypeId !== 'string') {
        throw new Error(`Invalid room type ID received: "${roomTypeId}", type: ${typeof roomTypeId}`);
      }

      // Kiểm tra room type có tồn tại không
      const existingRoomType = await roomTypeRepository.findById(roomTypeId);
      if (!existingRoomType) {
        return {
          success: false,
          error: 'Room type not found'
        };
      }

      // Validate dữ liệu cập nhật
      this.validateUpdateData(updateData);

      // Nếu cập nhật tên, kiểm tra trùng lặp
      if (updateData.name && updateData.name !== existingRoomType.name) {
        const existingRoomTypes = await roomTypeRepository.findByHotelId(existingRoomType.hotelId);
        const isDuplicateName = existingRoomTypes.some(rt => 
          rt.name.toLowerCase() === updateData.name.toLowerCase() && 
          rt.roomTypeId !== roomTypeId
        );

        if (isDuplicateName) {
          throw new Error('Room type name already exists in this hotel');
        }
      }

      const updatedRoomType = await roomTypeRepository.update(roomTypeId, updateData);
      return {
        success: true,
        data: updatedRoomType,
        message: 'Room type updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Xóa room type
  async deleteRoomType(roomTypeId) {
    try {
      if (!roomTypeId || typeof roomTypeId !== 'string') {
        throw new Error(`Invalid room type ID received: "${roomTypeId}", type: ${typeof roomTypeId}`);
      }

      // Kiểm tra room type có tồn tại không
      const roomTypeExists = await roomTypeRepository.exists(roomTypeId);
      if (!roomTypeExists) {
        return {
          success: false,
          error: 'Room type not found'
        };
      }

      // TODO: Kiểm tra xem có room nào đang sử dụng room type này không
      const roomsUsingType = await roomRepository.findByRoomTypeId(roomTypeId);
      if (roomsUsingType.length > 0) {
        throw new Error('Cannot delete room type. There are rooms using this room type.');
      }

      const deleted = await roomTypeRepository.delete(roomTypeId);
      if (deleted) {
        return {
          success: true,
          message: 'Room type deleted successfully'
        };
      } else {
        return {
          success: false,
          error: 'Failed to delete room type'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy room types với phân trang
  async getRoomTypesWithPagination(page = 1, limit = 10, hotelId = null) {
    try {
      if (page < 1 || limit < 1) {
        throw new Error('Invalid pagination parameters');
      }

      if (hotelId && isNaN(hotelId)) {
        throw new Error('Invalid hotel ID');
      }

      // Nếu có hotelId, kiểm tra hotel có tồn tại không
      if (hotelId) {
        const hotelExists = await hotelRepository.exists(hotelId);
        if (!hotelExists) {
          return {
            success: false,
            error: 'Hotel not found'
          };
        }
      }

      const result = await roomTypeRepository.findWithPagination(page, limit, hotelId);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Tìm kiếm room types
  async searchRoomTypes(searchTerm, hotelId = null) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters long');
      }

      if (hotelId && isNaN(hotelId)) {
        throw new Error('Invalid hotel ID');
      }

      const roomTypes = await roomTypeRepository.search(searchTerm.trim(), hotelId);
      return {
        success: true,
        data: roomTypes,
        count: roomTypes.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate dữ liệu room type
  validateRoomTypeData(data) {
    const errors = [];

    // Kiểm tra các field bắt buộc
    if (!data.hotelId) errors.push('Hotel ID is required');
    if (!data.name || data.name.trim().length === 0) errors.push('Name is required');
    if (!data.maxOccupancy || data.maxOccupancy < 1) errors.push('Max occupancy must be at least 1');
    if (!data.basePrice || data.basePrice < 0) errors.push('Base price must be non-negative');
    if (!data.numberOfRooms || data.numberOfRooms < 1) errors.push('Number of rooms must be at least 1');

    // Kiểm tra độ dài
    if (data.name && data.name.length > 100) errors.push('Name must be less than 100 characters');
    if (data.description && data.description.length > 500) errors.push('Description must be less than 500 characters');
    if (data.bedType && data.bedType.length > 50) errors.push('Bed type must be less than 50 characters');

    // Kiểm tra số
    if (data.maxOccupancy && (isNaN(data.maxOccupancy) || data.maxOccupancy > 20)) {
      errors.push('Max occupancy must be a valid number between 1 and 20');
    }

    if (data.basePrice && (isNaN(data.basePrice) || data.basePrice > 10000000)) {
      errors.push('Base price must be a valid number less than 10,000,000');
    }

    if (data.numberOfRooms && (isNaN(data.numberOfRooms) || data.numberOfRooms > 1000)) {
      errors.push('Number of rooms must be a valid number less than 1000');
    }

    if (data.areaSqm && (isNaN(data.areaSqm) || data.areaSqm < 1 || data.areaSqm > 1000)) {
      errors.push('Area must be a valid number between 1 and 1000 square meters');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  // Validate dữ liệu cập nhật
  validateUpdateData(data) {
    const errors = [];

    // Kiểm tra các field nếu có
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      errors.push('Name cannot be empty');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    if (data.bedType && data.bedType.length > 50) {
      errors.push('Bed type must be less than 50 characters');
    }

    if (data.maxOccupancy !== undefined && (isNaN(data.maxOccupancy) || data.maxOccupancy < 1 || data.maxOccupancy > 20)) {
      errors.push('Max occupancy must be a valid number between 1 and 20');
    }

    if (data.basePrice !== undefined && (isNaN(data.basePrice) || data.basePrice < 0 || data.basePrice > 10000000)) {
      errors.push('Base price must be a valid number between 0 and 10,000,000');
    }

    if (data.numberOfRooms !== undefined && (isNaN(data.numberOfRooms) || data.numberOfRooms < 1 || data.numberOfRooms > 1000)) {
      errors.push('Number of rooms must be a valid number between 1 and 1000');
    }

    if (data.areaSqm !== undefined && (isNaN(data.areaSqm) || data.areaSqm < 1 || data.areaSqm > 1000)) {
      errors.push('Area must be a valid number between 1 and 1000 square meters');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}

module.exports = new RoomTypeService();