// src/api/v1/controllers/season.controller.js

const SeasonService = require('../services/season.service');
const { successResponse } = require('../../../utils/response');

class SeasonController {
    /**
     * Lấy tất cả các mùa.
     * GET /api/v1/seasons
     */
    async getAllSeasons(req, res, next) {
        try {
            const seasons = await SeasonService.getAllSeasons();
            successResponse(res, seasons, 'Lấy danh sách các mùa thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy các mùa theo năm.
     * GET /api/v1/seasons/year/:year
     */
    async getSeasonsByYear(req, res, next) {
        try {
            const { year } = req.params;
            const seasons = await SeasonService.getSeasonsByYear(parseInt(year));
            successResponse(res, seasons, `Lấy danh sách các mùa năm ${year} thành công`);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo một mùa mới.
     * POST /api/v1/seasons
     */
    async createSeason(req, res, next) {
        try {
            const newSeason = await SeasonService.createSeason(req.body);
            successResponse(res, newSeason, 'Tạo mùa mới thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật một mùa.
     * PUT /api/v1/seasons/:id
     */
    async updateSeason(req, res, next) {
        try {
            const { id } = req.params;
            const updatedSeason = await SeasonService.updateSeason(id, req.body);
            successResponse(res, updatedSeason, 'Cập nhật mùa thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một mùa.
     * DELETE /api/v1/seasons/:id
     */
    async deleteSeason(req, res, next) {
        try {
            const { id } = req.params;
            await SeasonService.deleteSeason(id);
            successResponse(res, null, 'Xóa mùa thành công');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SeasonController();
