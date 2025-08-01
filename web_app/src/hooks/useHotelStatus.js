// src/hooks/useHotelStatus.js
import { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import useApi from './useApi';

const useHotelStatus = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { refreshHotels } = useHotel();
    const { makeRequest } = useApi();

    /**
     * Duyệt khách sạn
     * @param {string} hotelId - ID của khách sạn
     * @returns {Promise} Promise resolve khi thành công
     */
    const approveHotel = async (hotelId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await makeRequest(
                API_ENDPOINTS.ADMIN.APPROVE_HOTEL(hotelId),
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'approved',
                        approved_at: new Date().toISOString()
                    })
                }
            );

            // Refresh data sau khi approve thành công
            await refreshHotels();
            
            return response;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi duyệt khách sạn';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Từ chối khách sạn
     * @param {string} hotelId - ID của khách sạn
     * @param {string} reason - Lý do từ chối
     * @returns {Promise} Promise resolve khi thành công
     */
    const rejectHotel = async (hotelId, reason = '') => {
        setLoading(true);
        setError(null);

        try {
            const response = await makeRequest(
                API_ENDPOINTS.ADMIN.REJECT_HOTEL(hotelId),
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'rejected',
                        rejected_at: new Date().toISOString(),
                        rejection_reason: reason
                    })
                }
            );

            // Refresh data sau khi reject thành công
            await refreshHotels();
            
            return response;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi từ chối khách sạn';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Khôi phục khách sạn (từ rejected về pending)
     * @param {string} hotelId - ID của khách sạn
     * @returns {Promise} Promise resolve khi thành công
     */
    const restoreHotel = async (hotelId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await makeRequest(
                API_ENDPOINTS.ADMIN.RESTORE_HOTEL(hotelId),
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'pending',
                        restored_at: new Date().toISOString(),
                        rejection_reason: null
                    })
                }
            );

            // Refresh data sau khi restore thành công
            await refreshHotels();
            
            return response;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi khôi phục khách sạn';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cập nhật trạng thái khách sạn (generic function)
     * @param {string} hotelId - ID của khách sạn
     * @param {string} status - Trạng thái mới (approved, rejected, pending)
     * @param {Object} additionalData - Dữ liệu bổ sung
     * @returns {Promise} Promise resolve khi thành công
     */
    const updateHotelStatus = async (hotelId, status, additionalData = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await makeRequest(
                API_ENDPOINTS.ADMIN.UPDATE_HOTEL_STATUS(hotelId),
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status,
                        updated_at: new Date().toISOString(),
                        ...additionalData
                    })
                }
            );

            // Refresh data sau khi update thành công
            await refreshHotels();
            
            return response;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật trạng thái khách sạn';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Lấy lịch sử thay đổi trạng thái của khách sạn
     * @param {string} hotelId - ID của khách sạn
     * @returns {Promise} Promise resolve với data lịch sử
     */
    const getHotelStatusHistory = async (hotelId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await makeRequest(
                `${API_ENDPOINTS.ADMIN.GET_ALL_HOTELS}/${hotelId}/status-history`,
                {
                    method: 'GET',
                }
            );

            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lấy lịch sử trạng thái';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Gửi thông báo cho hotel owner về thay đổi trạng thái
     * @param {string} hotelId - ID của khách sạn
     * @param {string} status - Trạng thái mới
     * @param {string} message - Tin nhắn thông báo
     * @returns {Promise} Promise resolve khi thành công
     */
    const notifyHotelOwner = async (hotelId, status, message) => {
        setLoading(true);
        setError(null);

        try {
            const response = await makeRequest(
                `${API_ENDPOINTS.ADMIN.GET_ALL_HOTELS}/${hotelId}/notify`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status,
                        message,
                        sent_at: new Date().toISOString()
                    })
                }
            );

            return response;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gửi thông báo';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        // States
        loading,
        error,
        
        // Methods
        approveHotel,
        rejectHotel,
        restoreHotel,
        updateHotelStatus,
        getHotelStatusHistory,
        notifyHotelOwner,
        
        // Utility
        clearError: () => setError(null)
    };
};

export default useHotelStatus;