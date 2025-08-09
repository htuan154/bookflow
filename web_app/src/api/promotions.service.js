// src/api/promotions.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

class PromotionService {
    // --- Public Methods ---

    async getAllPromotions(params = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_ALL, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

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

    async createPromotion(promotionData) {
        try {
            const transformedData = this.transformPromotionData(promotionData);
            
            const response = await axiosClient.post(
                API_ENDPOINTS.PROMOTIONS.CREATE,
                transformedData
            );
            
            const result = {
                success: true,
                data: response.data,
                message: response.data?.message || 'Promotion created successfully',
                status: response.status
            };
            
            return result;
            
        } catch (error) {
            const errorResult = this.handleError(error, 'Không thể tạo khuyến mãi');
            throw errorResult;
        }
    }

    async updatePromotion(promotionId, promotionData) {
        try {
            if (!promotionId) {
                throw new Error('ID khuyến mãi là bắt buộc');
            }

            console.log('🔄 promotionService.updatePromotion called với:', { promotionId, promotionData });
            const transformedData = this.transformPromotionData(promotionData);
            console.log('🔄 Transformed data:', transformedData);

            const response = await axiosClient.put(API_ENDPOINTS.PROMOTIONS.UPDATE(promotionId), transformedData);
            console.log('✅ API Response:', response);

            const result = {
                success: true,
                data: response.data,
                message: response.data?.message || 'Cập nhật khuyến mãi thành công',
                status: response.status
            };
            
            console.log('✅ Final result from promotionService:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Error in promotionService.updatePromotion:', error);
            const errorResult = this.handleError(error, 'Không thể cập nhật khuyến mãi');
            throw errorResult;
        }
    }

    async getPromotionDetails(promotionId) {
        try {
            if (!promotionId) throw new Error('ID khuyến mãi là bắt buộc');

            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_BY_ID(promotionId));
            return {
                success: true,
                data: response.data,
                message: 'Lấy thông tin khuyến mãi thành công'
            };
        } catch (error) {
            throw this.handleError(error, 'Không thể lấy thông tin khuyến mãi');
        }
    }

    async deletePromotion(promotionId) {
        try {
            if (!promotionId) throw new Error('ID khuyến mãi là bắt buộc');

            const response = await axiosClient.delete(API_ENDPOINTS.PROMOTIONS.DELETE(promotionId));
            return {
                success: true,
                data: response.data,
                message: 'Xóa khuyến mãi thành công'
            };
        } catch (error) {
            throw this.handleError(error, 'Không thể xóa khuyến mãi');
        }
    }

