// src/components/common/NotificationPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Clock, FileText, Building2 } from 'lucide-react';
import useNotification from '../../hooks/useNotification';

const NotificationPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const panelRef = useRef(null);
    
    const { 
        notifications, 
        loading, 
        unreadCount, 
        markAsRead, 
        markAllAsRead,
        fetchNotifications 
    } = useNotification();

    // Đóng panel khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
                setSelectedNotification(null);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        setSelectedNotification(null);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = async (notification) => {
        console.log('[NotificationPanel] handleNotificationClick - notification:', notification);
        setSelectedNotification(notification);
        
        // Đánh dấu đã đọc nếu chưa đọc
        // MongoDB _id có thể là object { "$oid": "..." } hoặc string
        let notificationId = notification._id;
        if (notificationId && typeof notificationId === 'object' && notificationId.$oid) {
            notificationId = notificationId.$oid;
        }
        // Fallback
        if (!notificationId) {
            notificationId = notification.notificationId || notification.notification_id;
        }
        
        console.log('[NotificationPanel] Extracted notification ID:', notificationId);
        
        if (!notification.is_read && !notification.isRead && notificationId) {
            console.log('[NotificationPanel] Marking as read:', notificationId);
            await markAsRead(notificationId);
        } else {
            console.log('[NotificationPanel] Not marking as read:', {
                is_read: notification.is_read,
                isRead: notification.isRead,
                hasId: !!notificationId
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'Change Status Contract':
                return <FileText size={20} className="text-blue-500" />;
            case 'Change Status Hotel':
                return <Building2 size={20} className="text-green-500" />;
            default:
                return <Bell size={20} className="text-gray-500" />;
        }
    };

    const formatDate = (dateString) => {
        // Xử lý date từ MongoDB: { "$date": "..." } hoặc string thông thường
        let dateValue = dateString;
        if (dateString && typeof dateString === 'object' && dateString.$date) {
            dateValue = dateString.$date;
        }
        
        const date = new Date(dateValue);
        
        // Kiểm tra date hợp lệ
        if (isNaN(date.getTime())) {
            return 'Không xác định';
        }
        
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Icon */}
            <button
                onClick={handleToggle}
                className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
                    {selectedNotification ? (
                        // Chi tiết thông báo
                        <div className="flex flex-col h-full max-h-[600px]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    ← Quay lại
                                </button>
                                <button
                                    onClick={handleToggle}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="flex items-start space-x-3 mb-4">
                                    {getNotificationIcon(selectedNotification.notification_type)}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {selectedNotification.title}
                                        </h3>
                                        <div className="flex items-center text-xs text-gray-500 mb-4">
                                            <Clock size={14} className="mr-1" />
                                            {formatDate(selectedNotification.created_at?.$date || selectedNotification.created_at)}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedNotification.message}
                                    </p>
                                </div>

                                {/* Metadata */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between py-2 border-t border-gray-200">
                                        <span className="text-gray-500">Loại thông báo:</span>
                                        <span className="font-medium text-gray-900">
                                            {selectedNotification.notification_type === 'Change Status Contract' 
                                                ? 'Thay đổi hợp đồng'
                                                : 'Thay đổi khách sạn'}
                                        </span>
                                    </div>
                                    {selectedNotification.hotel_id && (
                                        <div className="flex items-center justify-between py-2 border-t border-gray-200">
                                            <span className="text-gray-500">Mã khách sạn:</span>
                                            <span className="font-mono text-xs text-gray-700">
                                                {selectedNotification.hotel_id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    )}
                                    {selectedNotification.contract_id && (
                                        <div className="flex items-center justify-between py-2 border-t border-gray-200">
                                            <span className="text-gray-500">Mã hợp đồng:</span>
                                            <span className="font-mono text-xs text-gray-700">
                                                {selectedNotification.contract_id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Danh sách thông báo
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Thông báo
                                </h3>
                                <div className="flex items-center space-x-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            <CheckCheck size={16} className="inline mr-1" />
                                            Đọc tất cả
                                        </button>
                                    )}
                                    <button
                                        onClick={handleToggle}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[500px] overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <Bell size={48} className="mb-4" />
                                        <p className="text-sm">Không có thông báo</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {notifications.map((notification) => {
                                            const isUnread = !notification.is_read && !notification.isRead;
                                            // Xử lý _id từ MongoDB
                                            let notificationId = notification._id;
                                            if (notificationId && typeof notificationId === 'object' && notificationId.$oid) {
                                                notificationId = notificationId.$oid;
                                            }
                                            // Fallback
                                            if (!notificationId) {
                                                notificationId = notification.notificationId || notification.notification_id;
                                            }
                                            
                                            return (
                                                <div
                                                    key={notificationId}
                                                    onClick={() => {
                                                        console.log('[NotificationPanel] Clicked notification:', notification);
                                                        console.log('[NotificationPanel] Notification ID:', notificationId);
                                                        handleNotificationClick(notification);
                                                    }}
                                                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                        isUnread ? 'bg-blue-50' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            {getNotificationIcon(notification.notification_type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <p className={`text-sm font-medium text-gray-900 ${
                                                                    isUnread ? 'font-semibold' : ''
                                                                }`}>
                                                                    {notification.title}
                                                                </p>
                                                                {isUnread && (
                                                                    <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                {notification.message}
                                                            </p>
                                                            <div className="flex items-center mt-2 text-xs text-gray-500">
                                                                <Clock size={12} className="mr-1" />
                                                                {formatDate(notification.created_at || notification.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-gray-200 text-center">
                                    <button
                                        onClick={fetchNotifications}
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        Tải thêm
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
