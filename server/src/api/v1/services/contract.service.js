// src/api/v1/services/contract.service.js

const contractRepository = require('../repositories/contract.repository');
const hotelRepository = require('../repositories/hotel.repository');
const { AppError } = require('../../../utils/errors');
const Contract_custom = require('../../../models/contract_hotel');

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
// tạo hợp đồng ngay 23/8
    async createContract(contractData, userId) {
    // userId = người đang đăng nhập (lấy từ JWT hoặc session)
    if (!userId) {
        throw new AppError('User ID is required', 400);
    }

    // Kiểm tra khách sạn có tồn tại không
    const hotel = await hotelRepository.findById(contractData.hotel_id);
    if (!hotel) {
        throw new AppError('Hotel not found', 404);
    }

    // Kiểm tra quyền: chỉ chủ khách sạn mới được tạo hợp đồng
    if (hotel.ownerId !== userId) {
        throw new AppError('Only hotel owner can create contract for this hotel', 403);
    }

    // Sinh số hợp đồng tự động
    const contractNumber = `HD-${hotel.name.substring(0, 5).toUpperCase()}-${Date.now()}`;

    const fullContractData = {
        ...contractData,
        user_id: userId,                   // chính là chủ khách sạn
        contract_number: contractNumber,
        created_by: userId,
        status: 'draft',
    };

    console.log('[Service] ✅ fullContractData:', fullContractData);

    return await contractRepository.create(fullContractData);
}
    //Cập nhật hợp đồng ngà 24/8
    /**
     * Chủ khách sạn cập nhật hợp đồng của chính mình.
     * @param {string} contractId - ID hợp đồng cần update
     * @param {object} updateData - Dữ liệu mới
     * @param {string} userId - ID user đang login
     * @returns {Promise<Contract>}
     */
    async updateContract(contractId, updateData, userId) {
        // 1. Kiểm tra hợp đồng có tồn tại không
        const contract = await contractRepository.findById(contractId);
        if (!contract) {
            throw new AppError('Contract not found', 404);
        }

        // 2. Chỉ chủ khách sạn (user_id) mới được quyền chỉnh sửa
        if (contract.userId !== userId) {
            throw new AppError('You are not allowed to update this contract', 403);
        }

        // 3. Gọi repo để update
        const updatedContract = await contractRepository.update(contractId, updateData);

        return updatedContract;
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
// xóa hợp đồng ngày 24/8
    async deleteContract(contractId, userId) {
        // 1. Kiểm tra hợp đồng có tồn tại
        const contract = await contractRepository.findById(contractId);
        if (!contract) {
            throw new AppError('Contract not found', 404);
        }

        // 2. Kiểm tra khách sạn của hợp đồng
        const hotel = await hotelRepository.findById(contract.hotelId);
        if (!hotel) {
            throw new AppError('Hotel not found', 404);
        }

        // 3. Chỉ chủ khách sạn mới được quyền xóa
        if (hotel.ownerId !== userId) {
            throw new AppError('You are not allowed to delete this contract', 403);
        }

        // 4. Gọi repo để xóa
        const deleted = await contractRepository.deleteById(contractId);
        if (!deleted) {
            throw new AppError('Failed to delete contract', 500);
        }

        return true;
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
     * @param {object} updateData - Dữ liệu cập nhật (status, signed_date, notes, etc.).
     * @returns {Promise<Contract>}
     */
    async updateContractStatus(contractId, updateData) {
        const contract = await contractRepository.findById(contractId);
        if (!contract) {
            throw new AppError('Contract not found', 404);
        }

        console.log('📥 [CONTRACT SERVICE] Update contract status:', { contractId, updateData });

        const { status, signed_date, adminId, notes, approved_by, approvedBy } = updateData;

        const validStatuses = ['pending', 'active', 'expired', 'terminated', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid status for contract', 400);
        }

        const finalUpdateData = {
            status: status,
            approved_by: adminId || approved_by || approvedBy,
        };

        // Xử lý signed_date: ưu tiên từ request, nếu không có thì giữ nguyên
        if (signed_date) {
            finalUpdateData.signed_date = signed_date;
            console.log('✅ [CONTRACT SERVICE] Setting signed_date:', signed_date);
        } else if (contract.signed_date || contract.signedDate) {
            finalUpdateData.signed_date = contract.signed_date || contract.signedDate;
            console.log('ℹ️ [CONTRACT SERVICE] Keeping existing signed_date:', finalUpdateData.signed_date);
        }

        // Thêm notes nếu có
        if (notes) {
            finalUpdateData.notes = notes;
        }

        console.log('📤 [CONTRACT SERVICE] Final update data:', finalUpdateData);

        return await contractRepository.update(contractId, finalUpdateData);
    }


    /**
     * Lấy danh sách hợp đồng theo trạng thái (Admin).
     * @param {string} status - Trạng thái hợp đồng cần lọc.
     * @returns {Promise<Contract[]>}
     */
    async getContractsByStatus(status) {
        const validStatuses = ['draft', 'pending', 'active', 'expired', 'terminated', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid status for contract list', 400);
        }

        return await contractRepository.findByStatus(status);
    }

    /**
     * Lấy tất cả hợp đồng (Admin).
     * @returns {Promise<Contract_custom[]>}
     */
    async getAllContracts() {
        const contracts = await contractRepository.findAll();
        return contracts.map(c => c.toJSON());
    }

    //thêm vào ngày 28/8 để lấy tất cả các họp đồng thuộc chủ sở hữ đang đăng nhập
    /**
     * Lấy tất cả hợp đồng của một chủ khách sạn cụ thể.
     * @param {string} userId - ID của chủ khách sạn
     * @returns {Promise<Contract[]>}
     */
    async getMyContracts(userId) {
        return await contractRepository.findByUserId(userId);
    }
   /**
 * Chủ khách sạn gửi duyệt hợp đồng (chuyển từ draft -> pending).
 * @param {string} contractId - ID hợp đồng
 * @param {string} userId - ID chủ khách sạn (người gửi duyệt)
 * @returns {Promise<Contract>}
 */
async sendForApproval(contractId, userId) {
    // 1. Kiểm tra hợp đồng có tồn tại không
    const contract = await contractRepository.findById(contractId);
    if (!contract) {
        throw new AppError('Contract not found', 404);
    }

    // 2. Hợp đồng phải còn ở trạng thái draft thì mới gửi duyệt được
    if (contract.status !== 'draft') {
        throw new AppError('Only draft contracts can be sent for approval', 400);
    }

    // 3. Gọi repo để cập nhật trạng thái (repo đã check owner_id)
    const updatedContract = await contractRepository.sendForApproval(contractId, userId);

    if (!updatedContract) {
        throw new AppError('You are not allowed to send this contract for approval', 403);
    }

    return updatedContract;
}

}

module.exports = new ContractService();
