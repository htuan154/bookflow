const RoomService = require('../services/room.service');
const roomTypeRepository = require('../repositories/roomType.repository');

class RoomController {
  constructor() {
    this.roomService = new RoomService();
  }

  // Create a new room
  async createRoom(req, res) {
    try {
      const { roomTypeId, roomNumber, floorNumber, status } = req.body;

      const roomData = {
        roomTypeId,
        roomNumber,
        floorNumber,
        status: status || 'available'
      };

      const room = await this.roomService.createRoom(roomData);

      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: room
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get room by ID
  async getRoomById(req, res) {
    try {
      const { id } = req.params;
      const room = await this.roomService.getRoomById(id);

      res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      const statusCode = error.message === 'Room not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get room with details
  async getRoomWithDetails(req, res) {
    try {
      const { id } = req.params;
      const room = await this.roomService.getRoomWithDetails(id);

      res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      const statusCode = error.message === 'Room not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all rooms
  async getAllRooms(req, res) {
    try {
      const rooms = await this.roomService.getAllRooms();

      res.status(200).json({
        success: true,
        data: rooms,
        count: rooms.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get rooms by hotel ID
  async getRoomsByHotelId(req, res) {
    try {
      const { hotelId } = req.params;
      const rooms = await this.roomService.getRoomsByHotelId(hotelId);

      res.status(200).json({
        success: true,
        data: rooms,
        count: rooms.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get rooms by room type ID
  async getRoomsByRoomTypeId(req, res) {
    try {
      const { roomTypeId } = req.params;
      const rooms = await this.roomService.getRoomsByRoomTypeId(roomTypeId);

      res.status(200).json({
        success: true,
        data: rooms,
        count: rooms.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get available rooms
  async getAvailableRooms(req, res) {
    try {
      const { hotelId } = req.params;
      const { checkInDate, checkOutDate } = req.query;

      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'Check-in date and check-out date are required'
        });
      }

      const rooms = await this.roomService.getAvailableRooms(hotelId, checkInDate, checkOutDate);

      res.status(200).json({
        success: true,
        data: rooms,
        count: rooms.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get rooms by status
  async getRoomsByStatus(req, res) {
    try {
      const { status } = req.params;
      const rooms = await this.roomService.getRoomsByStatus(status);

      res.status(200).json({
        success: true,
        data: rooms,
        count: rooms.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update room
  async updateRoom(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const room = await this.roomService.updateRoom(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Room updated successfully',
        data: room
      });
    } catch (error) {
      const statusCode = error.message === 'Room not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update room status
  async updateRoomStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const room = await this.roomService.updateRoomStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Room status updated successfully',
        data: room
      });
    } catch (error) {
      const statusCode = error.message === 'Room not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete room
  async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      const result = await this.roomService.deleteRoom(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message === 'Room not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Bulk create rooms
  async createRoomsBulk(req, res) {
    try {
      // Expect an array of rooms in body: { rooms: [ { roomTypeId, roomNumber, floorNumber, status }, ... ] }
      const payload = req.body && (req.body.rooms || req.body);
      const rooms = Array.isArray(payload) ? payload : [];

      if (!rooms || rooms.length === 0) {
        return res.status(400).json({ success: false, message: 'No rooms provided' });
      }

      const created = await this.roomService.createRoomsBulk(rooms);

      res.status(201).json({ success: true, message: 'Rooms created successfully', data: created, count: created.length });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Bulk delete rooms
  async deleteRoomsBulk(req, res) {
    try {
      // Debug logging
      console.log('🔍 DELETE /bulk - req.body:', req.body);
      console.log('🔍 DELETE /bulk - req.body.roomIds:', req.body?.roomIds);
      
      // Expect an array of room IDs in body: { roomIds: [...] }
      const payload = req.body && (req.body.roomIds || req.body);
      const roomIds = Array.isArray(payload) ? payload : [];
      
      console.log('🔍 DELETE /bulk - Extracted roomIds:', roomIds);

      if (!roomIds || roomIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Room IDs array is required' });
      }

      const result = await this.roomService.deleteRoomsBulk(roomIds);

      res.status(200).json({ 
        success: true, 
        message: `Successfully deleted ${result.deletedCount} rooms`,
        data: result
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get room statistics by hotel
  async getRoomStatsByHotel(req, res) {
    try {
      const { hotelId } = req.params;
      const stats = await this.roomService.getRoomStatsByHotel(hotelId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check room availability
  async checkRoomAvailability(req, res) {
    try {
      const { id } = req.params;
      const { checkInDate, checkOutDate } = req.query;

      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'Check-in date and check-out date are required'
        });
      }

      const availability = await this.roomService.checkRoomAvailability(id, checkInDate, checkOutDate);

      res.status(200).json({
        success: true,
        data: availability
      });
    } catch (error) {
      const statusCode = error.message === 'Room not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search rooms with filters
  async searchRooms(req, res) {
    try {
      const { hotelId, roomTypeId, status, floorNumber, minPrice, maxPrice } = req.query;

      let rooms;

      if (hotelId) {
        rooms = await this.roomService.getRoomsByHotelId(hotelId);
      } else if (roomTypeId) {
        rooms = await this.roomService.getRoomsByRoomTypeId(roomTypeId);
      } else if (status) {
        rooms = await this.roomService.getRoomsByStatus(status);
      } else {
        rooms = await this.roomService.getAllRooms();
      }

      // Apply additional filters
      if (floorNumber) {
        rooms = rooms.filter(room => room.floorNumber == floorNumber);
      }

      // Note: Price filtering would need room type details
      // This is a placeholder for when you have room type service
      if (minPrice || maxPrice) {
        // Would need to fetch room type details to filter by price
        // For now, just return unfiltered results
      }

      res.status(200).json({
        success: true,
        data: rooms,
        count: rooms.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = RoomController;