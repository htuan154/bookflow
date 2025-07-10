// src/api/v1/controllers/contract.controller.js

const ContractService = require('../services/contract.service');
const { successResponse } = require('../../../utils/response');

class ContractController {
    /**
     * Tạo một hợp đồng mới.
     * POST /api/v1/contracts
     */
    async createContract(req, res, next) {
        try {
            const adminId = req.user.userId; // Lấy từ middleware 'authenticate'
            const newContract = await ContractService.createContract(req.body, adminId);
            successResponse(res, newContract, 'Contract created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy thông tin chi tiết một hợp đồng.
     * GET /api/v1/contracts/:id
     */
    async getContractById(req, res, next) {
        try {
            const { id } = req.params;
            const contract = await ContractService.getContractById(id);
            successResponse(res, contract);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả hợp đồng của một khách sạn.
     * GET /api/v1/hotels/:hotelId/contracts
     */
    async getContractsByHotel(req, res, next) {
        try {
            const { hotelId } = req.params;
            const contracts = await ContractService.getContractsByHotel(hotelId);
            successResponse(res, contracts);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật trạng thái của một hợp đồng.
     * PATCH /api/v1/contracts/:id/status
     */
    async updateContractStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const adminId = req.user.userId;

            const updatedContract = await ContractService.updateContractStatus(id, status, adminId);
            successResponse(res, updatedContract, 'Contract status updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ContractController();
