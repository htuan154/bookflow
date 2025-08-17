// src/api/v1/services/hotel.service.js
const hotelRepository = require('../repositories/hotel.repository');
const { AppError } = require('../../../utils/errors');

class HotelService {
  /**
   * Tạo mới khách sạn
   * @param {Object} hotelData - Dữ liệu khách sạn
   * @param {string} ownerId - ID chủ sở hữu
   * @returns {Promise<Object>}
   */
  async createHotel(hotelData, ownerId) {
    try {
      const hotel = await hotelRepository.create(hotelData, ownerId);

      return {
        success: true,
        message: 'Khách sạn đã được tạo thành công và đang chờ xét duyệt',
        data: hotel
      };
    } catch (error) {
      console.error('Lỗi khi tạo khách sạn:', error);
      if (error.code === '23505') {
        throw new AppError('Khách sạn với thông tin này đã tồn tại', 409);
      }
      throw error;
    }
  }

  /**
   * Lấy thông tin khách sạn theo ID
   */
  async getHotelById(hotelId) {
    const hotel = await hotelRepository.findById(hotelId);

    if (!hotel) {
      throw new AppError('Không tìm thấy khách sạn', 404);
    }

    return {
      success: true,
      data: hotel
    };
  }

  /**
   * Lấy danh sách tất cả khách sạn (có phân trang)
   */
  async getAllHotels(options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const hotels = await hotelRepository.findAll(limit, offset);

    return {
      success: true,
      data: hotels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: hotels.length
      }
    };
  }

  /**
   * Cập nhật khách sạn
   */
  async updateHotel(hotelId, updateData, userId) {
    const existingHotel = await hotelRepository.findById(hotelId);
    if (!existingHotel) {
      throw new AppError('Không tìm thấy khách sạn', 404);
    }

    if (existingHotel.ownerId !== userId) {
      throw new AppError('Bạn không có quyền cập nhật khách sạn này', 403);
    }

    const updatedHotel = await hotelRepository.update(hotelId, updateData);

    return {
      success: true,
      message: 'Cập nhật khách sạn thành công',
      data: updatedHotel
    };
  }

  /**
   * Xóa khách sạn (soft delete)
   */
  async deleteHotel(hotelId, userId) {
    const existingHotel = await hotelRepository.findById(hotelId);
    if (!existingHotel) {
      throw new AppError('Không tìm thấy khách sạn', 404);
    }

    if (existingHotel.ownerId !== userId) {
      throw new AppError('Bạn không có quyền xóa khách sạn này', 403);
    }

    await hotelRepository.softDelete(hotelId);

    return {
      success: true,
      message: 'Xóa khách sạn thành công'
    };
  }

  /**
   * Lấy khách sạn theo trạng thái
   */
  async getHotelsByStatus(status) {
    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Trạng thái không hợp lệ', 400);
    }

    const hotels = await hotelRepository.findByStatus(status);

    return {
      success: true,
      data: hotels
    };
  }

  /**
   * Cập nhật trạng thái khách sạn (Admin)
   */
  async updateHotelStatus(hotelId, newStatus) {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError('Trạng thái không hợp lệ', 400);
    }

    const existingHotel = await hotelRepository.findById(hotelId);
    if (!existingHotel) {
      throw new AppError('Không tìm thấy khách sạn', 404);
    }

    const updatedHotel = await hotelRepository.updateStatus(hotelId, newStatus);

    return {
      success: true,
      message: `Trạng thái khách sạn đã được cập nhật thành ${newStatus}`,
      data: updatedHotel
    };
  }

  /**
   * Lấy khách sạn theo chủ sở hữu
   */
  async getHotelsByOwner(ownerId) {
    const hotels = await hotelRepository.findByOwner(ownerId);

    return {
      success: true,
      data: hotels
    };
  }

  /**
   * Tìm kiếm khách sạn
   */
  async searchHotels(searchParams) {
    const { city, name, minRating, maxRating, page = 1, limit = 10 } = searchParams;
    const offset = (page - 1) * limit;

    let hotels = [];

    if (city) {
      hotels = await hotelRepository.findByCity(city);
    } else if (name) {
      hotels = await hotelRepository.searchByName(name);
    } else if (minRating || maxRating) {
      const min = minRating || 1;
      const max = maxRating || 5;
      hotels = await hotelRepository.findByRating(min, max);
    } else {
      const filters = {
        city,
        searchTerm: name,
        minRating,
        maxRating,
        status: 'approved'
      };
      hotels = await hotelRepository.findWithFilters(filters, limit, offset);
    }

    return {
      success: true,
      data: hotels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: hotels.length
      }
    };
  }

  /**
   * Thống kê khách sạn
   */
  async getHotelStatistics() {
    const pendingCount = await hotelRepository.countByStatus('pending');
    const approvedCount = await hotelRepository.countByStatus('approved');
    const rejectedCount = await hotelRepository.countByStatus('rejected');
    const deletedCount = await hotelRepository.countByStatus('deleted');

    return {
      success: true,
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        deleted: deletedCount,
        total: pendingCount + approvedCount + rejectedCount + deletedCount
      }
    };
  }

  /**
   * Lấy khách sạn phổ biến
   */
  async getPopularHotels(limit = 10) {
    const hotels = await hotelRepository.findByRating(4, 5);
    return {
      success: true,
      data: hotels.slice(0, limit)
    };
  }

  /**
   * Tìm kiếm khách sạn theo thành phố và phường/xã
   * @param {string} city - Tên thành phố/tỉnh
   * @param {string} ward - Tên phường/xã
   * @param {Object} options - Tùy chọn phân trang
   * @returns {Promise<Object>}
   */
  async getHotelsByCityAndWard(city, ward, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (!city || !ward) {
      throw new AppError('Vui lòng cung cấp đầy đủ thông tin thành phố và phường/xã', 400);
    }

    const hotels = await hotelRepository.findByCityAndWard(city, ward, limit, offset);
    const totalCount = await hotelRepository.countByCityAndWard(city, ward);

    return {
      success: true,
      message: `Tìm thấy ${totalCount} khách sạn tại ${ward}, ${city}`,
      data: hotels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Đếm số lượng khách sạn theo thành phố và phường/xã
   * @param {string} city - Tên thành phố/tỉnh
   * @param {string} ward - Tên phường/xã
   * @returns {Promise<Object>}
   */
  async countHotelsByCityAndWard(city, ward) {
    if (!city || !ward) {
      throw new AppError('Vui lòng cung cấp đầy đủ thông tin thành phố và phường/xã', 400);
    }

    const count = await hotelRepository.countByCityAndWard(city, ward);

    return {
      success: true,
      message: `Số lượng khách sạn tại ${ward}, ${city}`,
      data: {
        city,
        ward,
        count
      }
    };
  }
}

module.exports = new HotelService();
