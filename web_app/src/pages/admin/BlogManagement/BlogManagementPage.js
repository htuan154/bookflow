// src/pages/admin/BlogManagement/BlogManagementPage.js
import React, { useState, useEffect } from 'react';
import BlogList from '../../../components/blog/BlogList';
import { 
    FileText, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Archive
} from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import useAuth from '../../../hooks/useAuth';

const BlogManagementPage = () => {
    const { user, isAuthenticated } = useAuth();
    const {
        loading,
        error,
        statistics,
        fetchStatistics,
        clearError
    } = useBlogContext();

    const [currentStatus, setCurrentStatus] = useState('all');

    // Kiểm tra authentication trước khi load
    useEffect(() => {
        if (isAuthenticated) {
            loadStatistics();
        } else {
            console.log('User not authenticated, redirecting to login...');
            // Redirect hoặc show login message
        }
    }, [isAuthenticated]);

    const loadStatistics = async () => {
        try {
            await fetchStatistics();
        } catch (error) {
            console.error('Failed to load blog statistics:', error);
        }
    };

    // Nếu chưa đăng nhập, hiển thị message
    if (!isAuthenticated) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">
                            Yêu cầu đăng nhập
                        </h3>
                        <p className="text-yellow-700 mb-4">
                            Bạn cần đăng nhập với quyền admin để truy cập trang này.
                        </p>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusCounts = () => {
        if (!statistics) {
            return {
                all: 0,
                draft: 0,
                pending: 0,
                published: 0,
                archived: 0,
                rejected: 0
            };
        }
        
        return {
            all: statistics.total || 0,
            draft: statistics.draft || 0,
            pending: statistics.pending || 0,
            published: statistics.published || 0,
            archived: statistics.archived || 0,
            rejected: statistics.rejected || 0
        };
    };

    const statusCounts = getStatusCounts();

    // Handler khi click tab - chỉ đổi currentStatus
    const handleStatusChange = (status) => {
        setCurrentStatus(status);
    };

    // Handler cho các action từ BlogList
    const handleBlogAction = (action, blog) => {
        switch (action) {
            case 'create':
                console.log('Create blog');
                break;
            case 'edit':
                console.log('Edit blog:', blog);
                break;
            case 'view':
                console.log('View blog:', blog);
                break;
            case 'delete':
                console.log('Delete blog:', blog);
                break;
            default:
                console.log('Unknown action:', action);
        }
    };

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <XCircle className="h-6 w-6 text-red-600" />
                            <div>
                                <h3 className="text-lg font-medium text-red-800">
                                    Có lỗi xảy ra
                                </h3>
                                <p className="text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                clearError();
                                loadStatistics();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý bài viết
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý tất cả bài viết du lịch và đánh giá khách sạn
                    </p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {[
                            { 
                                key: 'all', 
                                label: 'Tất cả', 
                                icon: FileText,
                                color: 'text-gray-600' 
                            },
                            { 
                                key: 'draft', 
                                label: 'Nháp', 
                                icon: AlertCircle,
                                color: 'text-gray-600' 
                            },
                            { 
                                key: 'pending', 
                                label: 'Chờ duyệt', 
                                icon: Clock,
                                color: 'text-yellow-600' 
                            },
                            { 
                                key: 'published', 
                                label: 'Đã xuất bản', 
                                icon: CheckCircle,
                                color: 'text-green-600' 
                            },
                            { 
                                key: 'archived', 
                                label: 'Lưu trữ', 
                                icon: Archive,
                                color: 'text-blue-600' 
                            },
                            { 
                                key: 'rejected', 
                                label: 'Bị từ chối', 
                                icon: XCircle,
                                color: 'text-red-600' 
                            }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleStatusChange(tab.key)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                                        currentStatus === tab.key
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                    {statusCounts[tab.key] !== undefined && statusCounts[tab.key] > 0 && (
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                            currentStatus === tab.key 
                                                ? 'bg-blue-100 text-blue-600' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {statusCounts[tab.key]}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Blog List - Truyền currentStatus làm filter */}
            <BlogList
                adminView={true}
                statusFilter={currentStatus}
                showActions={true}
                selectable={true}
                onBlogSelect={handleBlogAction}
            />
        </div>
    );
};

export default BlogManagementPage;