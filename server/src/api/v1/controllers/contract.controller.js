// src/api/v1/controllers/contract.controller.js

const ContractService = require('../services/contract.service');
const { successResponse } = require('../../../utils/response');

class ContractController {
    /**
     * ✅ Tạo một hợp đồng mới ngày 23/8
     * POST /api/v1/contracts
     */
    // src/api/v1/controllers/contract.controller.js
    async createContract(req, res, next) {
        try {
            const userId = req.user.id;
            let hotel_id = req.body.hotel_id;
            if (!hotel_id) {
                // Nếu không truyền hotel_id từ frontend, lấy khách sạn đầu tiên của chủ
                const hotelRes = await require('../../../config/db').query(
                    'SELECT hotel_id FROM hotels WHERE owner_id = $1 LIMIT 1', [userId]
                );
                if (hotelRes.rows.length === 0) {
                    throw new Error('Không tìm thấy khách sạn của chủ này');
                }
                hotel_id = hotelRes.rows[0].hotel_id;
            }
            const contractData = { ...req.body, hotel_id };
            const newContract = await ContractService.createContract(contractData, userId);
            successResponse(res, newContract, 'Contract created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
//Cập nhật hợp đồng ngày 24/8
    /**
     * ✅ Cập nhật hợp đồng (chủ khách sạn)
     * PATCH /api/v1/contracts/:id
     */
    async updateContract(req, res, next) {
        try {
            const { id } = req.params;         // contractId
            const updateData = req.body;       // dữ liệu mới (ví dụ: start_date, end_date, terms, ...)
            const userId = req.user.id;        // chủ khách sạn đang login

            const updatedContract = await ContractService.updateContract(id, updateData, userId);

            successResponse(res, updatedContract, 'Contract updated successfully');
        } catch (error) {
            next(error);
        }
    }

// xóa hợp đồng ngày 24/8
async deleteContract(req, res, next) {
    try {
        const { id } = req.params;   // contractId
        const userId = req.user.id;  // chủ khách sạn đang login

        await ContractService.deleteContract(id, userId);

        successResponse(res, null, 'Contract deleted successfully', 200);
    } catch (error) {
        next(error);
    }
}

    /**
     * ✅ Lấy thông tin chi tiết một hợp đồng
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
     * ✅ Lấy tất cả hợp đồng của một khách sạn
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
     * ✅ Cập nhật trạng thái hợp đồng
     * PATCH /api/v1/contracts/:id/status
     */
    async updateContractStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, signed_date, notes, approved_by, approvedBy } = req.body;
            const adminId = req.user.id;

            console.log('📥 [CONTRACT CONTROLLER] Update status request:', {
                id, status, signed_date, notes, approved_by, approvedBy, adminId
            });

            const updateData = {
                status,
                adminId,
                ...(signed_date && { signed_date }),
                ...(notes && { notes }),
                ...(approved_by && { approved_by }),
                ...(approvedBy && { approvedBy })
            };

            const updatedContract = await ContractService.updateContractStatus(id, updateData);
            successResponse(res, updatedContract, 'Contract status updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * ✅ Lấy danh sách hợp đồng theo trạng thái
     * GET /api/v1/contracts/status/:status
     * (Admin dùng để lấy danh sách hợp đồng chờ duyệt, đã duyệt, bị từ chối...)
     */
    async getContractsByStatus(req, res, next) {
        try {
            const { status } = req.params; // Ví dụ: "pending", "approved"
            const contracts = await ContractService.getContractsByStatus(status);
            successResponse(res, contracts);
        } catch (error) {
            next(error);
        }
    }

    /**
     * ⏳ (Tuỳ chọn) Lấy danh sách tất cả hợp đồng (nếu cần)
     * GET /api/v1/contracts
     
    async getAllContracts(req, res, next) {
        try {
            const contracts = await ContractService.getAllContracts();
            successResponse(res, contracts);
        } catch (error) {
            next(error);
        }
    }
        */

    // thêm vào ngày 28/8 để lấy tất cả các hợp đồng thuộc chủ sở hữu đang đăng nhập
    async getAllContracts(req, res, next) {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;

        let contracts;
        if (userRole === 'admin') {
            contracts = await ContractService.getAllContracts();
        } else {
            contracts = await ContractService.getMyContracts(userId);
            contracts = contracts.map(c => c.toJSON()); // Thêm dòng này!
        }

        successResponse(res, contracts);
    } catch (error) {
        next(error);
    }
    }
    /**
     * ✅ Chủ khách sạn gửi duyệt hợp đồng (draft -> pending)
     * PATCH /api/v1/contracts/:id/send-for-approval
     */
    async sendForApproval(req, res, next) {
        try {
            const { id } = req.params;   // contractId
            const userId = req.user.id;  // chủ khách sạn đang đăng nhập

            const updatedContract = await ContractService.sendForApproval(id, userId);

            successResponse(res, updatedContract, 'Contract sent for approval successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ContractController();
