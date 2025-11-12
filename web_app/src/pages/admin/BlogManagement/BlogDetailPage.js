import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Eye, 
    Calendar, 
    Tag,
    Globe,
    CheckCircle,
    User,
    XCircle,
    Clock,
    AlertTriangle,
    Archive,
    Loader
} from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import useAuth from '../../../hooks/useAuth';

const BlogDetailPage = () => {
    const { blogId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { getBlogById, updateBlogStatus, deleteBlog, loading, error, clearError, clearCurrentBlog } = useBlogContext();

    const [blog, setBlog] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Clear blog data when component unmounts
    useEffect(() => {
        return () => {
            clearCurrentBlog();
        };
    }, [clearCurrentBlog]);

    // Load blog data when component mounts
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (blogId) {
            console.log('🔍 BlogDetailPage mounted with blogId:', blogId);
            console.log('🔍 BlogId length:', blogId?.length);
            console.log('🔍 BlogId type:', typeof blogId);
            
            // Kiểm tra format UUID
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blogId);
            console.log('🔍 Is valid UUID format:', isValidUUID);
            
            if (!isValidUUID) {
                console.error('❌ Invalid blog ID format:', blogId);
                return;
            }
            
            loadBlogDetail();
        } else {
            console.error('❌ No blogId provided from URL params');
        }
    }, [blogId, isAuthenticated]);

    const loadBlogDetail = async () => {
        try {
            // DEBUG TOKEN TOÀN DIỆN
            console.log('=== FULL TOKEN DEBUG ===');
            
            // 1. Kiểm tra tất cả localStorage
            console.log('📦 All localStorage keys:', Object.keys(localStorage));
            Object.keys(localStorage).forEach(key => {
                const value = localStorage.getItem(key);
                console.log(`  - ${key}: ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null'}`);
            });
            
            // 2. Kiểm tra user object
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const userObj = JSON.parse(userData);
                    console.log('👤 User object:', userObj);
                    console.log('👤 User role:', userObj.roleId || userObj.role);
                    console.log('👤 User tokens in object:', {
                        accessToken: !!userObj.accessToken,
                        access_token: !!userObj.access_token,
                        token: !!userObj.token
                    });
                } catch (e) {
                    console.error('Failed to parse user data:', e);
                }
            }
            
            // 3. Thử manual token test
            const possibleTokens = [
                localStorage.getItem('accessToken'),
                localStorage.getItem('access_token'),
                localStorage.getItem('token'),
                localStorage.getItem('authToken'),
                localStorage.getItem('jwt')
            ];
            
            console.log('🔑 Token candidates:');
            possibleTokens.forEach((token, index) => {
                if (token) {
                    console.log(`  ${index}: ${token.substring(0, 30)}... (length: ${token.length})`);
                } else {
                    console.log(`  ${index}: null`);
                }
            });
            
            // 4. Manual API call test với token
            const validToken = possibleTokens.find(t => t && t.length > 10);
            if (validToken) {
                console.log('🧪 Testing manual API call with token...');
                try {
                    const testResponse = await fetch(`/api/blogs/${blogId}`, {
                        headers: {
                            'Authorization': `Bearer ${validToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('🧪 Manual test response status:', testResponse.status);
                    if (!testResponse.ok) {
                        const errorText = await testResponse.text();
                        console.log('🧪 Manual test error:', errorText);
                    }
                } catch (testError) {
                    console.error('🧪 Manual test failed:', testError);
                }
            }
            
            // 5. Proceed with normal API call
            console.log('🔍 Loading blog detail for ID:', blogId);
            const blogData = await getBlogById(blogId);
            console.log('✅ Blog data received:', blogData);
            
            if (blogData) {
                setBlog(blogData);
            } else {
                console.error('❌ No blog data returned from API');
            }
        } catch (error) {
            console.error('❌ Error loading blog detail:', error);
            
            // EMERGENCY FIX: Thử đăng nhập lại
            if (error.message?.includes('401') || error.message?.includes('đăng nhập')) {
                console.log('🚨 AUTHENTICATION FAILED - FORCING RE-LOGIN');
                alert('Token không hợp lệ! Đăng nhập lại để tiếp tục.');
                
                // Clear tất cả auth data
                localStorage.clear();
                sessionStorage.clear();
                
                // Redirect to login
                window.location.href = '/login';
                return;
            }
            
            // Xử lý lỗi cụ thể
            if (error.message?.includes('404')) {
                console.error('❌ Blog not found (404)');
            } else if (error.message?.includes('403')) {
                console.error('❌ Access denied (403) - ADMIN should have access!');
                alert('Lỗi 403: Không có quyền truy cập. Kiểm tra token authentication!');
            } else if (error.message?.includes('401')) {
                console.error('❌ Unauthorized (401) - Token invalid');
                alert('Lỗi 401: Token không hợp lệ. Đăng nhập lại!');
                navigate('/login');
            } else if (error.message?.includes('Bạn cần đăng nhập')) {
                console.error('❌ Authentication required');
                alert('Vui lòng đăng nhập để xem bài viết!');
                navigate('/login');
            }
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!blog || !newStatus) return;

        // Sử dụng blogId theo model Blog
        const blogIdToUse = blog.blogId;
        console.log('🔄 Updating status for blogId:', blogIdToUse);

        if (!blogIdToUse) {
            alert('Không tìm thấy blogId để cập nhật!');
            return;
        }

        try {
            setIsUpdatingStatus(true);
            await updateBlogStatus(blogIdToUse, newStatus);
            setBlog(prev => ({ ...prev, status: newStatus }));
            alert(`Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Không thể cập nhật trạng thái!');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!blog) return;

        // Sử dụng blogId theo model Blog
        const blogIdToUse = blog.blogId;
        console.log('🗑️ Deleting blog with blogId:', blogIdToUse);

        if (!blogIdToUse) {
            alert('Không tìm thấy blogId để xóa!');
            return;
        }

        try {
            await deleteBlog(blogIdToUse);
            alert('Đã xóa bài viết thành công!');
            navigate('/admin/blog-management');
        } catch (error) {
            console.error('Error deleting blog:', error);
            alert('Không thể xóa bài viết!');
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            draft: 'Nháp',
            pending: 'Chờ duyệt',
            published: 'Đã xuất bản',
            archived: 'Lưu trữ',
            rejected: 'Bị từ chối'
        };
        return statusMap[status] || status;
    };

    const getStatusIcon = (status) => {
        const iconMap = {
            draft: <AlertTriangle className="h-4 w-4" />,
            pending: <Clock className="h-4 w-4" />,
            published: <CheckCircle className="h-4 w-4" />,
            archived: <Archive className="h-4 w-4" />,
            rejected: <XCircle className="h-4 w-4" />
        };
        return iconMap[status] || <AlertTriangle className="h-4 w-4" />;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            draft: 'bg-gray-100 text-gray-800',
            pending: 'bg-yellow-100 text-yellow-800',
            published: 'bg-green-100 text-green-800',
            archived: 'bg-blue-100 text-blue-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading && !blog) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Đang tải bài viết...</p>
                    <p className="text-sm text-gray-500 mt-2">ID: {blogId}</p>
                </div>
            </div>
        );
    }

    if (!blog && !loading) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                        Không tìm thấy bài viết
                    </h3>
                    <p className="text-red-700 mb-4">
                        Bài viết có thể đã bị xóa, bạn không có quyền xem hoặc ID không hợp lệ.
                    </p>
                    <div className="bg-white p-3 rounded border mb-4">
                        <p className="text-sm text-gray-600">
                            <strong>Debug Info:</strong>
                        </p>
                        <p className="text-sm">ID từ URL: {blogId}</p>
                        <p className="text-sm">Type: {typeof blogId}</p>
                        <p className="text-sm">Valid UUID: {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blogId) ? 'Yes' : 'No'}</p>
                        <p className="text-sm">User authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                        <p className="text-sm">Token exists: {!!(localStorage.getItem('accessToken') || localStorage.getItem('token')) ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => navigate('/admin/blog-management')}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                            Quay lại danh sách
                        </button>
                        <button
                            onClick={() => {
                                console.log('🔄 Retrying to load blog...');
                                loadBlogDetail();
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/blog-management')}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Quay lại</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Chi tiết bài viết
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Xem và quản lý thông tin bài viết
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => {
                            const blogIdToUse = blog.blogId;
                            navigate(`/admin/blog-management/edit/${blogIdToUse}`);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <Edit className="h-4 w-4" />
                        <span>Chỉnh sửa</span>
                    </button>
                    
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>Xóa</span>
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={clearError}
                            className="ml-auto text-red-400 hover:text-red-600"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Blog Content */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            {blog.title}
                        </h2>

                        {blog.featuredImageUrl && (
                            <div className="mb-6">
                                <img
                                    src={blog.featuredImageUrl}
                                    alt={blog.title}
                                    className="w-full h-64 object-cover rounded-lg"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}

                        {blog.excerpt && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tóm tắt</h3>
                                <p className="text-gray-700 italic">{blog.excerpt}</p>
                            </div>
                        )}

                        <div className="prose max-w-none">
                            <div className="whitespace-pre-wrap text-gray-800">
                                {blog.content}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Management */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Quản lý trạng thái
                        </h3>
                        
                        <div className="mb-4">
                            <span className="text-sm text-gray-600">Trạng thái hiện tại:</span>
                            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(blog.status)}`}>
                                {getStatusIcon(blog.status)}
                                <span>{getStatusText(blog.status)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Thay đổi trạng thái:
                            </label>
                            <select
                                value={blog.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={isUpdatingStatus}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="draft">Nháp</option>
                                <option value="pending">Chờ duyệt</option>
                                <option value="published">Đã xuất bản</option>
                                <option value="archived">Lưu trữ</option>
                                <option value="rejected">Bị từ chối</option>
                            </select>
                            {isUpdatingStatus && (
                                <p className="text-sm text-gray-600">Đang cập nhật...</p>
                            )}
                        </div>
                    </div>

                    {/* Blog Info */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Thông tin bài viết
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Ngày tạo</p>
                                    <p className="text-sm font-medium">
                                        {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <User className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Tác giả</p>
                                    <p className="text-sm font-medium">
                                        {blog.username || blog.authorId || 'Không rõ'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Slug</p>
                                    <p className="text-sm font-medium text-blue-600">{blog.slug}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Eye className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Lượt xem</p>
                                    <p className="text-sm font-medium">{blog.viewCount || 0}</p>
                                </div>
                            </div>

                            {blog.tags && (
                                <div className="flex items-center space-x-3">
                                    <Tag className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-600">Tags</p>
                                        <p className="text-sm font-medium">{blog.tags}</p>
                                    </div>
                                </div>
                            )}

                            {blog.metaDescription && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Meta Description</p>
                                    <p className="text-sm bg-gray-50 p-2 rounded">{blog.metaDescription}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Xác nhận xóa bài viết
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa bài viết "{blog.title}"? 
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete();
                                    setShowDeleteConfirm(false);
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default BlogDetailPage;