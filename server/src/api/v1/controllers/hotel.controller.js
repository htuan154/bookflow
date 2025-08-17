// src/api/v1/controllers/hotel.controller.js
const hotelService = require('../services/hotel.service');
const { AppError } = require('../../../utils/errors');
const { successResponse, errorResponse } = require('../../../utils/response');

class HotelController {
  /**
   * Tạo mới khách sạn
   * POST /api/v1/hotels
   */
  async createHotel(req, res, next) {
    try {
      const result = await hotelService.createHotel(req.body, req.user.id);
      successResponse(res, result.data, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin khách sạn theo ID
   * GET /api/v1/hotels/:id
   */
  async getHotelById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.getHotelById(id);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách tất cả khách sạn
   * GET /api/v1/hotels
   */
  async getAllHotels(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await hotelService.getAllHotels({ page, limit });
      successResponse(res, result.data, 'Lấy danh sách khách sạn thành công', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật thông tin khách sạn
   * PUT /api/v1/hotels/:id
   */
  async updateHotel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.updateHotel(id, req.body, req.user.id);
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa khách sạn
   * DELETE /api/v1/hotels/:id
   */
  async deleteHotel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.deleteHotel(id, req.user.id);
      successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy khách sạn theo chủ sở hữu
   * GET /api/v1/hotels/owner/:ownerId
   */
  async getHotelsByOwner(req, res, next) {
    try {
      const { ownerId } = req.params;
      
      // Chỉ admin hoặc chính chủ sở hữu mới được xem
      if (req.user.role !== 'admin' && req.user.id !== ownerId) {
        throw new AppError('Không có quyền truy cập', 403);
      }
      
      const result = await hotelService.getHotelsByOwner(ownerId);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy khách sạn của user hiện tại
   * GET /api/v1/hotels/my-hotels
   */
  async getMyHotels(req, res, next) {
    try {
      const result = await hotelService.getHotelsByOwner(req.user.id);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tìm kiếm khách sạn
   * GET /api/v1/hotels/search
   */
  async searchHotels(req, res, next) {
    try {
      const result = await hotelService.searchHotels(req.query);
      successResponse(res, result.data, 'Tìm kiếm thành công', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy khách sạn phổ biến
   * GET /api/v1/hotels/popular
   */
  async getPopularHotels(req, res, next) {
    try {
      const { limit } = req.query;
      const result = await hotelService.getPopularHotels(limit);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  // === ADMIN ENDPOINTS ===

  /**
   * Lấy danh sách khách sạn theo trạng thái (Admin only)
   * GET /api/v1/admin/hotels/status/:status
   */
  async getHotelsByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const result = await hotelService.getHotelsByStatus(status);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật trạng thái khách sạn (Admin only)
   * PATCH /api/v1/admin/hotels/:id/status
   */
  async updateHotelStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        throw new AppError('Trạng thái không được để trống', 400);
      }
      
      const result = await hotelService.updateHotelStatus(id, status);
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thống kê khách sạn (Admin only)
   * GET /api/v1/admin/hotels/statistics
   */
  async getHotelStatistics(req, res, next) {
    try {
      const result = await hotelService.getHotelStatistics();
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách khách sạn chờ duyệt (Admin only)
   * GET /api/v1/admin/hotels/pending
   */
  async getPendingHotels(req, res, next) {
    try {
      const result = await hotelService.getHotelsByStatus('pending');
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Phê duyệt khách sạn (Admin only)
   * POST /api/v1/admin/hotels/:id/approve
   */
  async approveHotel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.updateHotelStatus(id, 'approved');
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Từ chối khách sạn (Admin only)
   * POST /api/v1/admin/hotels/:id/reject
   */
  async rejectHotel(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const result = await hotelService.updateHotelStatus(id, 'rejected');
      
      // TODO: Gửi thông báo lý do từ chối cho chủ sở hữu
      // await notificationService.sendRejectionNotification(id, reason);
      
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy tất cả khách sạn (Admin only) - không phân biệt trạng thái
   * GET /api/v1/admin/hotels/all
   */
  async getAllHotelsAdmin(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      
      let result;
      if (status) {
        result = await hotelService.getHotelsByStatus(status);
      } else {
        result = await hotelService.getAllHotels({ page, limit });
      }
      
      successResponse(res, result.data, 'Lấy danh sách khách sạn thành công', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Khôi phục khách sạn đã xóa (Admin only)
   * POST /api/v1/admin/hotels/:id/restore
   */
  async restoreHotel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.updateHotelStatus(id, 'pending');
      successResponse(res, result.data, 'Khôi phục khách sạn thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa vĩnh viễn khách sạn (Admin only)
   * DELETE /api/v1/admin/hotels/:id/permanent
   */
  async permanentDeleteHotel(req, res, next) {
    try {
      const { id } = req.params;
      
      // Kiểm tra khách sạn có tồn tại không
      const hotel = await hotelService.getHotelById(id);
      if (!hotel) {
        throw new AppError('Không tìm thấy khách sạn', 404);
      }
      
      // TODO: Implement permanent delete in service
      // await hotelService.permanentDeleteHotel(id);
      
      successResponse(res, null, 'Xóa vĩnh viễn khách sạn thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tìm kiếm khách sạn theo thành phố và phường/xã
   * GET /api/v1/hotels/search/location?city=...&ward=...
   */
  async getHotelsByCityAndWard(req, res, next) {
    try {
      const { city, ward, page, limit } = req.query;
      const result = await hotelService.getHotelsByCityAndWard(city, ward, { page, limit });
      successResponse(res, result.data, result.message, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đếm số lượng khách sạn theo thành phố và phường/xã
   * GET /api/v1/hotels/count/location?city=...&ward=...
   */
  async countHotelsByCityAndWard(req, res, next) {
    try {
      const { city, ward } = req.query;
      const result = await hotelService.countHotelsByCityAndWard(city, ward);
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new HotelController();