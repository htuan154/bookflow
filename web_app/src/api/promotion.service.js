// src/api/promotion.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

/**
 * Lấy tất cả danh sách khuyến mãi
 * @returns {Promise} Promise chứa danh sách khuyến mãi
 */
export const getAllPromotions = async () => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_ALL);
        return {
            success: true,
            data: response.data,
            message: 'Lấy danh sách khuyến mãi thành công'
        };
    } catch (error) {
        console.error('Error fetching promotions:', error);
        throw {
            success: false,
            data: null,
            message: error.response?.data?.message || 'Không thể lấy danh sách khuyến mãi',
            status: error.response?.status
        };
    }
};

/**
 * Tạo khuyến mãi mới
 * @param {Object} promotionData - Dữ liệu khuyến mãi
 * @param {string} promotionData.hotelId - ID khách sạn
 * @param {string} promotionData.code - Mã khuyến mãi
 * @param {string} promotionData.name - Tên khuyến mãi
 * @param {string} promotionData.description - Mô tả khuyến mãi
 * @param {number} promotionData.discountValue - Giá trị giảm giá
 * @param {number} promotionData.minBookingPrice - Giá booking tối thiểu
 * @param {string} promotionData.validFrom - Ngày bắt đầu hiệu lực
 * @param {string} promotionData.validUntil - Ngày kết thúc hiệu lực
 * @param {number} promotionData.usageLimit - Giới hạn sử dụng
 * @param {string} promotionData.promotionType - Loại khuyến mãi
 * @returns {Promise} Promise chứa thông tin khuyến mãi đã tạo
 */
export const createPromotion = async (promotionData) => {
    try {
        // Validate required fields
        const requiredFields = ['hotelId', 'code', 'name', 'discountValue', 'validFrom', 'validUntil'];
        for (const field of requiredFields) {
            if (!promotionData[field]) {
                throw new Error(`Trường ${field} là bắt buộc`);
            }
        }

        const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.CREATE, promotionData);
        return {
            success: true,
            data: response.data,
            message: 'Tạo khuyến mãi thành công'
        };
    } catch (error) {
        console.error('Error creating promotion:', error);
        throw {
            success: false,
            data: null,
            message: error.response?.data?.message || error.message || 'Không thể tạo khuyến mãi',
            status: error.response?.status
        };
    }
};

/**
 * Cập nhật khuyến mãi
 * @param {string} promotionId - ID của khuyến mãi cần cập nhật
 * @param {Object} promotionData - Dữ liệu khuyến mãi cần cập nhật
 * @returns {Promise} Promise chứa thông tin khuyến mãi đã cập nhật
 */
export const updatePromotion = async (promotionId, promotionData) => {
    try {
        if (!promotionId) {
            throw new Error('ID khuyến mãi là bắt buộc');
        }

        const response = await axiosClient.put(
            API_ENDPOINTS.PROMOTIONS.UPDATE(promotionId), 
            promotionData
        );
        
        return {
            success: true,
            data: response.data,
            message: 'Cập nhật khuyến mãi thành công'
        };
    } catch (error) {
        console.error('Error updating promotion:', error);
        throw {
            success: false,
            data: null,
            message: error.response?.data?.message || 'Không thể cập nhật khuyến mãi',
            status: error.response?.status
        };
    }
};

/**
 * Lấy thông tin chi tiết khuyến mãi theo ID
 * @param {string} promotionId - ID của khuyến mãi
 * @returns {Promise} Promise chứa thông tin chi tiết khuyến mãi
 */
export const getPromotionById = async (promotionId) => {
    try {
        if (!promotionId) {
            throw new Error('ID khuyến mãi là bắt buộc');
        }

        const response = await axiosClient.get(
            API_ENDPOINTS.PROMOTIONS.GET_BY_ID(promotionId)
        );
        
        return {
            success: true,
            data: response.data,
            message: 'Lấy thông tin khuyến mãi thành công'
        };
    } catch (error) {
        console.error('Error fetching promotion:', error);
        throw {
            success: false,
            data: null,
            message: error.response?.data?.message || 'Không thể lấy thông tin khuyến mãi',
            status: error.response?.status
        };
    }
};

// Export default object chứa tất cả các functions (optional)
const promotionService = {
    getAllPromotions,
    createPromotion,
    updatePromotion,
    getPromotionById
};

export default promotionService;