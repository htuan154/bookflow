// src/api/notification.service.js
import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const notificationService = {
  /**
   * Gửi thông báo khi thay đổi trạng thái khách sạn hoặc hợp đồng
   */
  sendHotelStatusChangeNotification: async (data) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      // Xác định loại thông báo và title
      const isContractNotification = data.contract_id || data.notification_type === 'Change Status Contract';
      const title = isContractNotification ? 
        (data.title || 'Thay đổi trạng thái của hợp đồng') : 
        (data.title || 'Thay đổi trạng thái của khách sạn');
      
      const notificationType = data.notification_type || (isContractNotification ? 'Change Status Contract' : 'Change Status Hotel');
      
      // Validation trước khi gửi
      if (!data.senderId) {
        throw new Error('senderId is required');
      }
      if (!data.receiverId) {
        throw new Error('receiverId is required');
      }
      if (!data.message) {
        throw new Error('message is required');
      }

      const notificationPayload = {
        contract_id: data.contract_id || null,
        sender_id: String(data.senderId), // Đảm bảo là string
        receiver_id: String(data.receiverId), // Đảm bảo là string
        title: title,
        message: String(data.message), // Đảm bảo là string
        notification_type: notificationType
      };
      
      // Chỉ thêm hotel_id nếu nó có giá trị (không phải null hoặc undefined)
      if (data.hotelId) {
        notificationPayload.hotel_id = String(data.hotelId);
      }
      
      console.log('=== NOTIFICATION DEBUG ===');
      console.log('Notification API URL:', API_ENDPOINTS.NOTIFICATIONS.CREATE);
      console.log('Raw input data:', data);
      console.log('Processed payload:', notificationPayload);
      console.log('Payload field types:', {
        contract_id: typeof notificationPayload.contract_id,
        sender_id: typeof notificationPayload.sender_id,
        receiver_id: typeof notificationPayload.receiver_id,
        title: typeof notificationPayload.title,
        message: typeof notificationPayload.message,
        notification_type: typeof notificationPayload.notification_type,
        hotel_id: typeof notificationPayload.hotel_id
      });

      const response = await axios.post(
        API_ENDPOINTS.NOTIFICATIONS.CREATE,
        notificationPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách thông báo theo receiverId
   */
  getNotificationsByReceiver: async (receiverId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const response = await axios.get(
        API_ENDPOINTS.NOTIFICATIONS.GET_BY_RECEIVER(receiverId),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  /**
   * Đánh dấu thông báo đã đọc
   */
  markAsRead: async (notificationId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const response = await axios.put(
        API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId),
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
};