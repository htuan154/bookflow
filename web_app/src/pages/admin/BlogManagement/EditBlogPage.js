// src/pages/admin/BlogManagement/EditBlogPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import useBlog from '../../../hooks/useBlog';
import BlogForm from '../../../components/blog/BlogForm';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const EditBlogPage = () => {
    const { blogId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        currentBlog,
        loading,
        error,
        getBlogById,
        updateBlog,
        clearLocalError
    } = useBlog();

    const [formLoading, setFormLoading] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Get return path from location state or default to blog list
    const returnPath = location.state?.from || '/admin/blog-management';

    // Validate blogId format (nếu dùng UUID)
    const isValidBlogId = (id) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    };

    useEffect(() => {
        let isMounted = true;
        
        const loadBlog = async () => {
            if (!blogId) {
                setFetching(false);
                setFetchError('Không có ID bài viết');
                return;
            }

            if (!isValidBlogId(blogId)) {
                console.error('Invalid blogId format:', blogId);
                setFetching(false);
                setNotFound(true);
                setFetchError('ID bài viết không hợp lệ');
                return;
            }

            try {
                setFetching(true);
                setNotFound(false);
                setFetchError(null);
                setInitialData(null);

                console.log('🔄 Fetching blog with ID:', blogId);

                const blog = await getBlogById(blogId);
                
                if (isMounted) {
                    console.log('📥 Blog response:', blog);
                    
                    if (blog && typeof blog === 'object') {
                        // ✅ MAPPING ĐÚNG THEO toJSON() method của Blog model
                        const formattedData = {
                            // Các field chính từ toJSON()
                            blogId: blog.blogId || '',
                            title: blog.title || '',
                            content: blog.content || '',
                            excerpt: blog.excerpt || '',
                            slug: blog.slug || '',
                            status: blog.status || 'draft',
                            hotelId: blog.hotelId || '',
                            authorId: blog.authorId || '',
                            
                            // Tags - xử lý đúng cách
                            tags: (() => {
                                if (Array.isArray(blog.tags)) {
                                    return blog.tags;
                                } else if (typeof blog.tags === 'string') {
                                    try {
                                        const parsed = JSON.parse(blog.tags);
                                        return Array.isArray(parsed) ? parsed : [];
                                    } catch {
                                        return blog.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                                    }
                                } else {
                                    return [];
                                }
                            })(),
                            
                            // Metadata fields từ toJSON()
                            metaDescription: blog.metaDescription || '',
                            featuredImageUrl: blog.featuredImageUrl || '', // ✅ Đúng field name từ toJSON()
                            
                            // Số liệu thống kê
                            viewCount: blog.viewCount || 0,
                            likeCount: blog.likeCount || 0,
                            commentCount: blog.commentCount || 0,
                            createdAt: blog.createdAt || '',
                        };
                        
                        console.log('✅ Formatted data for form:', formattedData);
                        console.log('✅ Content length:', formattedData.content?.length || 0);
                        console.log('✅ Excerpt length:', formattedData.excerpt?.length || 0);
                        console.log('✅ Tags:', formattedData.tags);
                        console.log('✅ Featured Image URL:', formattedData.featuredImageUrl);
                        console.log('✅ Meta Description:', formattedData.metaDescription);
                        
                        setInitialData(formattedData);
                        setNotFound(false);
                    } else {
                        console.warn('❌ Blog not found or invalid response:', blog);
                        setInitialData(null);
                        setNotFound(true);
                        setFetchError('Không tìm thấy bài viết');
                    }
                }
            } catch (error) {
                console.error('❌ Error loading blog:', error);
                
                if (isMounted) {
                    setInitialData(null);
                    
                    if (error.message?.includes('404')) {
                        setNotFound(true);
                        setFetchError('Bài viết không tồn tại hoặc đã bị xóa');
                    } else if (error.message?.includes('403')) {
                        setNotFound(false);
                        setFetchError('Bạn không có quyền truy cập bài viết này');
                    } else {
                        setNotFound(false);
                        setFetchError(error.message || 'Có lỗi xảy ra khi tải bài viết');
                    }
                }
            } finally {
                if (isMounted) {
                    setFetching(false);
                }
            }
        };

        loadBlog();

        return () => {
            isMounted = false;
        };
    }, [blogId]);

    const handleSubmit = async (formData) => {
        try {
            setFormLoading(true);
            clearLocalError();

            // Chỉ lấy các trường cần thiết cho backend
            const blogData = {
                title: formData.title,
                slug: formData.slug,
                content: formData.content,
                excerpt: formData.excerpt,
                status: formData.status,
                tags: Array.isArray(formData.tags)
                    ? formData.tags.join(',') // <-- chuyển array thành string
                    : (typeof formData.tags === 'string'
                        ? formData.tags
                        : ''),
                featured_image_url: formData.featuredImageUrl || null,
                meta_description: formData.metaDescription || null,
            };

            console.log('📤 Updating blog with data:', blogData);

            const updatedBlog = await updateBlog(blogId, blogData);

            // Hiển thị modal thành công thay vì chuyển trang ngay
            setShowSuccessModal(true);

            // Nếu muốn chuyển trang sau khi đóng modal, chuyển navigate vào handleCloseSuccessModal

        } catch (error) {
            console.error('Failed to update blog:', error);
            
            let errorMessage = 'Có lỗi xảy ra khi cập nhật bài viết';
            
            if (error.response?.status === 409 || error.message.includes('slug')) {
                errorMessage = 'Slug này đã được sử dụng, vui lòng chọn slug khác';
            } else if (error.message.includes('title')) {
                errorMessage = 'Tiêu đề này đã tồn tại, vui lòng chọn tiêu đề khác';
            } else if (error.response?.status === 422 || error.message.includes('validation')) {
                errorMessage = 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại';
            } else if (error.response?.status === 403 || error.message.includes('permission')) {
                errorMessage = 'Bạn không có quyền chỉnh sửa bài viết này';
            } else if (error.response?.status === 404) {
                errorMessage = 'Bài viết không tồn tại';
            }

            toast.error(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    // Đóng modal và chuyển về trang danh sách
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        navigate(returnPath, {
            state: {
                message: 'Bài viết đã được cập nhật thành công',
                type: 'success'
            }
        });
    };

    const handleCancel = () => {
        navigate(returnPath);
    };

    const handlePreview = () => {
        if (initialData?.slug) {
            const previewUrl = `/blog/${initialData.slug}?preview=true`;
            window.open(previewUrl, '_blank');
        } else {
            toast.warning('Bài viết chưa có slug để xem trước');
        }
    };

    const handleRetry = () => {
        window.location.reload();
    };

    // Show loading while fetching blog data
    if (fetching) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-gray-600">Đang tải thông tin bài viết...</p>
                    <p className="mt-2 text-sm text-gray-500">ID: {blogId}</p>
                </div>
            </div>
        );
    }

    // Show specific error messages
    if (fetchError && !initialData && !fetching) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-gray-800">
                                    {notFound ? 'Không tìm thấy bài viết' : 'Có lỗi xảy ra'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">{fetchError}</p>
                                <p className="mt-1 text-xs text-gray-500">Blog ID: {blogId}</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleRetry}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Thử lại
                            </button>
                            <button
                                onClick={handleCancel}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <button
                                onClick={handleCancel}
                                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa bài viết</h1>
                                {initialData && (
                                    <p className="mt-1 text-sm text-gray-600">
                                        {initialData.blogId && <>ID: {initialData.blogId} • </>}
                                        Status: 
                                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            initialData.status === 'published' ? 'bg-orange-100 text-orange-800' :
                                            initialData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            initialData.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                            initialData.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {initialData.status}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {initialData?.slug && (
                                <button
                                    onClick={handlePreview}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Xem trước
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {initialData ? (
                    <div className="bg-white shadow rounded-lg">
                        {console.log('🚀 Rendering BlogForm with initialData:', initialData)}
                        <BlogForm
                            blog={initialData}
                            isEditing={true}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={formLoading}
                            submitButtonText="Cập nhật bài viết"
                        />
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="text-center">
                            <LoadingSpinner size="medium" />
                            <p className="mt-4 text-gray-600">Đang chuẩn bị form chỉnh sửa...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
                        <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <h2 className="text-xl font-semibold mb-2 text-orange-700">Cập nhật thành công</h2>
                            <p className="mb-6 text-gray-700">Bài viết đã được cập nhật thành công!</p>
                            <button
                                onClick={handleCloseSuccessModal}
                                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Show error if any during form operations */}
            {error && initialData && (
                <div className="fixed bottom-4 right-4 max-w-sm">
                    <ErrorMessage 
                        message={error} 
                        onClose={clearLocalError}
                        autoClose={5000}
                    />
                </div>
            )}
        </div>
    );
};

export default EditBlogPage;