    async addPromotionDetails(promotionId, detailsData) {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.ADD_DETAILS(promotionId), {
                details: detailsData
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPromotionUsageHistory(promotionId, params = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_USAGE_HISTORY(promotionId), {
                params
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPromotionsByHotel(hotelId) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_BY_HOTEL(hotelId));
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getActivePromotions(params = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_ACTIVE, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async checkCodeAvailability(code, excludeId = null) {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.CHECK_CODE, {
                code,
                excludeId
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async applyPromotion(code, bookingData) {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.APPLY, {
                code,
                ...bookingData
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPromotionStats(promotionId) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_STATS(promotionId));
            return response.data;
        } catch (error) {
            // Fallback: calculate stats manually if endpoint doesn't exist
            try {
                const usageHistory = await this.getPromotionUsageHistory(promotionId);
                const promotionDetails = await this.getPromotionDetails(promotionId);

                return {
                    totalUsage: usageHistory.data?.length || 0,
                    totalDiscount:
                        usageHistory.data?.reduce((sum, usage) => sum + usage.discountAmount, 0) || 0,
                    usageLimit: promotionDetails.data?.usageLimit || 0,
                    remainingUsage: Math.max(
                        0,
                        (promotionDetails.data?.usageLimit || 0) - (usageHistory.data?.length || 0)
                    )
                };
            } catch (fallbackError) {
                throw this.handleError(error);
            }
        }
    }

    async searchPromotions(query, params = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.SEARCH, {
                params: { q: query, ...params }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async bulkUpdatePromotions(ids, updateData) {
        try {
            const response = await axiosClient.put(API_ENDPOINTS.PROMOTIONS.BULK_UPDATE, {
                ids,
                updateData
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async bulkDeletePromotions(ids) {
        try {
            const response = await axiosClient.delete(API_ENDPOINTS.PROMOTIONS.BULK_DELETE, {
                data: { ids }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async exportPromotions(filters = {}) {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.EXPORT, filters, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async importPromotions(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.IMPORT, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // --- Utility Methods ---

    // ✅ ENHANCED: Better error handling with more detailed information
    handleError(error, defaultMsg = 'Có lỗi xảy ra') {
        console.error('🚨 Promotion Service Error:', error);
        
        if (error.response) {
            const { status, data } = error.response;
            
            // ✅ Try multiple ways to get error message
            let message = defaultMsg;
            if (data) {
                message = data.message || 
                         data.error || 
                         data.msg || 
                         data.detail || 
                         data.errors?.[0]?.message ||
                         (typeof data === 'string' ? data : null) ||
                         defaultMsg;
            }
            
            console.error('📊 Error Response:', { status, data, message });
            
            // ✅ Create detailed error object
            const errorResult = {
                success: false,
                data: null,
                message: message,
                status: status,
                details: data,
                originalError: error,
                timestamp: new Date().toISOString()
            };
            
            return errorResult;
            
        } else if (error.request) {
            console.error('📡 No response received:', error.request);
            return {
                success: false,
                data: null,
                message: 'Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.',
                status: 0,
                details: { request: error.request },
                originalError: error,
                timestamp: new Date().toISOString()
            };
        } else {
            console.error('⚙️ Request setup error:', error.message);
            return {
                success: false,
                data: null,
                message: error.message || defaultMsg,
                status: 0,
                details: { setupError: true },
                originalError: error,
                timestamp: new Date().toISOString()
            };
        }
    }

    // ✅ FIXED: Robust data transformation with proper discount value handling
    transformPromotionData(promotionData) {
        console.log('🔄 Raw input data:', promotionData);
        
        // ✅ Validate required fields
        if (!promotionData) {
            throw new Error('Promotion data is required');
        }
        
        if (!promotionData.code) {
            throw new Error('Promotion code is required');
        }
        
        if (!promotionData.name) {
            throw new Error('Promotion name is required');
        }

        // ✅ CRITICAL FIX: Proper discount value parsing
        if (!promotionData.discount_value && promotionData.discount_value !== 0) {
            throw new Error('Discount value is required');
        }

        try {
            // ✅ Enhanced discount value parsing
            let discountValue;
            const rawDiscount = promotionData.discount_value;
            
            console.log('🔢 Processing discount value:', { rawDiscount, type: typeof rawDiscount });
            
            if (rawDiscount === null || rawDiscount === undefined || rawDiscount === '') {
                throw new Error('Discount value cannot be empty');
            }
            
            if (typeof rawDiscount === 'string') {
                // Remove any commas and parse
                const cleaned = rawDiscount.replace(/,/g, '').trim();
                if (cleaned === '') {
                    throw new Error('Discount value cannot be empty');
                }
                discountValue = parseFloat(cleaned);
            } else {
                discountValue = Number(rawDiscount);
            }
            
            // Validate parsed value
            if (isNaN(discountValue) || !isFinite(discountValue)) {
                throw new Error('Discount value must be a valid number');
            }
            
            if (discountValue <= 0) {
                throw new Error('Discount value must be greater than 0');
            }
            
            if (discountValue > 999.99) {
                throw new Error('Discount value cannot exceed 999.99');
            }

            const transformed = {
                hotel_id: promotionData.hotel_id || null,
                code: String(promotionData.code).toUpperCase().trim(),
                name: String(promotionData.name).trim(),
                description: promotionData.description ? String(promotionData.description).trim() : '',
                discount_value: Number(discountValue.toFixed(2)), // Ensure proper precision
                min_booking_price: promotionData.min_booking_price ? parseFloat(promotionData.min_booking_price) : null,
                valid_from: promotionData.valid_from,
                valid_until: promotionData.valid_until,
                usage_limit: promotionData.usage_limit ? parseInt(promotionData.usage_limit) : null,
                status: promotionData.status || 'active',
                promotion_type: promotionData.promotion_type || 'general'
            };

                // Map trường max_discount_amount nếu có (hỗ trợ cả snake_case và camelCase)
                if (promotionData.max_discount_amount !== undefined) {
                    transformed.max_discount_amount = parseFloat(promotionData.max_discount_amount) || null;
                } else if (promotionData.maxDiscountAmount !== undefined) {
                    transformed.max_discount_amount = parseFloat(promotionData.maxDiscountAmount) || null;
                }

            // ✅ Additional validation
            if (transformed.promotion_type === 'percentage' && transformed.discount_value > 100) {
                throw new Error('Percentage discount cannot exceed 100%');
            }
            
            if (!transformed.valid_from || !transformed.valid_until) {
                throw new Error('Valid from and valid until dates are required');
            }
            
            if (new Date(transformed.valid_from) >= new Date(transformed.valid_until)) {
                throw new Error('Valid until date must be after valid from date');
            }

            console.log('🔄 Transformed data:', transformed);
            return transformed;
            
        } catch (error) {
            console.error('❌ Data transformation error:', error);
            throw error;
        }
    }

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