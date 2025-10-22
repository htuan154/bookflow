
// src/pages/admin/BlogManagement/BlogListPage.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, XCircle, Edit } from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import useAuth from '../../../hooks/useAuth';
import BlogList from '../../../components/blog/BlogList';

const BlogListPage = () => {
    const navigate = useNavigate();
    
    const { user } = useAuth();
    const { 
        blogs,
        loading,
        error,
        fetchBlogs, 
        createBlog,
        updateBlog,
        updateBlogStatus, 
        deleteBlog,
        clearError
    } = useBlogContext();

    const [actionLoading, setActionLoading] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [currentBlog, setCurrentBlog] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image_url: '',
        meta_description: '',
        tags: '',
        hotel_id: '',
        status: 'draft'
    });

    // Load blogs on mount
    useEffect(() => {
        fetchBlogs({ adminView: true });
    }, [fetchBlogs]);

    // Handle blog actions
    const handleCreateBlog = () => {
        console.log('Navigating to create blog page...');
        navigate('/admin/blogs/create');
    };

    const handleEditBlog = (blog) => {
        console.log('Navigating to edit blog:', blog);
        // Sửa lại đường dẫn cho đúng với trang chỉnh sửa của bạn
        navigate(`/admin/blog-management/edit/${blog.blog_id || blog.blogId}`);
    };

    const handleViewBlog = (blog) => {
        console.log('Viewing blog:', blog);
        setCurrentBlog(blog);
        setShowViewModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (showCreateModal) {
                const blogData = {
                    ...formData,
                    author_id: user.user_id,
                    slug: formData.slug || generateSlug(formData.title)
                };
                await createBlog(blogData);
                setShowCreateModal(false);
                alert('Tạo bài viết thành công!');
            } else if (showEditModal) {
                await updateBlog(currentBlog.blog_id, formData);
                setShowEditModal(false);
                alert('Cập nhật bài viết thành công!');
            }
            await fetchBlogs({ adminView: true });
        } catch (error) {
            console.error('Failed to save blog:', error);
            alert('Có lỗi xảy ra: ' + error.message);
        }
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'title' && !prev.slug ? { slug: generateSlug(value) } : {})
        }));
    };

    // Handle blog status change
    const handleStatusChange = async (blogId, newStatus) => {
        try {
            console.log('Changing status:', blogId, newStatus);
            setActionLoading(`status-${blogId}`);
            await updateBlogStatus(blogId, newStatus);
            // Reload lại danh sách
            await fetchBlogs({ adminView: true });
        } catch (error) {
            console.error('Failed to update blog status:', error);
            alert('Cập nhật trạng thái thất bại: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle blog deletion
    const handleDeleteBlog = async (blog) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${blog.title}"?`)) {
            try {
                setActionLoading(`delete-${blog.blog_id}`);
                await deleteBlog(blog.blog_id);
                // Reload danh sách sau khi xóa
                await fetchBlogs({ adminView: true });
            } catch (error) {
                console.error('Failed to delete blog:', error);
                alert('Xóa bài viết thất bại: ' + error.message);
            } finally {
                setActionLoading(null);
            }
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Danh sách bài viết
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý tất cả bài viết du lịch
                    </p>
                </div>
                
                <button
                    onClick={handleCreateBlog}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    <span>Tạo bài viết</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                        <div className="ml-auto">
                            <button
                                onClick={clearError}
                                className="text-red-400 hover:text-red-600"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blog List */}
            <BlogList
                blogs={blogs}
                loading={loading}
                showActions={true}
                adminView={true}
                onBlogSelect={(action, blog) => {
                    console.log('Blog action:', action, blog);
                    if (action === 'create') handleCreateBlog();
                    else if (action === 'edit') handleEditBlog(blog);
                    else if (action === 'view') handleViewBlog(blog);
                    else if (action === 'delete') handleDeleteBlog(blog);
                }}
                onEdit={handleEditBlog}
                onView={handleViewBlog}
                onDelete={handleDeleteBlog}
                onStatusChange={(blog, status) => handleStatusChange(blog.blog_id, status)}
                isAdmin={user?.role === 'admin'}
                selectable={false}
                selectedBlogs={[]}
                onSelectBlogs={() => {}}
            />

            {/* Debug Modal States */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-yellow-100 rounded">
                    <h3 className="font-bold">Modal Debug:</h3>
                    <p>showCreateModal: {showCreateModal ? 'true' : 'false'}</p>
                    <p>showEditModal: {showEditModal ? 'true' : 'false'}</p>
                    <p>showViewModal: {showViewModal ? 'true' : 'false'}</p>
                    <p>currentBlog: {currentBlog ? currentBlog.title : 'null'}</p>
                </div>
            )}

            {/* Chỉ giữ lại View Modal, loại bỏ Create/Edit Modal */}
            {showViewModal && currentBlog && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowViewModal(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Chi tiết bài viết</h2>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleEditBlog(currentBlog);
                                    }}
                                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <Edit className="h-4 w-4" />
                                    <span>Chỉnh sửa</span>
                                </button>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <XCircle className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">{currentBlog.title}</h3>
                                <p className="text-gray-600">Slug: {currentBlog.slug}</p>
                            </div>
                            
                            {currentBlog.featured_image_url && (
                                <img
                                    src={currentBlog.featured_image_url}
                                    alt={currentBlog.title}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            )}
                            
                            <div>
                                <h4 className="font-medium mb-2">Nội dung:</h4>
                                <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
                                    <pre className="whitespace-pre-wrap">{currentBlog.content}</pre>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>Trạng thái: <span className="font-medium">{currentBlog.status}</span></div>
                                <div>Lượt xem: <span className="font-medium">{currentBlog.view_count || 0}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Modal Button - Để test */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-blue-100 rounded">
                    <h3 className="font-bold mb-2">Test Buttons:</h3>
                    <div className="space-x-2">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-3 py-1 bg-green-600 text-white rounded"
                        >
                            Test Create Modal
                        </button>
                        <button
                            onClick={() => {
                                setCurrentBlog(blogs?.[0]);
                                setShowViewModal(true);
                            }}
                            className="px-3 py-1 bg-purple-600 text-white rounded"
                            disabled={!blogs?.length}
                        >
                            Test View Modal
                        </button>
                    </div>
                </div>
            )}

            {/* Debug info - tạm thời để kiểm tra */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <h3 className="font-bold">Debug Info:</h3>
                    <p>Blogs count: {blogs?.length || 0}</p>
                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                    <p>Error: {error || 'None'}</p>
                    <p>User role: {user?.role || 'Unknown'}</p>
                </div>
            )}
        </div>
    );
};

export default BlogListPage;
