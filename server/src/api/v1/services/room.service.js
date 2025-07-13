const RoomRepository = require('../repositories/room.repository');
const roomTypeRepository = require('../repositories/roomType.repository');

class RoomService {
  constructor() {
    this.roomRepository = new RoomRepository();
  }

  // Create a new room
  async createRoom(roomData) {
    try {
      // Validate required fields
      if (!roomData.roomTypeId || !roomData.roomNumber || !roomData.floorNumber) {
        throw new Error('Room type ID, room number, and floor number are required');
      }

      // Check if room number already exists in the hotel
      const roomTypeExists = await this.roomRepository.findByRoomTypeId(roomData.roomTypeId);
      if (roomTypeExists.length > 0) {
        const hotelId = await this.getHotelIdByRoomType(roomData.roomTypeId);
        const roomExists = await this.roomRepository.roomNumberExists(roomData.roomNumber, hotelId);
        if (roomExists) {
          throw new Error('Room number already exists in this hotel');
        }
      }

      // Validate room status
      const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order'];
      if (roomData.status && !validStatuses.includes(roomData.status)) {
        throw new Error('Invalid room status');
      }

      return await this.roomRepository.create(roomData);
    } catch (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  // Get room by ID
  async getRoomById(roomId) {
    try {
      if (!roomId) {
        throw new Error('Room ID is required');
      }

      const room = await this.roomRepository.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      return room;
    } catch (error) {
      throw new Error(`Failed to get room: ${error.message}`);
    }
  }

  // Get room with details
  async getRoomWithDetails(roomId) {
    try {
      if (!roomId) {
        throw new Error('Room ID is required');
      }

      const room = await this.roomRepository.findByIdWithDetails(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      return room;
    } catch (error) {
      throw new Error(`Failed to get room details: ${error.message}`);
    }
  }

  // Get all rooms
  async getAllRooms() {
    try {
      return await this.roomRepository.findAll();
    } catch (error) {
      throw new Error(`Failed to get rooms: ${error.message}`);
    }
  }

  // Get rooms by hotel ID
  async getRoomsByHotelId(hotelId) {
    try {
      if (!hotelId) {
        throw new Error('Hotel ID is required');
      }

      return await this.roomRepository.findByHotelId(hotelId);
    } catch (error) {
      throw new Error(`Failed to get rooms by hotel: ${error.message}`);
    }
  }

  // Get rooms by room type ID
  async getRoomsByRoomTypeId(roomTypeId) {
    try {
      if (!roomTypeId) {
        throw new Error('Room type ID is required');
      }

      return await this.roomRepository.findByRoomTypeId(roomTypeId);
    } catch (error) {
      throw new Error(`Failed to get rooms by room type: ${error.message}`);
    }
  }

  // Get available rooms for booking
  async getAvailableRooms(hotelId, checkInDate, checkOutDate) {
    try {
      if (!hotelId || !checkInDate || !checkOutDate) {
        throw new Error('Hotel ID, check-in date, and check-out date are required');
      }

      // Validate dates
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const now = new Date();

      if (checkIn < now) {
        throw new Error('Check-in date cannot be in the past');
      }

      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }

      return await this.roomRepository.findAvailableRooms(hotelId, checkInDate, checkOutDate);
    } catch (error) {
      throw new Error(`Failed to get available rooms: ${error.message}`);
    }
  }

  // Get rooms by status
  async getRoomsByStatus(status) {
    try {
      if (!status) {
        throw new Error('Status is required');
      }

      const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid room status');
      }

      return await this.roomRepository.findByStatus(status);
    } catch (error) {
      throw new Error(`Failed to get rooms by status: ${error.message}`);
    }
  }

  // Update room
  async updateRoom(roomId, updateData) {
    try {
      if (!roomId) {
        throw new Error('Room ID is required');
      }

      // Check if room exists
      const existingRoom = await this.roomRepository.findById(roomId);
      if (!existingRoom) {
        throw new Error('Room not found');
      }

      // Validate room number uniqueness if it's being updated
      if (updateData.roomNumber && updateData.roomNumber !== existingRoom.roomNumber) {
        const hotelId = await this.getHotelIdByRoomType(existingRoom.roomTypeId);
        const roomExists = await this.roomRepository.roomNumberExists(
          updateData.roomNumber, 
          hotelId, 
          roomId
        );
        if (roomExists) {
          throw new Error('Room number already exists in this hotel');
        }
      }

      // Validate room status
      if (updateData.status) {
        const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order'];
        if (!validStatuses.includes(updateData.status)) {
          throw new Error('Invalid room status');
        }
      }

      return await this.roomRepository.update(roomId, updateData);
    } catch (error) {
      throw new Error(`Failed to update room: ${error.message}`);
    }
  }

  // Update room status
  async updateRoomStatus(roomId, status) {
    try {
      if (!roomId || !status) {
        throw new Error('Room ID and status are required');
      }

      const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid room status');
      }

      // Check if room exists
      const existingRoom = await this.roomRepository.findById(roomId);
      if (!existingRoom) {
        throw new Error('Room not found');
      }

      return await this.roomRepository.updateStatus(roomId, status);
    } catch (error) {
      throw new Error(`Failed to update room status: ${error.message}`);
    }
  }

  // Delete room
  async deleteRoom(roomId) {
    try {
      if (!roomId) {
        throw new Error('Room ID is required');
      }

      // Check if room exists
      const existingRoom = await this.roomRepository.findById(roomId);
      if (!existingRoom) {
        throw new Error('Room not found');
      }

      // Check if room has active bookings
      const hasActiveBookings = await this.checkActiveBookings(roomId);
      if (hasActiveBookings) {
        throw new Error('Cannot delete room with active bookings');
      }

      const deleted = await this.roomRepository.delete(roomId);
      if (!deleted) {
        throw new Error('Failed to delete room');
      }

      return { success: true, message: 'Room deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete room: ${error.message}`);
    }
  }

  // Get room statistics by hotel
  async getRoomStatsByHotel(hotelId) {
    try {
      if (!hotelId) {
        throw new Error('Hotel ID is required');
      }

      return await this.roomRepository.getRoomStatsByHotel(hotelId);
    } catch (error) {
      throw new Error(`Failed to get room statistics: ${error.message}`);
    }
  }

  // Check room availability for specific dates
  async checkRoomAvailability(roomId, checkInDate, checkOutDate) {
    try {
      if (!roomId || !checkInDate || !checkOutDate) {
        throw new Error('Room ID, check-in date, and check-out date are required');
      }

      const room = await this.roomRepository.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      if (room.status !== 'available') {
        return { available: false, reason: 'Room is not available' };
      }

      // Check for booking conflicts
      const hasConflict = await this.checkBookingConflict(roomId, checkInDate, checkOutDate);
      if (hasConflict) {
        return { available: false, reason: 'Room is already booked for these dates' };
      }

      return { available: true };
    } catch (error) {
      throw new Error(`Failed to check room availability: ${error.message}`);
    }
  }

  // Helper methods
  async getHotelIdByRoomType(roomTypeId) {
      // Dùng repository để tìm loại phòng
      const roomType = await roomTypeRepository.findById(roomTypeId);
      if (!roomType) {
          throw new AppError('Room type not found', 404);
      }
      // Trả về hotelId từ đối tượng roomType
      return roomType.hotelId;
    }

  async checkActiveBookings(roomId) {
    // This would check booking repository
    // For now, return false
    return false;
  }

  async checkBookingConflict(roomId, checkInDate, checkOutDate) {
    // This would check booking repository for conflicts
    // For now, return false
    return false;
  }
}

module.exports = RoomService;