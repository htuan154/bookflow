import { useState, useCallback } from 'react';
import { hotelApiService } from '../api/hotel.service';

/**
 * Custom hook cho chủ khách sạn
 */
export const useHotelOwner = () => {
    const [hotelData, setHotelData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lấy danh sách booking theo hotelId
    const fetchBookingsByHotelId = useCallback(async (hotelId) => {
        if (!hotelId) return [];
        try {
            setLoading(true);
            setError(null);
            const response = await hotelApiService.getBookingsByHotelId(hotelId);
            return response;
        } catch (error) {
            setError(error?.response?.data?.message || error.message || 'Không thể tải danh sách booking');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Lấy thông tin khách sạn của owner
    const fetchOwnerHotel = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await hotelApiService.getHotelsForOwner(filters);
            console.log('Owner hotel data:', response);
            
            if (response?.data && response.data.length > 0) {
                setHotelData(response.data);
                return response.data;
            } else {
                setHotelData(null);
                return null;
            }
        } catch (error) {
            console.error('Error fetching owner hotel:', error);
            setError(error?.response?.data?.message || error.message || 'Không thể tải thông tin khách sạn');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Cập nhật thông tin khách sạn
    const updateOwnerHotel = useCallback(async (hotelId, updateData) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await hotelApiService.updateHotel(hotelId, updateData);
            console.log('Update hotel response:', response);
            
            // Cập nhật dữ liệu local
            setHotelData(prev => ({
                ...prev,
                ...response.data || response
            }));
            
            return response.data || response;
        } catch (error) {
            console.error('Error updating hotel:', error);
            setError(error?.response?.data?.message || error.message || 'Không thể cập nhật thông tin khách sạn');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Upload hình ảnh khách sạn
    const uploadHotelImages = useCallback(async (hotelId, files) => {
        try {
            setLoading(true);
            setError(null);

            // Truyền trực tiếp mảng images (files) vào API service
            const response = await hotelApiService.uploadHotelImages(hotelId, files);

            // Cập nhật dữ liệu local với hình ảnh mới
            setHotelData(prev => ({
                ...prev,
                images: [...(prev?.images || []), ...(response.data?.images || [])]
            }));

            return response.data;
        } catch (error) {
            console.error('Error uploading images:', error);
            setError(error?.response?.data?.message || error.message || 'Không thể upload hình ảnh');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Xóa hình ảnh
    const deleteHotelImage = useCallback(async (hotelId, imageId) => {
        try {
            setLoading(true);
            setError(null);
            
            await hotelApiService.deleteHotelImage(hotelId, imageId);
            
            // Cập nhật dữ liệu local
            setHotelData(prev => ({
                ...prev,
                images: prev?.images?.filter(img => img.id !== imageId) || []
            }));
            
            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            setError(error?.response?.data?.message || error.message || 'Không thể xóa hình ảnh');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Set thumbnail image
    const setThumbnailImage = useCallback(async (hotelId, imageId) => {
        try {
            setLoading(true);
            setError(null);
            
            await hotelApiService.setThumbnailImage(hotelId, imageId);
            
            // Refresh hotel data
            await fetchOwnerHotel();
            
            return true;
        } catch (error) {
            console.error('Error setting thumbnail:', error);
            setError(error?.response?.data?.message || error.message || 'Không thể đặt ảnh đại diện');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchOwnerHotel]);

    // Update hotel amenities
    const updateHotelAmenities = useCallback(async (hotelId, amenities) => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await hotelApiService.updateHotelAmenities(hotelId, amenities);
            
            // Refresh hotel data
            await fetchOwnerHotel();
            
            return result;
        } catch (error) {
            console.error('Error updating amenities:', error);
            setError(error?.response?.data?.message || error.message || 'Không thể cập nhật tiện nghi');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchOwnerHotel]);

    // Get available amenities
    const getAvailableAmenities = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await hotelApiService.getAvailableAmenities();
            return result;
        } catch (error) {
            console.error('Error fetching amenities:', error);
            setError(error?.response?.data?.message || error.message || 'Không thể tải danh sách tiện nghi');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Tạo mới khách sạn
    const createOwnerHotel = useCallback(async (hotelData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await hotelApiService.createHotel(hotelData);
            // Refetch lại danh sách khách sạn sau khi tạo mới
            await fetchOwnerHotel();
            return response.data || response;
        } catch (error) {
            console.error('Error creating hotel:', error);
            setError(error?.response?.data?.message || error.message || 'Không thể tạo khách sạn mới');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchOwnerHotel]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Reset state
    const resetState = useCallback(() => {
        setHotelData(null);
        setError(null);
        setLoading(false);
    }, []);

    // Utility functions
    const hasHotel = !!hotelData;
    const isApproved = hotelData?.status === 'approved';
    const isPending = hotelData?.status === 'pending';
    const isRejected = hotelData?.status === 'rejected';
    
    const getStatusText = useCallback(() => {
        if (!hotelData) return '';
        switch (hotelData.status) {
            case 'approved':
                return 'Đã duyệt';
            case 'pending':
                return 'Chờ duyệt';
            case 'rejected':
                return 'Bị từ chối';
            default:
                return 'Không xác định';
        }
    }, [hotelData?.status]);

    const getStatusColor = useCallback(() => {
        if (!hotelData) return 'gray';
        switch (hotelData.status) {
            case 'approved':
                return 'green';
            case 'pending':
                return 'yellow';
            case 'rejected':
                return 'red';
            default:
                return 'gray';
        }
    }, [hotelData?.status]);

    return {
        // State
        hotelData,
        loading,
        error,
        
        // Computed state
        hasHotel,
        isApproved,
        isPending,
        isRejected,
        
        // Actions
        fetchOwnerHotel,
        updateOwnerHotel,
        uploadHotelImages,
        deleteHotelImage,
        setThumbnailImage,
        clearError,
        resetState,
        updateHotelAmenities,
        getAvailableAmenities,
        createOwnerHotel,
        fetchBookingsByHotelId,
        // Utility functions
        getStatusText,
        getStatusColor
    };
};

export default useHotelOwner;