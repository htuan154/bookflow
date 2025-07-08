const roomTypeService = require('../../api/v1/services/roomType.service');
const roomTypeRepository = require('../../api/v1/repositories/roomType.repository');
const hotelRepository = require('../../api/v1/repositories/hotel.repository');

// Mock repositories
jest.mock('../../api/v1/repositories/roomType.repository');
jest.mock('../../api/v1/repositories/hotel.repository');

describe('RoomTypeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoomType', () => {
    const validRoomTypeData = {
      hotelId: 1,
      name: 'Deluxe Room',
      description: 'Luxury room with ocean view',
      maxOccupancy: 2,
      basePrice: 1000000,
      numberOfRooms: 10,
      bedType: 'King',
      areaSqm: 30
    };

    it('should create room type successfully', async () => {
      // Mock repository responses
      hotelRepository.exists.mockResolvedValue(true);
      roomTypeRepository.findByHotelId.mockResolvedValue([]);
      roomTypeRepository.create.mockResolvedValue({ id: 1, ...validRoomTypeData });

      const result = await roomTypeService.createRoomType(validRoomTypeData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, ...validRoomTypeData });
      expect(result.message).toBe('Room type created successfully');
    });

    it('should fail when hotel does not exist', async () => {
      hotelRepository.exists.mockResolvedValue(false);

      const result = await roomTypeService.createRoomType(validRoomTypeData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hotel not found');
    });

    it('should fail when room type name already exists', async () => {
      hotelRepository.exists.mockResolvedValue(true);
      roomTypeRepository.findByHotelId.mockResolvedValue([
        { name: 'Deluxe Room', roomTypeId: 2 }
      ]);

      const result = await roomTypeService.createRoomType(validRoomTypeData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room type name already exists in this hotel');
    });

    it('should fail when required fields are missing', async () => {
      const invalidData = { ...validRoomTypeData };
      delete invalidData.name;

      const result = await roomTypeService.createRoomType(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    it('should fail when maxOccupancy is invalid', async () => {
      const invalidData = { ...validRoomTypeData, maxOccupancy: 0 };

      const result = await roomTypeService.createRoomType(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Max occupancy must be at least 1');
    });

    it('should fail when basePrice is negative', async () => {
      const invalidData = { ...validRoomTypeData, basePrice: -100 };

      const result = await roomTypeService.createRoomType(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Base price must be non-negative');
    });
  });

  describe('getAllRoomTypes', () => {
    it('should return all room types successfully', async () => {
      const mockRoomTypes = [
        { id: 1, name: 'Deluxe Room' },
        { id: 2, name: 'Standard Room' }
      ];
      roomTypeRepository.findAll.mockResolvedValue(mockRoomTypes);

      const result = await roomTypeService.getAllRoomTypes();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRoomTypes);
      expect(result.count).toBe(2);
    });

    it('should handle repository error', async () => {
      roomTypeRepository.findAll.mockRejectedValue(new Error('Database error'));

      const result = await roomTypeService.getAllRoomTypes();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getRoomTypeById', () => {
    it('should return room type by ID successfully', async () => {
      const mockRoomType = { id: 1, name: 'Deluxe Room' };
      roomTypeRepository.findById.mockResolvedValue(mockRoomType);

      const result = await roomTypeService.getRoomTypeById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRoomType);
    });

    it('should fail when room type ID is invalid', async () => {
      const result = await roomTypeService.getRoomTypeById('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid room type ID');
    });

    it('should fail when room type not found', async () => {
      roomTypeRepository.findById.mockResolvedValue(null);

      const result = await roomTypeService.getRoomTypeById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room type not found');
    });
  });

  describe('getRoomTypesByHotelId', () => {
    it('should return room types by hotel ID successfully', async () => {
      const mockRoomTypes = [{ id: 1, name: 'Deluxe Room' }];
      hotelRepository.exists.mockResolvedValue(true);
      roomTypeRepository.findByHotelId.mockResolvedValue(mockRoomTypes);

      const result = await roomTypeService.getRoomTypesByHotelId(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRoomTypes);
      expect(result.count).toBe(1);
    });

    it('should fail when hotel ID is invalid', async () => {
      const result = await roomTypeService.getRoomTypesByHotelId('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid hotel ID');
    });

    it('should fail when hotel not found', async () => {
      hotelRepository.exists.mockResolvedValue(false);

      const result = await roomTypeService.getRoomTypesByHotelId(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hotel not found');
    });
  });

  describe('updateRoomType', () => {
    const updateData = {
      name: 'Updated Room Name',
      description: 'Updated description',
      maxOccupancy: 3
    };

    it('should update room type successfully', async () => {
      const existingRoomType = { 
        roomTypeId: 1, 
        name: 'Old Name', 
        hotelId: 1 
      };
      const updatedRoomType = { 
        roomTypeId: 1, 
        ...updateData, 
        hotelId: 1 
      };

      roomTypeRepository.findById.mockResolvedValue(existingRoomType);
      roomTypeRepository.findByHotelId.mockResolvedValue([existingRoomType]);
      roomTypeRepository.update.mockResolvedValue(updatedRoomType);

      const result = await roomTypeService.updateRoomType(1, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedRoomType);
      expect(result.message).toBe('Room type updated successfully');
    });

    it('should fail when room type ID is invalid', async () => {
      const result = await roomTypeService.updateRoomType('invalid', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid room type ID');
    });

    it('should fail when room type not found', async () => {
      roomTypeRepository.findById.mockResolvedValue(null);

      const result = await roomTypeService.updateRoomType(999, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room type not found');
    });

    it('should fail when updated name already exists', async () => {
      const existingRoomType = { 
        roomTypeId: 1, 
        name: 'Old Name', 
        hotelId: 1 
      };
      const otherRoomType = { 
        roomTypeId: 2, 
        name: 'Updated Room Name', 
        hotelId: 1 
      };

      roomTypeRepository.findById.mockResolvedValue(existingRoomType);
      roomTypeRepository.findByHotelId.mockResolvedValue([existingRoomType, otherRoomType]);

      const result = await roomTypeService.updateRoomType(1, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room type name already exists in this hotel');
    });
  });

  describe('deleteRoomType', () => {
    it('should delete room type successfully', async () => {
      roomTypeRepository.exists.mockResolvedValue(true);
      roomTypeRepository.delete.mockResolvedValue(true);

      const result = await roomTypeService.deleteRoomType(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Room type deleted successfully');
    });

    it('should fail when room type ID is invalid', async () => {
      const result = await roomTypeService.deleteRoomType('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid room type ID');
    });

    it('should fail when room type not found', async () => {
      roomTypeRepository.exists.mockResolvedValue(false);

      const result = await roomTypeService.deleteRoomType(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room type not found');
    });

    it('should fail when deletion fails', async () => {
      roomTypeRepository.exists.mockResolvedValue(true);
      roomTypeRepository.delete.mockResolvedValue(false);

      const result = await roomTypeService.deleteRoomType(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete room type');
    });
  });

  describe('getRoomTypesWithPagination', () => {
    it('should return paginated room types successfully', async () => {
      const mockResult = {
        data: [{ id: 1, name: 'Deluxe Room' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      };
      roomTypeRepository.findWithPagination.mockResolvedValue(mockResult);

      const result = await roomTypeService.getRoomTypesWithPagination(1, 10);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(result.pagination).toEqual(mockResult.pagination);
    });

    it('should fail when pagination parameters are invalid', async () => {
      const result = await roomTypeService.getRoomTypesWithPagination(0, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid pagination parameters');
    });

    it('should fail when hotel ID is invalid', async () => {
      const result = await roomTypeService.getRoomTypesWithPagination(1, 10, 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid hotel ID');
    });

    it('should fail when hotel not found', async () => {
      hotelRepository.exists.mockResolvedValue(false);

      const result = await roomTypeService.getRoomTypesWithPagination(1, 10, 999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hotel not found');
    });
  });

  describe('searchRoomTypes', () => {
    it('should search room types successfully', async () => {
      const mockRoomTypes = [{ id: 1, name: 'Deluxe Room' }];
      roomTypeRepository.search.mockResolvedValue(mockRoomTypes);

      const result = await roomTypeService.searchRoomTypes('deluxe');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRoomTypes);
      expect(result.count).toBe(1);
    });

    it('should fail when search term is too short', async () => {
      const result = await roomTypeService.searchRoomTypes('a');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search term must be at least 2 characters long');
    });

    it('should fail when hotel ID is invalid', async () => {
      const result = await roomTypeService.searchRoomTypes('deluxe', 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid hotel ID');
    });
  });

  describe('validateRoomTypeData', () => {
    const validData = {
      hotelId: 1,
      name: 'Deluxe Room',
      maxOccupancy: 2,
      basePrice: 1000000,
      numberOfRooms: 10,
      description: 'Test description',
      bedType: 'King',
      areaSqm: 30
    };

    it('should validate valid data without throwing', () => {
      expect(() => {
        roomTypeService.validateRoomTypeData(validData);
      }).not.toThrow();
    });

    it('should throw error when hotel ID is missing', () => {
      const invalidData = { ...validData };
      delete invalidData.hotelId;

      expect(() => {
        roomTypeService.validateRoomTypeData(invalidData);
      }).toThrow('Hotel ID is required');
    });

    it('should throw error when name is too long', () => {
      const invalidData = { ...validData, name: 'a'.repeat(101) };

      expect(() => {
        roomTypeService.validateRoomTypeData(invalidData);
      }).toThrow('Name must be less than 100 characters');
    });

    it('should throw error when max occupancy is too high', () => {
      const invalidData = { ...validData, maxOccupancy: 25 };

      expect(() => {
        roomTypeService.validateRoomTypeData(invalidData);
      }).toThrow('Max occupancy must be a valid number between 1 and 20');
    });

    it('should throw error when base price is too high', () => {
      const invalidData = { ...validData, basePrice: 20000000 };

      expect(() => {
        roomTypeService.validateRoomTypeData(invalidData);
      }).toThrow('Base price must be a valid number less than 10,000,000');
    });
  });

  describe('validateUpdateData', () => {
    it('should validate valid update data without throwing', () => {
      const validUpdateData = {
        name: 'Updated Room',
        description: 'Updated description',
        maxOccupancy: 3
      };

      expect(() => {
        roomTypeService.validateUpdateData(validUpdateData);
      }).not.toThrow();
    });

    it('should throw error when name is empty', () => {
      const invalidData = { name: '' };

      expect(() => {
        roomTypeService.validateUpdateData(invalidData);
      }).toThrow('Name cannot be empty');
    });

    it('should throw error when max occupancy is invalid', () => {
      const invalidData = { maxOccupancy: 0 };

      expect(() => {
        roomTypeService.validateUpdateData(invalidData);
      }).toThrow('Max occupancy must be a valid number between 1 and 20');
    });

    it('should throw error when base price is negative', () => {
      const invalidData = { basePrice: -100 };

      expect(() => {
        roomTypeService.validateUpdateData(invalidData);
      }).toThrow('Base price must be a valid number between 0 and 10,000,000');
    });
  });
});