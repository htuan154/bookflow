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

    async createPromotionDetails(promotionId, detailsData) {
        try {
            if (!promotionId) {
                throw new Error('Promotion ID is required');
            }
            const response = await axiosClient.post(API_ENDPOINTS.PROMOTIONS.CREATE_DETAILS_BULK(promotionId), detailsData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPromotionsByHotelId(hotelId) {
        try {
            if (!hotelId) {
                throw new Error('Hotel ID is required');
            }
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_BY_HOTEL_ID(hotelId));
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
            console.error('❌ Error creating promotion:', error);
            const errorResult = this.handleError(error, 'Không thể tạo khuyến mãi');
            return errorResult;
        }
    }

    async updatePromotion(promotionId, promotionData) {
        try {
            if (!promotionId) {
                throw new Error('ID khuyến mãi là bắt buộc');
            }

            console.log('🔄 promotionService.updatePromotion called với:', { promotionId, promotionData });
            const transformedData = this.transformPromotionData(promotionData, true); // Pass isUpdate = true
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

            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_DETAILS(promotionId));
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Không thể lấy chi tiết khuyến mãi');
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

    async deletePromotionWithDetails(promotionId) {
        try {
            if (!promotionId) throw new Error('ID khuyến mãi là bắt buộc');

            console.log('🗑️ Starting cascade delete for promotion:', promotionId);
            
            // Bước 1: Lấy danh sách tất cả promotion details
            let promotionDetails = [];
            try {
                const detailsResponse = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_DETAILS(promotionId));
                promotionDetails = detailsResponse.data?.data || detailsResponse.data || [];
                console.log('📋 Found promotion details:', promotionDetails.length, promotionDetails);
            } catch (detailsError) {
                console.warn('⚠️ Could not fetch promotion details (may not exist):', detailsError.message);
                // Continue với việc xóa promotion
            }

            // Bước 2: Xóa tất cả promotion details (parallel processing cho performance tốt hơn)
            let deletedDetailsCount = 0;
            let failedDetails = [];
            
            if (promotionDetails.length > 0) {
                console.log('🗑️ Deleting', promotionDetails.length, 'promotion details...');
                
                // Xóa song song tất cả details để nhanh hơn
                const deletePromises = promotionDetails.map(async (detail, index) => {
                    // Xử lý multiple possible ID fields
                    const detailId = detail.detailId || detail.id || detail.detail_id || detail.promotionDetailId;
                    
                    if (!detailId) {
                        console.warn(`⚠️ Detail at index ${index} missing ID:`, detail);
                        return { success: false, detail, error: 'Missing detail ID' };
                    }
                    
                    try {
                        await axiosClient.delete(API_ENDPOINTS.PROMOTIONS.DELETE_DETAIL(promotionId, detailId));
                        console.log(`✅ Deleted detail ${detailId}`);
                        return { success: true, detailId };
                    } catch (deleteDetailError) {
                        console.warn(`❌ Failed to delete detail ${detailId}:`, deleteDetailError.message);
                        return { success: false, detailId, error: deleteDetailError.message };
                    }
                });

                // Chờ tất cả delete operations hoàn thành
                const results = await Promise.allSettled(deletePromises);
                
                // Đếm kết quả
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value.success) {
                        deletedDetailsCount++;
                    } else {
                        failedDetails.push({
                            index,
                            error: result.status === 'fulfilled' ? result.value.error : result.reason?.message
                        });
                    }
                });

                console.log(`📊 Delete details summary: ${deletedDetailsCount}/${promotionDetails.length} successful`);
                if (failedDetails.length > 0) {
                    console.warn('⚠️ Failed details:', failedDetails);
                }
            }

            // Bước 3: Xóa promotion chính
            console.log('🗑️ Deleting main promotion...');
            const response = await axiosClient.delete(API_ENDPOINTS.PROMOTIONS.DELETE(promotionId));
            console.log('✅ Main promotion deleted successfully');
            
            // Tạo thông báo chi tiết
            let message = `Xóa khuyến mãi thành công`;
            if (promotionDetails.length > 0) {
                if (failedDetails.length === 0) {
                    message = `Xóa khuyến mãi và tất cả ${deletedDetailsCount} chi tiết thành công`;
                } else {
                    message = `Xóa khuyến mãi và ${deletedDetailsCount}/${promotionDetails.length} chi tiết thành công (${failedDetails.length} chi tiết không xóa được)`;
                }
            }
            
            return {
                success: true,
                data: response.data,
                message: message,
                deletedDetailsCount: deletedDetailsCount,
                totalDetailsFound: promotionDetails.length,
                failedDetailsCount: failedDetails.length,
                failedDetails: failedDetails.length > 0 ? failedDetails : undefined
            };
        } catch (error) {
            console.error('❌ Error in cascade delete:', error);
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

    /**
     * Lọc khuyến mãi theo các điều kiện truyền vào.
     * @param {object} params - { code, status, startDate, endDate, hotelId }
     */
    async filterPromotions(params = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.FILTER, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Không thể lọc khuyến mãi');
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
    transformPromotionData(promotionData, isUpdate = false) {
        console.log('🔄 Raw input data:', promotionData, 'isUpdate:', isUpdate);
        
        // ✅ Validate required fields
        if (!promotionData) {
            throw new Error('Promotion data is required');
        }
        
        // For updates, these fields might not be required if they're not being changed
        if (!isUpdate) {
            if (!promotionData.code) {
                throw new Error('Promotion code is required');
            }
            
            if (!promotionData.name) {
                throw new Error('Promotion name is required');
            }
        }

        // ✅ CRITICAL FIX: Proper discount value parsing
        if (promotionData.discount_value !== undefined && promotionData.discount_value !== null && !promotionData.discount_value && promotionData.discount_value !== 0) {
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

            const transformed = {};
            
            // Only include fields that have values
            if (promotionData.hotel_id !== undefined) transformed.hotel_id = promotionData.hotel_id;
            if (promotionData.code) transformed.code = String(promotionData.code).toUpperCase().trim();
            if (promotionData.name) transformed.name = String(promotionData.name).trim();
            if (promotionData.description !== undefined) transformed.description = promotionData.description ? String(promotionData.description).trim() : '';
            if (promotionData.discount_value !== undefined) transformed.discount_value = Number(discountValue.toFixed(2));
            if (promotionData.min_booking_price !== undefined) transformed.min_booking_price = promotionData.min_booking_price ? parseFloat(promotionData.min_booking_price) : null;
            if (promotionData.valid_from) transformed.valid_from = promotionData.valid_from;
            if (promotionData.valid_until) transformed.valid_until = promotionData.valid_until;
            if (promotionData.usage_limit !== undefined) transformed.usage_limit = promotionData.usage_limit ? parseInt(promotionData.usage_limit) : null;
            if (promotionData.status) transformed.status = promotionData.status;
            if (promotionData.promotion_type) transformed.promotion_type = promotionData.promotion_type;

                // Map trường max_discount_amount nếu có (hỗ trợ cả snake_case và camelCase)
                if (promotionData.max_discount_amount !== undefined) {
                    transformed.max_discount_amount = parseFloat(promotionData.max_discount_amount) || null;
                } else if (promotionData.maxDiscountAmount !== undefined) {
                    transformed.max_discount_amount = parseFloat(promotionData.maxDiscountAmount) || null;
                }

            // ✅ Additional validation
            if (transformed.discount_value && transformed.promotion_type === 'percentage' && transformed.discount_value > 100) {
                throw new Error('Percentage discount cannot exceed 100%');
            }
            
            // Only validate dates if they exist (for updates, dates might not be changed)
            if (transformed.valid_from && transformed.valid_until) {
                if (new Date(transformed.valid_from) >= new Date(transformed.valid_until)) {
                    throw new Error('Valid until date must be after valid from date');
                }
            } else if (!isUpdate && (!transformed.valid_from || !transformed.valid_until)) {
                throw new Error('Valid from and valid until dates are required');
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

    // --- Promotion Details Methods ---
    
    async createPromotionDetails(promotionId, detailsData) {
        try {
            const response = await axiosClient.post(`/promotions/${promotionId}/details/bulk`, detailsData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPromotionDetailsByPromotionId(promotionId) {
        try {
            if (!promotionId) {
                throw new Error('Promotion ID is required');
            }
            const response = await axiosClient.get(API_ENDPOINTS.PROMOTIONS.GET_DETAILS(promotionId));
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updatePromotionDetail(promotionId, detailId, updateData) {
        try {
            const response = await axiosClient.put(API_ENDPOINTS.PROMOTIONS.UPDATE_DETAIL(promotionId, detailId), updateData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deletePromotionDetail(promotionId, detailId) {
        try {
            const response = await axiosClient.delete(API_ENDPOINTS.PROMOTIONS.DELETE_DETAIL(promotionId, detailId));
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async bulkUpdatePromotionDetails(promotionId, data) {
        try {
            console.log('🔄 bulkUpdatePromotionDetails called with:', { promotionId, data });
            console.log('🔗 API endpoint:', API_ENDPOINTS.PROMOTIONS.UPDATE_DETAILS_BULK(promotionId));
            
            const response = await axiosClient.put(API_ENDPOINTS.PROMOTIONS.UPDATE_DETAILS_BULK(promotionId), data);
            console.log('✅ Bulk update response:', response);
            return response.data;
        } catch (error) {
            console.error('❌ Bulk update error:', error);
            throw this.handleError(error);
        }
    }

    // Process room_specific promotion logic
    async processRoomSpecificPromotionUpdate(promotionId, discountValue, maxDiscountAmount) {
        try {
            console.log('🔄 Processing room_specific promotion update:', { promotionId, discountValue, maxDiscountAmount });
            
            // 1. Fetch all promotion details
            const promotionDetailsResult = await this.getPromotionDetails(promotionId);
            const promotionDetails = promotionDetailsResult.data || promotionDetailsResult;
            
            if (!promotionDetails || promotionDetails.length === 0) {
                console.log('No promotion details found for promotion:', promotionId);
                return [];
            }

            console.log('📋 Found promotion details:', promotionDetails);

            // 2. Process each detail according to business rules
            const updatedDetails = promotionDetails.map(detail => {
                if (detail.discountType === 'percentage') {
                    // For percentage type: set discount_value = promotion.discount_value
                    return {
                        detailId: detail.detailId,
                        promotionId: detail.promotionId,
                        roomTypeId: detail.roomTypeId,
                        discountType: detail.discountType,
                        discountValue: parseFloat(discountValue) || 0
                    };
                } else if (detail.discountType === 'fixed_amount') {
                    // For fixed_amount type: check if max_discount_amount < discount_value
                    const currentDiscountValue = parseFloat(detail.discountValue);
                    const maxAmount = parseFloat(maxDiscountAmount);
                    
                    let newDiscountValue = currentDiscountValue;
                    if (maxAmount && maxAmount > 0 && maxAmount < currentDiscountValue) {
                        newDiscountValue = maxAmount;
                        console.log(`📉 Reducing fixed_amount from ${currentDiscountValue} to ${newDiscountValue} due to max limit`);
                    }
                    
                    return {
                        detailId: detail.detailId,
                        promotionId: detail.promotionId,
                        roomTypeId: detail.roomTypeId,
                        discountType: detail.discountType,
                        discountValue: newDiscountValue
                    };
                }
                
                return detail; // Return unchanged if no specific rules apply
            });

            // 3. Filter only changed details to minimize API calls
            const changedDetails = updatedDetails.filter((updated, index) => {
                const original = promotionDetails[index];
                return parseFloat(updated.discountValue) !== parseFloat(original.discountValue);
            });

            console.log('🔄 Changed details:', changedDetails);

            if (changedDetails.length > 0) {
                console.log('📤 Updating promotion details via bulk update...');
                console.log('📋 Changed details being sent:', changedDetails);
                
                // Format exactly like EditPromotionDetailModal
                const bulkUpdateData = changedDetails.map(detail => ({
                    detailId: detail.detailId,
                    room_type_id: detail.roomTypeId,
                    discount_type: detail.discountType,
                    discount_value: parseFloat(detail.discountValue)
                }));
                
                console.log('📤 Bulk update data formatted:', bulkUpdateData);
                
                // Use the same format as EditPromotionDetailModal
                const bulkUpdatePayload = {
                    details: bulkUpdateData
                };
                
                console.log('📤 Using EditPromotionDetailModal format:', bulkUpdatePayload);
                await this.bulkUpdatePromotionDetails(promotionId, bulkUpdatePayload);
                console.log('✅ Promotion details updated successfully');
            } else {
                console.log('ℹ️ No promotion details need updating');
            }

            return updatedDetails;
        } catch (error) {
            console.error('❌ Error processing room-specific promotion update:', error);
            throw error;
        }
    }

    // --- Room Types Methods ---
    
    async getRoomTypesByHotelId(hotelId) {
        try {
            if (!hotelId) {
                throw new Error('Hotel ID is required');
            }
            console.log('Calling API:', `/roomtypes/hotel/${hotelId}`);
            const response = await axiosClient.get(`/roomtypes/hotel/${hotelId}`);
            console.log('API response:', response);
            return response.data;
        } catch (error) {
            console.error('Error in getRoomTypesByHotelId:', error);
            throw this.handleError(error);
        }
    }
}

// Export singleton instance
const promotionService = new PromotionService();
export default promotionService;