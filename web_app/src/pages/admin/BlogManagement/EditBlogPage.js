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
        clearCurrentBlog,
        clearLocalError
    } = useBlog();

    const [formLoading, setFormLoading] = useState(false);
    const [initialData, setInitialData] = useState(null);

    // Get return path from location state or default to blog list
    const returnPath = location.state?.from || '/admin/blog-management';

    useEffect(() => {
        if (blogId) {
            loadBlogData();
        }

        // Cleanup when component unmounts
        return () => {
            clearCurrentBlog();
            clearLocalError();
        };
    }, [blogId, clearCurrentBlog, clearLocalError]);

    useEffect(() => {
        if (currentBlog && !initialData) {
            // Format blog data for the form
            const formattedData = {
                title: currentBlog.title || '',
                content: currentBlog.content || '',
                excerpt: currentBlog.excerpt || '',
                slug: currentBlog.slug || '',
                status: currentBlog.status || 'draft',
                hotelId: currentBlog.hotelId || '',
                tags: currentBlog.tags || [],
                metaTitle: currentBlog.metaTitle || '',
                metaDescription: currentBlog.metaDescription || '',
                featuredImage: currentBlog.featuredImage || null,
                images: currentBlog.images || [],
                publishedAt: currentBlog.publishedAt || null,
                scheduledPublishAt: currentBlog.scheduledPublishAt || null,
            };
            setInitialData(formattedData);
        }
    }, [currentBlog, initialData]);

    const loadBlogData = async () => {
        try {
            await getBlogById(blogId);
        } catch (error) {
            console.error('Failed to load blog:', error);
            toast.error('Không thể tải thông tin bài viết');
            // Redirect back if blog not found
            if (error.message.includes('404') || error.message.includes('Not found')) {
                navigate(returnPath, { replace: true });
            }
        }
    };

    const handleSubmit = async (formData) => {
        try {
            setFormLoading(true);
            clearLocalError();

            // Update blog
            const updatedBlog = await updateBlog(blogId, formData);

            toast.success('Cập nhật bài viết thành công!');

            // Navigate back with success message
            navigate(returnPath, {
                state: {
                    message: 'Bài viết đã được cập nhật thành công',
                    type: 'success',
                    updatedBlog: updatedBlog
                }
            });

        } catch (error) {
            console.error('Failed to update blog:', error);
            let errorMessage = 'Có lỗi xảy ra khi cập nhật bài viết';
            
            if (error.message.includes('slug')) {
                errorMessage = 'Slug này đã được sử dụng, vui lòng chọn slug khác';
            } else if (error.message.includes('title')) {
                errorMessage = 'Tiêu đề này đã tồn tại, vui lòng chọn tiêu đề khác';
            } else if (error.message.includes('validation')) {
                errorMessage = 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại';
            } else if (error.message.includes('permission')) {
                errorMessage = 'Bạn không có quyền chỉnh sửa bài viết này';
            }

            toast.error(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(returnPath);
    };

    const handlePreview = () => {
        if (currentBlog?.slug) {
            // Open preview in new tab
            const previewUrl = `/blog/${currentBlog.slug}?preview=true`;
            window.open(previewUrl, '_blank');
        } else {
            toast.warning('Bài viết chưa có slug để xem trước');
        }
    };

    // Show loading while fetching blog data
    if (loading && !currentBlog) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-gray-600">Đang tải thông tin bài viết...</p>
                </div>
            </div>
        );
    }

    // Show error if failed to load
    if (error && !currentBlog) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full">
                    <ErrorMessage 
                        message={error} 
                        onRetry={() => loadBlogData()}
                        showRetry={true}
                    />
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show message if blog not found
    if (!currentBlog && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy bài viết</h3>
                    <p className="mt-1 text-sm text-gray-500">Bài viết này có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
                    <div className="mt-6">
                        <button
                            onClick={handleCancel}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Quay lại danh sách
                        </button>
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
                                {currentBlog && (
                                    <p className="mt-1 text-sm text-gray-600">
                                        ID: {currentBlog.blogId} • Status: 
                                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            currentBlog.status === 'published' ? 'bg-green-100 text-green-800' :
                                            currentBlog.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            currentBlog.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                            currentBlog.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {currentBlog.status}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {currentBlog?.slug && (
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
                        <BlogForm
                            initialData={initialData}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            loading={formLoading}
                            mode="edit"
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

            {/* Show error if any during form operations */}
            {error && currentBlog && (
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