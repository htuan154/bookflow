// src/api/v1/services/contract.service.js

const contractRepository = require('../repositories/contract.repository');
const hotelRepository = require('../repositories/hotel.repository');
const { AppError } = require('../../../utils/errors');

class ContractService {
    // /**
    //  * Admin tạo một hợp đồng mới cho một khách sạn.
    //  * @param {object} contractData - Dữ liệu hợp đồng.
    //  * @param {string} adminId - ID của admin tạo hợp đồng.
    //  * @returns {Promise<Contract>}
    //  */
    // async createContract(contractData, adminId) {
    //     // Logic nghiệp vụ: Kiểm tra khách sạn và người dùng có tồn tại không
    //     const hotel = await hotelRepository.findById(contractData.hotel_id);
    //     if (!hotel) {
    //         throw new AppError('Hotel not found', 404);
    //     }

    //     // Logic nghiệp vụ: Tự động tạo một số hợp đồng duy nhất
    //     const contractNumber = `HD-${hotel.name.substring(0, 5).toUpperCase()}-${Date.now()}`;

    //     const fullContractData = {
    //         ...contractData,
    //         user_id: hotel.ownerId, // Gán hợp đồng cho chủ khách sạn
    //         contract_number: contractNumber,
    //         created_by: adminId,
    //         status: 'draft', // Hợp đồng mới luôn ở trạng thái nháp
    //     };

    //     return await contractRepository.create(fullContractData);
    // }

    async createContract(contractData, adminId) {
        // Bảo vệ: adminId bắt buộc phải có
        if (!adminId) {
            throw new AppError('Admin ID is required to create contract', 400);
        }

        const hotel = await hotelRepository.findById(contractData.hotel_id);
        if (!hotel) {
            throw new AppError('Hotel not found', 404);
        }

        // Tự động sinh số hợp đồng
        const contractNumber = `HD-${hotel.name.substring(0, 5).toUpperCase()}-${Date.now()}`;

        // Gộp lại tất cả dữ liệu tạo hợp đồng
        const fullContractData = {
            ...contractData,
            user_id: hotel.ownerId,
            contract_number: contractNumber,
            created_by: adminId,
            status: 'draft', // luôn là nháp ban đầu
        };

        console.log('[Service] ✅ fullContractData:', fullContractData);

        return await contractRepository.create(fullContractData);
    }

    /**
     * Lấy một hợp đồng bằng ID.
     * @param {string} contractId - ID của hợp đồng.
     * @returns {Promise<Contract>}
     */
    async getContractById(contractId) {
        const contract = await contractRepository.findById(contractId);
        if (!contract) {
            throw new AppError('Contract not found', 404);
        }
        return contract;
    }

    /**
     * Lấy tất cả hợp đồng của một khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @returns {Promise<Contract[]>}
     */
    async getContractsByHotel(hotelId) {
        return await contractRepository.findByHotelId(hotelId);
    }

    /**
     * Admin cập nhật trạng thái của một hợp đồng.
     * @param {string} contractId - ID của hợp đồng.
     * @param {string} newStatus - Trạng thái mới.
     * @param {string} adminId - ID của admin thực hiện.
     * @returns {Promise<Contract>}
     */
    async updateContractStatus(contractId, newStatus, adminId) {
        const contract = await contractRepository.findById(contractId);
        if (!contract) {
            throw new AppError('Contract not found', 404);
        }

        const validStatuses = ['pending', 'active', 'expired', 'terminated', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
            throw new AppError('Invalid status for contract', 400);
        }

        const updateData = {
            status: newStatus,
            approved_by: adminId, // Ghi nhận admin đã duyệt
            signed_date: newStatus === 'active' ? new Date() : contract.signedDate,
        };

        return await contractRepository.update(contractId, updateData);
    }
}

module.exports = new ContractService();
