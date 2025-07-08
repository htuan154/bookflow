// src/api/v1/controllers/hotel.controller.js
const hotelService = require('../services/hotel.service');
const { AppError } = require('../../../utils/errors');
const { successResponse } = require('../../../utils/response');

class HotelController {
  async createHotel(req, res, next) {
    try {
      const result = await hotelService.createHotel(req.body, req.user.id);
      successResponse(res, result.data, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  async getHotelById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.getHotelById(id);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  async getAllHotels(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await hotelService.getAllHotels({ page, limit });
      successResponse(res, result.data, 'Lấy danh sách khách sạn thành công', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateHotel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.updateHotel(id, req.body, req.user.id);
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  async deleteHotel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.deleteHotel(id, req.user.id);
      successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getHotelsByOwner(req, res, next) {
    try {
      const { ownerId } = req.params;
      if (req.user.role !== 'admin' && req.user.id !== ownerId) {
        throw new AppError('Không có quyền truy cập', 403);
      }
      const result = await hotelService.getHotelsByOwner(ownerId);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  async getMyHotels(req, res, next) {
    try {
      const result = await hotelService.getHotelsByOwner(req.user.id);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  async searchHotels(req, res, next) {
    try {
      const result = await hotelService.searchHotels(req.query);
      successResponse(res, result.data, 'Tìm kiếm thành công', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getPopularHotels(req, res, next) {
    try {
      const { limit } = req.query;
      const result = await hotelService.getPopularHotels(limit);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  // === ADMIN ===

  async getHotelsByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const result = await hotelService.getHotelsByStatus(status);
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  async updateHotelStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) throw new AppError('Trạng thái không được để trống', 400);
      const result = await hotelService.updateHotelStatus(id, status);
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getHotelStatistics(req, res, next) {
    try {
      const result = await hotelService.getHotelStatistics();
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  async getPendingHotels(req, res, next) {
    try {
      const result = await hotelService.getHotelsByStatus('pending');
      successResponse(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  async approveHotel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.updateHotelStatus(id, 'approved');
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  async rejectHotel(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await hotelService.updateHotelStatus(id, 'rejected');
      // TODO: send rejection notification
      successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getAllHotelsAdmin(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      let result;
      if (status) {
        result = await hotelService.getHotelsByStatus(status);
        successResponse(res, result.data, 'Lấy danh sách khách sạn thành công');
      } else {
        result = await hotelService.getAllHotels({ page, limit });
        successResponse(res, result.data, 'Lấy danh sách khách sạn thành công', 200, result.pagination);
      }
    } catch (error) {
      next(error);
    }
  }

  async restoreHotel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hotelService.updateHotelStatus(id, 'pending');
      successResponse(res, result.data, 'Khôi phục khách sạn thành công');
    } catch (error) {
      next(error);
    }
  }

  async permanentDeleteHotel(req, res, next) {
    try {
      const { id } = req.params;

      const hotel = await hotelService.getHotelById(id);
      if (!hotel) {
        throw new AppError('Không tìm thấy khách sạn', 404);
      }

      // TODO: thực hiện xoá vĩnh viễn trong service
      // await hotelService.permanentDeleteHotel(id);

      successResponse(res, null, 'Xóa vĩnh viễn khách sạn thành công');
    } catch (error) {
      next(error);
    }
  }

  async getHotelHistory(req, res, next) {
    try {
      const { id } = req.params;

      // TODO: thực hiện lấy lịch sử trạng thái từ service
      // const result = await hotelService.getHotelHistory(id);

      successResponse(res, [], 'Lấy lịch sử thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HotelController();
