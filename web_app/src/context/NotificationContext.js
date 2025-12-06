// src/context/NotificationContext.js
import React, { createContext, useState, useCallback, useEffect } from 'react';
import { notificationService } from '../api/notification.service';
import useAuth from '../hooks/useAuth';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Tính số thông báo chưa đọc
    const calculateUnreadCount = useCallback((notificationList) => {
        const count = notificationList.filter(n => !n.is_read && !n.isRead).length;
        setUnreadCount(count);
    }, []);

    // Lấy danh sách thông báo
    const fetchNotifications = useCallback(async (params = {}) => {
        if (!user?.userId) return;

        try {
            setLoading(true);
            setError(null);
            
            const response = await notificationService.getNotificationsByReceiver(
                user.userId,
                { limit: params.limit || 20, skip: params.skip || 0 }
            );

            if (response.success) {
                setNotifications(response.data || []);
                calculateUnreadCount(response.data || []);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    }, [user?.userId, calculateUnreadCount]);

    // Đánh dấu đã đọc
    const markAsRead = useCallback(async (notificationId) => {
        if (!user?.userId) return;

        try {
            console.log('[NotificationContext] markAsRead called with:', notificationId);
            const response = await notificationService.markAsRead(notificationId, user.userId);
            
            console.log('[NotificationContext] markAsRead response:', response);
            
            if (response.success) {
                // Cập nhật state local
                setNotifications(prev => 
                    prev.map(notification => {
                        // So sánh _id với notificationId (cả dạng object và string)
                        let nId = notification._id;
                        if (nId && typeof nId === 'object' && nId.$oid) {
                            nId = nId.$oid;
                        }
                        
                        const isMatch = nId === notificationId || notification.notification_id === notificationId;
                        
                        if (isMatch) {
                            console.log('[NotificationContext] Updating notification:', nId, '-> is_read: true');
                            return { ...notification, is_read: true, isRead: true };
                        }
                        return notification;
                    })
                );
                
                // Cập nhật unread count
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    }, [user?.userId]);

    // Đánh dấu tất cả đã đọc
    const markAllAsRead = useCallback(async () => {
        if (!user?.userId) return;

        try {
            const unreadNotifications = notifications.filter(n => !n.is_read && !n.isRead);
            
            // Đánh dấu từng thông báo (có thể tối ưu bằng bulk API nếu backend hỗ trợ)
            await Promise.all(
                unreadNotifications.map(n => 
                    notificationService.markAsRead(n._id || n.notification_id, user.userId)
                )
            );

            // Cập nhật state
            setNotifications(prev => 
                prev.map(notification => ({
                    ...notification,
                    is_read: true,
                    isRead: true
                }))
            );
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    }, [notifications, user?.userId]);

    // Auto-fetch khi component mount và user thay đổi
    useEffect(() => {
        if (user?.userId) {
            fetchNotifications();
        }
    }, [user?.userId, fetchNotifications]);

    // Polling để cập nhật thông báo mới (mỗi 30s)
    useEffect(() => {
        if (!user?.userId) return;

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [user?.userId, fetchNotifications]);

    const value = {
        notifications,
        loading,
        error,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
