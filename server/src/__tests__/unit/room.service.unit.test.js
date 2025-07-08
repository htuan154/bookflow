const RoomService = require('../../api/v1/services/room.service');
const RoomRepository = require('../../api/v1/repositories/room.repository');

// Mock the RoomRepository
jest.mock('../../api/v1/repositories/room.repository');

describe('RoomService', () => {
  let roomService;
  let mockRoomRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create mock repository instance
    mockRoomRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithDetails: jest.fn(),
      findAll: jest.fn(),
      findByHotelId: jest.fn(),
      findByRoomTypeId: jest.fn(),
      findAvailableRooms: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
      getRoomStatsByHotel: jest.fn(),
      roomNumberExists: jest.fn()
    };

    // Mock the constructor to return our mock instance
    RoomRepository.mockImplementation(() => mockRoomRepository);
    
    // Create service instance
    roomService = new RoomService();
  });

  describe('createRoom', () => {
    const validRoomData = {
      roomTypeId: 1,
      roomNumber: '101',
      floorNumber: 1,
      status: 'available'
    };

    it('should create a room successfully', async () => {
      const createdRoom = { id: 1, ...validRoomData };
      mockRoomRepository.findByRoomTypeId.mockResolvedValue([{ id: 1 }]);
      mockRoomRepository.roomNumberExists.mockResolvedValue(false);
      mockRoomRepository.create.mockResolvedValue(createdRoom);
      
      // Mock helper method
      jest.spyOn(roomService, 'getHotelIdByRoomType').mockResolvedValue(1);

      const result = await roomService.createRoom(validRoomData);

      expect(result).toEqual(createdRoom);
      expect(mockRoomRepository.create).toHaveBeenCalledWith(validRoomData);
    });

    it('should throw error if required fields are missing', async () => {
      const invalidRoomData = { roomNumber: '101' };

      await expect(roomService.createRoom(invalidRoomData))
        .rejects.toThrow('Failed to create room: Room type ID, room number, and floor number are required');
    });

    it('should throw error if room number already exists', async () => {
      mockRoomRepository.findByRoomTypeId.mockResolvedValue([{ id: 1 }]);
      mockRoomRepository.roomNumberExists.mockResolvedValue(true);
      jest.spyOn(roomService, 'getHotelIdByRoomType').mockResolvedValue(1);

      await expect(roomService.createRoom(validRoomData))
        .rejects.toThrow('Failed to create room: Room number already exists in this hotel');
    });

    it('should throw error for invalid room status', async () => {
      const invalidStatusRoomData = { ...validRoomData, status: 'invalid_status' };
      
      // Mock to avoid the findByRoomTypeId call that causes the error
      mockRoomRepository.findByRoomTypeId.mockResolvedValue([]);

      await expect(roomService.createRoom(invalidStatusRoomData))
        .rejects.toThrow('Failed to create room: Invalid room status');
    });

    it('should handle repository error', async () => {
      mockRoomRepository.findByRoomTypeId.mockRejectedValue(new Error('Database error'));

      await expect(roomService.createRoom(validRoomData))
        .rejects.toThrow('Failed to create room: Database error');
    });
  });

  describe('getRoomById', () => {
    it('should return room by ID successfully', async () => {
      const room = { id: 1, roomNumber: '101' };
      mockRoomRepository.findById.mockResolvedValue(room);

      const result = await roomService.getRoomById(1);

      expect(result).toEqual(room);
      expect(mockRoomRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error if room ID is not provided', async () => {
      await expect(roomService.getRoomById(null))
        .rejects.toThrow('Failed to get room: Room ID is required');
    });

    it('should throw error if room not found', async () => {
      mockRoomRepository.findById.mockResolvedValue(null);

      await expect(roomService.getRoomById(1))
        .rejects.toThrow('Failed to get room: Room not found');
    });
  });

  describe('getRoomWithDetails', () => {
    it('should return room with details successfully', async () => {
      const roomWithDetails = { id: 1, roomNumber: '101', roomType: { name: 'Standard' } };
      mockRoomRepository.findByIdWithDetails.mockResolvedValue(roomWithDetails);

      const result = await roomService.getRoomWithDetails(1);

      expect(result).toEqual(roomWithDetails);
      expect(mockRoomRepository.findByIdWithDetails).toHaveBeenCalledWith(1);
    });

    it('should throw error if room ID is not provided', async () => {
      await expect(roomService.getRoomWithDetails(null))
        .rejects.toThrow('Failed to get room details: Room ID is required');
    });

    it('should throw error if room not found', async () => {
      mockRoomRepository.findByIdWithDetails.mockResolvedValue(null);

      await expect(roomService.getRoomWithDetails(1))
        .rejects.toThrow('Failed to get room details: Room not found');
    });
  });

  describe('getAllRooms', () => {
    it('should return all rooms successfully', async () => {
      const rooms = [{ id: 1, roomNumber: '101' }, { id: 2, roomNumber: '102' }];
      mockRoomRepository.findAll.mockResolvedValue(rooms);

      const result = await roomService.getAllRooms();

      expect(result).toEqual(rooms);
      expect(mockRoomRepository.findAll).toHaveBeenCalled();
    });

    it('should handle repository error', async () => {
      mockRoomRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(roomService.getAllRooms())
        .rejects.toThrow('Failed to get rooms: Database error');
    });
  });

  describe('getRoomsByHotelId', () => {
    it('should return rooms by hotel ID successfully', async () => {
      const rooms = [{ id: 1, roomNumber: '101' }];
      mockRoomRepository.findByHotelId.mockResolvedValue(rooms);

      const result = await roomService.getRoomsByHotelId(1);

      expect(result).toEqual(rooms);
      expect(mockRoomRepository.findByHotelId).toHaveBeenCalledWith(1);
    });

    it('should throw error if hotel ID is not provided', async () => {
      await expect(roomService.getRoomsByHotelId(null))
        .rejects.toThrow('Failed to get rooms by hotel: Hotel ID is required');
    });
  });

  describe('getRoomsByRoomTypeId', () => {
    it('should return rooms by room type ID successfully', async () => {
      const rooms = [{ id: 1, roomNumber: '101' }];
      mockRoomRepository.findByRoomTypeId.mockResolvedValue(rooms);

      const result = await roomService.getRoomsByRoomTypeId(1);

      expect(result).toEqual(rooms);
      expect(mockRoomRepository.findByRoomTypeId).toHaveBeenCalledWith(1);
    });

    it('should throw error if room type ID is not provided', async () => {
      await expect(roomService.getRoomsByRoomTypeId(null))
        .rejects.toThrow('Failed to get rooms by room type: Room type ID is required');
    });
  });

  describe('getAvailableRooms', () => {
    const validParams = {
      hotelId: 1,
      checkInDate: '2024-12-01',
      checkOutDate: '2024-12-05'
    };

    beforeEach(() => {
      // Mock current date to be before check-in date
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-11-01').getTime());
      // Also mock the Date constructor to return predictable dates
      const originalDate = Date;
      global.Date = jest.fn((...args) => {
        if (args.length === 0) {
          return new originalDate('2024-11-01');
        }
        return new originalDate(...args);
      });
      global.Date.now = jest.fn(() => new Date('2024-11-01').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
      // Restore original Date
      global.Date = Date;
    });

    it('should return available rooms successfully', async () => {
      const availableRooms = [{ id: 1, roomNumber: '101' }];
      mockRoomRepository.findAvailableRooms.mockResolvedValue(availableRooms);

      const result = await roomService.getAvailableRooms(
        validParams.hotelId,
        validParams.checkInDate,
        validParams.checkOutDate
      );

      expect(result).toEqual(availableRooms);
      expect(mockRoomRepository.findAvailableRooms).toHaveBeenCalledWith(
        validParams.hotelId,
        validParams.checkInDate,
        validParams.checkOutDate
      );
    });

    it('should throw error if required parameters are missing', async () => {
      await expect(roomService.getAvailableRooms(null, validParams.checkInDate, validParams.checkOutDate))
        .rejects.toThrow('Failed to get available rooms: Hotel ID, check-in date, and check-out date are required');
    });

    it('should throw error if check-in date is in the past', async () => {
      const pastDate = '2024-10-01';
      
      await expect(roomService.getAvailableRooms(validParams.hotelId, pastDate, validParams.checkOutDate))
        .rejects.toThrow('Failed to get available rooms: Check-in date cannot be in the past');
    });

    it('should throw error if check-out date is before check-in date', async () => {
      const invalidCheckOut = '2024-11-30'; // Before check-in date
      
      await expect(roomService.getAvailableRooms(validParams.hotelId, validParams.checkInDate, invalidCheckOut))
        .rejects.toThrow('Failed to get available rooms: Check-out date must be after check-in date');
    });

    it('should throw error if check-out date equals check-in date', async () => {
      const sameDate = '2024-12-01';
      
      await expect(roomService.getAvailableRooms(validParams.hotelId, sameDate, sameDate))
        .rejects.toThrow('Failed to get available rooms: Check-out date must be after check-in date');
    });
  });

  describe('getRoomsByStatus', () => {
    it('should return rooms by status successfully', async () => {
      const rooms = [{ id: 1, roomNumber: '101', status: 'available' }];
      mockRoomRepository.findByStatus.mockResolvedValue(rooms);

      const result = await roomService.getRoomsByStatus('available');

      expect(result).toEqual(rooms);
      expect(mockRoomRepository.findByStatus).toHaveBeenCalledWith('available');
    });

    it('should throw error if status is not provided', async () => {
      await expect(roomService.getRoomsByStatus(null))
        .rejects.toThrow('Failed to get rooms by status: Status is required');
    });

    it('should throw error for invalid status', async () => {
      await expect(roomService.getRoomsByStatus('invalid_status'))
        .rejects.toThrow('Failed to get rooms by status: Invalid room status');
    });
  });

  describe('updateRoom', () => {
    const roomId = 1;
    const existingRoom = { id: 1, roomNumber: '101', roomTypeId: 1 };
    const updateData = { roomNumber: '102' };

    it('should update room successfully', async () => {
      const updatedRoom = { ...existingRoom, ...updateData };
      mockRoomRepository.findById.mockResolvedValue(existingRoom);
      mockRoomRepository.roomNumberExists.mockResolvedValue(false);
      mockRoomRepository.update.mockResolvedValue(updatedRoom);
      jest.spyOn(roomService, 'getHotelIdByRoomType').mockResolvedValue(1);

      const result = await roomService.updateRoom(roomId, updateData);

      expect(result).toEqual(updatedRoom);
      expect(mockRoomRepository.update).toHaveBeenCalledWith(roomId, updateData);
    });

    it('should throw error if room ID is not provided', async () => {
      await expect(roomService.updateRoom(null, updateData))
        .rejects.toThrow('Failed to update room: Room ID is required');
    });

    it('should throw error if room not found', async () => {
      mockRoomRepository.findById.mockResolvedValue(null);

      await expect(roomService.updateRoom(roomId, updateData))
        .rejects.toThrow('Failed to update room: Room not found');
    });

    it('should throw error if room number already exists', async () => {
      mockRoomRepository.findById.mockResolvedValue(existingRoom);
      mockRoomRepository.roomNumberExists.mockResolvedValue(true);
      jest.spyOn(roomService, 'getHotelIdByRoomType').mockResolvedValue(1);

      await expect(roomService.updateRoom(roomId, updateData))
        .rejects.toThrow('Failed to update room: Room number already exists in this hotel');
    });

    it('should throw error for invalid status', async () => {
      const invalidStatusUpdate = { status: 'invalid_status' };
      mockRoomRepository.findById.mockResolvedValue(existingRoom);

      await expect(roomService.updateRoom(roomId, invalidStatusUpdate))
        .rejects.toThrow('Failed to update room: Invalid room status');
    });
  });

  describe('updateRoomStatus', () => {
    const roomId = 1;
    const existingRoom = { id: 1, roomNumber: '101', status: 'available' };

    it('should update room status successfully', async () => {
      const updatedRoom = { ...existingRoom, status: 'occupied' };
      mockRoomRepository.findById.mockResolvedValue(existingRoom);
      mockRoomRepository.updateStatus.mockResolvedValue(updatedRoom);

      const result = await roomService.updateRoomStatus(roomId, 'occupied');

      expect(result).toEqual(updatedRoom);
      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(roomId, 'occupied');
    });

    it('should throw error if room ID or status is not provided', async () => {
      await expect(roomService.updateRoomStatus(null, 'occupied'))
        .rejects.toThrow('Failed to update room status: Room ID and status are required');

      await expect(roomService.updateRoomStatus(roomId, null))
        .rejects.toThrow('Failed to update room status: Room ID and status are required');
    });

    it('should throw error for invalid status', async () => {
      await expect(roomService.updateRoomStatus(roomId, 'invalid_status'))
        .rejects.toThrow('Failed to update room status: Invalid room status');
    });

    it('should throw error if room not found', async () => {
      mockRoomRepository.findById.mockResolvedValue(null);

      await expect(roomService.updateRoomStatus(roomId, 'occupied'))
        .rejects.toThrow('Failed to update room status: Room not found');
    });
  });

  describe('deleteRoom', () => {
    const roomId = 1;
    const existingRoom = { id: 1, roomNumber: '101' };

    it('should delete room successfully', async () => {
      mockRoomRepository.findById.mockResolvedValue(existingRoom);
      mockRoomRepository.delete.mockResolvedValue(true);
      jest.spyOn(roomService, 'checkActiveBookings').mockResolvedValue(false);

      const result = await roomService.deleteRoom(roomId);

      expect(result).toEqual({ success: true, message: 'Room deleted successfully' });
      expect(mockRoomRepository.delete).toHaveBeenCalledWith(roomId);
    });

    it('should throw error if room ID is not provided', async () => {
      await expect(roomService.deleteRoom(null))
        .rejects.toThrow('Failed to delete room: Room ID is required');
    });

    it('should throw error if room not found', async () => {
      mockRoomRepository.findById.mockResolvedValue(null);

      await expect(roomService.deleteRoom(roomId))
        .rejects.toThrow('Failed to delete room: Room not found');
    });

    it('should throw error if room has active bookings', async () => {
      mockRoomRepository.findById.mockResolvedValue(existingRoom);
      jest.spyOn(roomService, 'checkActiveBookings').mockResolvedValue(true);

      await expect(roomService.deleteRoom(roomId))
        .rejects.toThrow('Failed to delete room: Cannot delete room with active bookings');
    });

    it('should throw error if deletion fails', async () => {
      mockRoomRepository.findById.mockResolvedValue(existingRoom);
      mockRoomRepository.delete.mockResolvedValue(false);
      jest.spyOn(roomService, 'checkActiveBookings').mockResolvedValue(false);

      await expect(roomService.deleteRoom(roomId))
        .rejects.toThrow('Failed to delete room: Failed to delete room');
    });
  });

  describe('getRoomStatsByHotel', () => {
    it('should return room statistics successfully', async () => {
      const stats = { total: 10, available: 8, occupied: 2 };
      mockRoomRepository.getRoomStatsByHotel.mockResolvedValue(stats);

      const result = await roomService.getRoomStatsByHotel(1);

      expect(result).toEqual(stats);
      expect(mockRoomRepository.getRoomStatsByHotel).toHaveBeenCalledWith(1);
    });

    it('should throw error if hotel ID is not provided', async () => {
      await expect(roomService.getRoomStatsByHotel(null))
        .rejects.toThrow('Failed to get room statistics: Hotel ID is required');
    });
  });

  describe('checkRoomAvailability', () => {
    const roomId = 1;
    const checkInDate = '2024-12-01';
    const checkOutDate = '2024-12-05';
    const availableRoom = { id: 1, roomNumber: '101', status: 'available' };

    it('should return room as available', async () => {
      mockRoomRepository.findById.mockResolvedValue(availableRoom);
      jest.spyOn(roomService, 'checkBookingConflict').mockResolvedValue(false);

      const result = await roomService.checkRoomAvailability(roomId, checkInDate, checkOutDate);

      expect(result).toEqual({ available: true });
    });

    it('should throw error if required parameters are missing', async () => {
      await expect(roomService.checkRoomAvailability(null, checkInDate, checkOutDate))
        .rejects.toThrow('Failed to check room availability: Room ID, check-in date, and check-out date are required');
    });

    it('should throw error if room not found', async () => {
      mockRoomRepository.findById.mockResolvedValue(null);

      await expect(roomService.checkRoomAvailability(roomId, checkInDate, checkOutDate))
        .rejects.toThrow('Failed to check room availability: Room not found');
    });

    it('should return unavailable if room status is not available', async () => {
      const unavailableRoom = { ...availableRoom, status: 'maintenance' };
      mockRoomRepository.findById.mockResolvedValue(unavailableRoom);

      const result = await roomService.checkRoomAvailability(roomId, checkInDate, checkOutDate);

      expect(result).toEqual({ available: false, reason: 'Room is not available' });
    });

    it('should return unavailable if room has booking conflict', async () => {
      mockRoomRepository.findById.mockResolvedValue(availableRoom);
      jest.spyOn(roomService, 'checkBookingConflict').mockResolvedValue(true);

      const result = await roomService.checkRoomAvailability(roomId, checkInDate, checkOutDate);

      expect(result).toEqual({ available: false, reason: 'Room is already booked for these dates' });
    });
  });

  describe('Helper methods', () => {
    describe('getHotelIdByRoomType', () => {
      it('should return hotel ID', async () => {
        const result = await roomService.getHotelIdByRoomType(1);
        expect(result).toBe(1);
      });
    });

    describe('checkActiveBookings', () => {
      it('should return false for no active bookings', async () => {
        const result = await roomService.checkActiveBookings(1);
        expect(result).toBe(false);
      });
    });

    describe('checkBookingConflict', () => {
      it('should return false for no booking conflict', async () => {
        const result = await roomService.checkBookingConflict(1, '2024-12-01', '2024-12-05');
        expect(result).toBe(false);
      });
    });
  });
});