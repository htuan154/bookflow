// __tests__/unit/hotel.service.unit.test.js

// Sửa lỗi đường dẫn: các file đều nằm trong 'src' nên chỉ cần đi lên 2 cấp
const hotelService = require('../../api/v1/services/hotel.service');
const hotelRepository = require('../../api/v1/repositories/hotel.repository');
const { AppError } = require('../../utils/errors');

// --- GIẢ LẬP (MOCK) CÁC THÀNH PHẦN PHỤ THUỘC ---

// Sửa lỗi đường dẫn
jest.mock('../../api/v1/repositories/hotel.repository');

// Sửa lỗi đường dẫn
jest.mock('../../validators/hotel.validator', () => ({
  validateHotelData: jest.fn(data => Promise.resolve(data)),
  validateHotelUpdate: jest.fn(data => Promise.resolve(data)),
}));


describe('Hotel Service - Unit Tests', () => {

  // Xóa tất cả các mock sau mỗi test để đảm bảo các test độc lập với nhau
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Test cho hàm createHotel ---
  describe('createHotel', () => {
    it('Nên tạo khách sạn thành công và trả về dữ liệu khách sạn', async () => {
      // Arrange: Chuẩn bị dữ liệu
      const hotelData = { name: 'Test Hotel', city: 'HCMC' };
      const ownerId = 'owner123';
      const createdHotel = { id: 'hotel-xyz', ...hotelData, owner_id: ownerId };

      // Giả lập repository.create trả về khách sạn đã tạo
      hotelRepository.create.mockResolvedValue(createdHotel);

      // Act: Gọi hàm cần test
      const result = await hotelService.createHotel(hotelData, ownerId);

      // Assert: Kiểm tra kết quả
      expect(hotelRepository.create).toHaveBeenCalledWith(hotelData, ownerId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdHotel);
      expect(result.message).toBe('Khách sạn đã được tạo thành công và đang chờ xét duyệt');
    });
  });

  // --- Test cho hàm getHotelById ---
  describe('getHotelById', () => {
    it('Nên trả về thông tin khách sạn nếu tìm thấy', async () => {
      // Arrange
      const hotelId = 'hotel-xyz';
      const mockHotel = { id: hotelId, name: 'Found Hotel' };
      hotelRepository.findById.mockResolvedValue(mockHotel);

      // Act
      const result = await hotelService.getHotelById(hotelId);

      // Assert
      expect(hotelRepository.findById).toHaveBeenCalledWith(hotelId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHotel);
    });

    it('Nên ném ra lỗi AppError 404 nếu không tìm thấy khách sạn', async () => {
      // Arrange
      const hotelId = 'non-existent-id';
      hotelRepository.findById.mockResolvedValue(null);

      // Act & Assert
      // expect(...).rejects.toThrow() dùng để kiểm tra các hàm async ném ra lỗi
      await expect(hotelService.getHotelById(hotelId)).rejects.toThrow(AppError);
      await expect(hotelService.getHotelById(hotelId)).rejects.toThrow('Không tìm thấy khách sạn');
    });
  });

  // --- Test cho hàm updateHotel ---
  describe('updateHotel', () => {
    const hotelId = 'hotel-xyz';
    const userId = 'owner123';
    const updateData = { name: 'Updated Hotel Name' };
    const existingHotel = { hotel_id: hotelId, name: 'Old Name', owner_id: userId };

    it('Nên cập nhật khách sạn thành công nếu người dùng là chủ sở hữu', async () => {
      // Arrange
      hotelRepository.findById.mockResolvedValue(existingHotel);
      hotelRepository.update.mockResolvedValue({ ...existingHotel, ...updateData });

      // Act
      const result = await hotelService.updateHotel(hotelId, updateData, userId);

      // Assert
      expect(hotelRepository.findById).toHaveBeenCalledWith(hotelId);
      expect(hotelRepository.update).toHaveBeenCalledWith(hotelId, updateData);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Hotel Name');
    });

    it('Nên ném ra lỗi AppError 403 nếu người dùng không phải chủ sở hữu', async () => {
      // Arrange
      const anotherUserId = 'not-the-owner';
      hotelRepository.findById.mockResolvedValue(existingHotel);

      // Act & Assert
      await expect(hotelService.updateHotel(hotelId, updateData, anotherUserId))
        .rejects.toThrow(new AppError('Bạn không có quyền cập nhật khách sạn này', 403));
    });

    it('Nên ném ra lỗi AppError 404 nếu khách sạn không tồn tại', async () => {
        // Arrange
        hotelRepository.findById.mockResolvedValue(null);
  
        // Act & Assert
        await expect(hotelService.updateHotel(hotelId, updateData, userId))
          .rejects.toThrow(new AppError('Không tìm thấy khách sạn', 404));
      });
  });

  // --- Test cho hàm deleteHotel ---
  describe('deleteHotel', () => {
    const hotelId = 'hotel-xyz';
    const userId = 'owner123';
    const existingHotel = { hotel_id: hotelId, name: 'Hotel to delete', owner_id: userId };

    it('Nên xóa mềm khách sạn thành công nếu người dùng là chủ sở hữu', async () => {
        // Arrange
        hotelRepository.findById.mockResolvedValue(existingHotel);
        hotelRepository.softDelete.mockResolvedValue(true); // Giả lập xóa thành công

        // Act
        const result = await hotelService.deleteHotel(hotelId, userId);

        // Assert
        expect(hotelRepository.findById).toHaveBeenCalledWith(hotelId);
        expect(hotelRepository.softDelete).toHaveBeenCalledWith(hotelId);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Xóa khách sạn thành công');
    });

    it('Nên ném ra lỗi AppError 403 nếu người dùng không phải chủ sở hữu', async () => {
        // Arrange
        const anotherUserId = 'not-the-owner';
        hotelRepository.findById.mockResolvedValue(existingHotel);

        // Act & Assert
        await expect(hotelService.deleteHotel(hotelId, anotherUserId))
            .rejects.toThrow(new AppError('Bạn không có quyền xóa khách sạn này', 403));
    });
  });

  // --- Test cho hàm getHotelStatistics ---
  describe('getHotelStatistics', () => {
    it('Nên trả về thống kê chính xác số lượng khách sạn theo từng trạng thái', async () => {
        // Arrange
        // Giả lập kết quả trả về từ repository cho mỗi lần gọi countByStatus
        hotelRepository.countByStatus
            .mockResolvedValueOnce(10) // pending
            .mockResolvedValueOnce(50) // approved
            .mockResolvedValueOnce(5)  // rejected
            .mockResolvedValueOnce(2); // deleted

        // Act
        const result = await hotelService.getHotelStatistics();

        // Assert
        expect(hotelRepository.countByStatus).toHaveBeenCalledWith('pending');
        // Sửa lỗi typo: 'countByстатус' -> 'countByStatus'
        expect(hotelRepository.countByStatus).toHaveBeenCalledWith('approved');
        expect(hotelRepository.countByStatus).toHaveBeenCalledWith('rejected');
        expect(hotelRepository.countByStatus).toHaveBeenCalledWith('deleted');
        
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
            pending: 10,
            approved: 50,
            rejected: 5,
            deleted: 2,
            total: 67
        });
    });
  });
});
