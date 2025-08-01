// src/services/promotions.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

class PromotionService {
    // --- Public Methods ---
    
    /**
     * Get all promotions (public endpoint)
     * @param {Object} params - Query parameters for filtering
     * @returns {Promise} Response with promotions list
     */
    async getAllPromotions(params = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_ALL, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Validate promotion code
     * @param {string} code - Promotion code to validate
     * @param {Object} bookingInfo - Booking information for validation
     * @returns {Promise} Validation result
     */
    async validatePromotionCode(code, bookingInfo = {}) {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.VALIDATE_CODE, {
                code,
                ...bookingInfo
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // --- Authenticated Methods (Admin & Hotel Owner) ---

    /**
     * Create a new promotion
     * @param {Object} promotionData - Promotion data
     * @returns {Promise} Created promotion
     */
    async createPromotion(promotionData) {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.CREATE, promotionData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get promotion details by ID
     * @param {number} promotionId - Promotion ID
     * @returns {Promise} Promotion details
     */
    async getPromotionDetails(promotionId) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_BY_ID(promotionId));
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Add details to a promotion (room type specific discounts)
     * @param {number} promotionId - Promotion ID
     * @param {Array} detailsData - Array of promotion details
     * @returns {Promise} Added promotion details
     */
    async addPromotionDetails(promotionId, detailsData) {
        try {
            const response = await axiosClient.post(
                API_ENDPOINTS.PROMOTIONS.ADD_DETAILS(promotionId), 
                { details: detailsData }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get promotion usage history
     * @param {number} promotionId - Promotion ID
     * @param {Object} params - Query parameters for pagination and filtering
     * @returns {Promise} Usage history data
     */
    async getPromotionUsageHistory(promotionId, params = {}) {
        try {
            const response = await axiosClient.get(
                API_ENDPOINTS.PROMOTIONS.GET_USAGE_HISTORY(promotionId), 
                { params }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // --- Utility Methods ---

    /**
     * Get promotions by hotel ID
     * @param {number} hotelId - Hotel ID
     * @returns {Promise} Hotel promotions
     */
    async getPromotionsByHotel(hotelId) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_ALL, {
                params: { hotel_id: hotelId }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get active promotions only
     * @param {Object} params - Additional query parameters
     * @returns {Promise} Active promotions
     */
    async getActivePromotions(params = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_ALL, {
                params: { status: 'active', ...params }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Check if promotion code is available
     * @param {string} code - Promotion code to check
     * @param {number} excludeId - Promotion ID to exclude from check (for updates)
     * @returns {Promise} Availability result
     */
    async checkCodeAvailability(code, excludeId = null) {
        try {
            const params = { code };
            if (excludeId) {
                params.exclude_id = excludeId;
            }
            
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_ALL, { params });
            return {
                available: response.data.data.length === 0,
                message: response.data.data.length === 0 
                    ? 'Code is available' 
                    : 'Code is already in use'
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Apply promotion to booking
     * @param {string} code - Promotion code
     * @param {Object} bookingData - Booking information
     * @returns {Promise} Applied promotion result
     */
    async applyPromotion(code, bookingData) {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.VALIDATE_CODE, {
                code,
                action: 'apply',
                ...bookingData
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get promotion statistics
     * @param {number} promotionId - Promotion ID
     * @returns {Promise} Promotion statistics
     */
    async getPromotionStats(promotionId) {
        try {
            const usageHistory = await this.getPromotionUsageHistory(promotionId);
            const promotionDetails = await this.getPromotionDetails(promotionId);
            
            return {
                totalUsage: usageHistory.data?.length || 0,
                totalDiscount: usageHistory.data?.reduce((sum, usage) => sum + usage.discountAmount, 0) || 0,
                usageLimit: promotionDetails.data?.usageLimit || 0,
                remainingUsage: Math.max(0, (promotionDetails.data?.usageLimit || 0) - (usageHistory.data?.length || 0))
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // --- Error Handling ---

    /**
     * Handle API errors
     * @param {Error} error - Axios error object
     * @returns {Error} Formatted error
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;
            return new Error(data.message || `HTTP Error: ${status}`);
        } else if (error.request) {
            // Request was made but no response received
            return new Error('Network error: No response from server');
        } else {
            // Something else happened
            return new Error(error.message || 'An unexpected error occurred');
        }
    }

    // --- Data Transformation Helpers ---

    /**
     * Transform promotion data for API request
     * @param {Object} promotionData - Raw promotion data
     * @returns {Object} Transformed data
     */
    transformPromotionData(promotionData) {
        return {
            hotel_id: promotionData.hotelId,
            code: promotionData.code,
            name: promotionData.name,
            description: promotionData.description,
            discount_value: promotionData.discountValue,
            min_booking_price: promotionData.minBookingPrice,
            valid_from: promotionData.validFrom,
            valid_until: promotionData.validUntil,
            usage_limit: promotionData.usageLimit,
            status: promotionData.status,
            promotion_type: promotionData.promotionType
        };
    }

    /**
     * Transform promotion detail data for API request
     * @param {Object} detailData - Raw promotion detail data
     * @returns {Object} Transformed data
     */
    transformPromotionDetailData(detailData) {
        return {
            room_type_id: detailData.roomTypeId,
            discount_type: detailData.discountType,
            discount_value: detailData.discountValue
        };
    }
}

// Export singleton instance
const promotionService = new PromotionService();
export default promotionService;