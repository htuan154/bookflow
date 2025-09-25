// src/hooks/useHotelStatus.js
import { useState } from 'react';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import useApi from './useApi';
import { notificationService } from '../api/notification.service';

const useHotelStatus = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { request } = useApi();

    /**
     * Duyệt khách sạn
     * @param {string} hotelId - ID của khách sạn
     * @param {Object} hotelData - Thông tin khách sạn (tên, owner_id, trạng thái cũ)
     * @returns {Promise} Promise resolve khi thành công
     */
    const approveHotel = async (hotelId, hotelData = {}) => {
        console.log('approveHotel called with hotelId:', hotelId);
        setLoading(true);
        setError(null);

        try {
            const url = API_ENDPOINTS.ADMIN.APPROVE_HOTEL(hotelId);
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            console.log('API URL:', url);
            console.log('Token exists:', !!token);
            console.log('Request data:', { status: 'approved' });
            
            const response = await request({
                url: url,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    status: 'approved'
                }
            });

            console.log('API Response:', response);
            
            // Gửi thông báo cho hotel owner
            if (hotelData.ownerId) {
                try {
                    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('authUser') || '{}');
                    console.log('Current user data:', currentUser);
                    console.log('Hotel data:', hotelData);
                    
                    const senderId = currentUser.id || currentUser.userId || currentUser.user_id || 'admin';
                    const receiverId = hotelData.ownerId;
                    const message = `Trạng thái của khách sạn: ${hotelData.name || 'N/A'}, đã chuyển trạng thái: ${hotelData.oldStatus || 'pending'} sang trạng thái: approved`;
                    
                    console.log('=== NOTIFICATION DATA CHECK ===');
                    console.log('senderId:', senderId, 'type:', typeof senderId);
                    console.log('receiverId:', receiverId, 'type:', typeof receiverId);
                    console.log('message:', message, 'type:', typeof message);
                    console.log('hotelId:', hotelId, 'type:', typeof hotelId);
                    
                    if (!receiverId) {
                        console.error('❌ receiverId is missing or null!');
                        throw new Error('Hotel owner ID not found');
                    }
                    
                    const notificationData = {
                        senderId: senderId,
                        receiverId: receiverId,
                        message: message,
                        hotelId: hotelId,
                        notification_type: 'Change Status Hotel'
                    };
                    
                    console.log('Sending notification with data:', notificationData);
                    
                    await notificationService.sendHotelStatusChangeNotification(notificationData);
                    
                    console.log('Notification sent successfully');
                } catch (notificationError) {
                    console.error('Error sending notification:', notificationError);
                    // Không throw error vì notification không phải critical
                }
            }
            
            return response;
        } catch (err) {
            console.error('Error in approveHotel:', err);
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
     * @param {Object} hotelData - Thông tin khách sạn (tên, owner_id, trạng thái cũ)
     * @returns {Promise} Promise resolve khi thành công
     */
    const rejectHotel = async (hotelId, reason = '', hotelData = {}) => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const response = await request({
                url: API_ENDPOINTS.ADMIN.REJECT_HOTEL(hotelId),
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    status: 'rejected'
                }
            });
            
            // Gửi thông báo cho hotel owner
            if (hotelData.ownerId) {
                try {
                    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('authUser') || '{}');
                    console.log('Current user data (reject):', currentUser);
                    
                    const senderId = currentUser.id || currentUser.userId || currentUser.user_id || 'admin';
                    const receiverId = hotelData.ownerId;
                    let message = `Trạng thái của khách sạn: ${hotelData.name || 'N/A'}, đã chuyển trạng thái: ${hotelData.oldStatus || 'pending'} sang trạng thái: rejected`;
                    
                    // Thêm lý do từ chối nếu có
                    if (reason && reason.trim()) {
                        message += `. Lý do từ chối: ${reason.trim()}`;
                    }
                    
                    console.log('=== NOTIFICATION DATA CHECK (REJECT) ===');
                    console.log('senderId:', senderId, 'type:', typeof senderId);
                    console.log('receiverId:', receiverId, 'type:', typeof receiverId);
                    console.log('message:', message, 'type:', typeof message);
                    console.log('hotelId:', hotelId, 'type:', typeof hotelId);
                    
                    if (!receiverId) {
                        console.error('❌ receiverId is missing or null!');
                        throw new Error('Hotel owner ID not found');
                    }
                    
                    const notificationData = {
                        senderId: senderId,
                        receiverId: receiverId,
                        message: message,
                        hotelId: hotelId,
                        notification_type: 'Change Status Hotel'
                    };
                    
                    console.log('Sending notification with data (reject):', notificationData);
                    
                    await notificationService.sendHotelStatusChangeNotification(notificationData);
                    
                    console.log('Notification sent successfully');
                } catch (notificationError) {
                    console.error('Error sending notification:', notificationError);
                    // Không throw error vì notification không phải critical
                }
            }
            
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
     * @param {Object} hotelData - Thông tin khách sạn (tên, owner_id, trạng thái cũ, ghi chú)
     * @returns {Promise} Promise resolve khi thành công
     */
    const restoreHotel = async (hotelId, hotelData = {}) => {
        console.log('restoreHotel called with hotelId:', hotelId);
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            console.log('API URL:', API_ENDPOINTS.ADMIN.RESTORE_HOTEL(hotelId));
            console.log('Token exists:', !!token);
            console.log('Request data:', { status: 'pending' });
            
            const response = await request({
                url: API_ENDPOINTS.ADMIN.RESTORE_HOTEL(hotelId),
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    status: 'pending'
                }
            });

            console.log('Restore API Response:', response);
            
            // Gửi thông báo cho hotel owner
            if (hotelData.ownerId) {
                try {
                    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('authUser') || '{}');
                    console.log('Current user data (restore):', currentUser);
                    console.log('Hotel data (restore):', hotelData);
                    
                    let message = `Trạng thái khách sạn: ${hotelData.name || 'N/A'}, đã chuyển từ trạng thái: ${hotelData.oldStatus || 'rejected'} sang trạng thái: pending`;
                    
                    // Thêm ghi chú vào message nếu có
                    if (hotelData.note && hotelData.note.trim()) {
                        message += `. Ghi chú: ${hotelData.note.trim()}`;
                    }
                    
                    const notificationData = {
                        hotelId: hotelId, // Sửa từ hotel_id thành hotelId để notification service nhận diện đúng
                        senderId: currentUser.userId || currentUser.id || 'admin',
                        receiverId: hotelData.ownerId,
                        title: 'Thay đổi trạng thái khách sạn',
                        message: message,
                        notification_type: 'Change Status Hotel'
                    };
                    
                    console.log('Sending restore notification with data:', notificationData);
                    
                    await notificationService.sendHotelStatusChangeNotification(notificationData);
                    
                    console.log('✅ Restore notification sent successfully');
                } catch (notificationError) {
                    console.error('❌ Error sending restore notification:', notificationError);
                    // Không throw error vì notification không phải critical
                }
            } else {
                console.warn('⚠️ Could not send notification: hotel owner ID not found');
            }
            
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
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const response = await request({
                url: API_ENDPOINTS.ADMIN.UPDATE_HOTEL_STATUS(hotelId),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    status,
                    updated_at: new Date().toISOString(),
                    ...additionalData
                }
            });
            
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
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const response = await request({
                url: `${API_ENDPOINTS.ADMIN.GET_ALL_HOTELS}/${hotelId}/status-history`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

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
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const response = await request({
                url: `${API_ENDPOINTS.ADMIN.GET_ALL_HOTELS}/${hotelId}/notify`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    status,
                    message,
                    sent_at: new Date().toISOString()
                }
            });

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