// src/pages/admin/BlogManagement/CreateBlogPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import useAuth from '../../../hooks/useAuth';

const CreateBlogPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { createBlog, loading, error, clearError } = useBlogContext();

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

    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Debug user object khi component mount
    useEffect(() => {
        console.log('🔍 CreateBlogPage - User Debug Info:');
        console.log('  - isAuthenticated:', isAuthenticated);
        console.log('  - user object:', user);
        console.log('  - user keys:', user ? Object.keys(user) : 'null');

        // Redirect nếu chưa đăng nhập
        if (!isAuthenticated) {
            console.warn('⚠️ User not authenticated, redirecting to login');
            navigate('/login');
        }
    }, [user, isAuthenticated, navigate]);

    // Clear errors when form changes
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                clearError();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, clearError]);

    /**
     * Handle input changes
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Clear specific field error
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Auto-generate slug from title
            ...(name === 'title' && !prev.slug ? { slug: generateSlug(value) } : {})
        }));
    };

    /**
     * Generate URL-friendly slug
     */
    const generateSlug = (title) => {
        if (!title) return '';
        
        let baseSlug = title
            .toLowerCase()
            .trim()
            // Xử lý tiếng Việt
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            // Chỉ giữ lại chữ cái, số và dấu gạch ngang
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        // Giới hạn độ dài slug theo database (500 ký tự)
        if (baseSlug.length > 400) {
            baseSlug = baseSlug.substring(0, 400);
        }
        
        // Thêm timestamp để tránh trùng slug (UNIQUE constraint)
        const timestamp = Date.now();
        const finalSlug = `${baseSlug}-${timestamp}`;
        
        return finalSlug;
    };

    /**
     * Validate form data
     */
    const validateForm = () => {
        const errors = {};

        // Required fields
        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề là bắt buộc';
        } else if (formData.title.trim().length < 5) {
            errors.title = 'Tiêu đề phải có ít nhất 5 ký tự';
        }

        if (!formData.content.trim()) {
            errors.content = 'Nội dung là bắt buộc';
        } else if (formData.content.trim().length < 50) {
            errors.content = 'Nội dung phải có ít nhất 50 ký tự';
        }

        // Slug validation
        const slug = formData.slug || generateSlug(formData.title);
        if (!slug) {
            errors.slug = 'Đường dẫn không hợp lệ';
        } else if (slug.length < 3) {
            errors.slug = 'Đường dẫn phải có ít nhất 3 ký tự';
        }

        // URL validation for featured image
        if (formData.featured_image_url && !isValidUrl(formData.featured_image_url)) {
            errors.featured_image_url = 'URL ảnh không hợp lệ';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Check if URL is valid
     */
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Debug chi tiết user object
        console.log('🔍 SUBMIT DEBUG:');
        console.log('  - isAuthenticated:', isAuthenticated);
        console.log('  - user:', user);
        console.log('  - user type:', typeof user);
        console.log('  - user keys:', user ? Object.keys(user) : 'null');
        
        if (user) {
            console.log('  - user.id:', user.id);
            console.log('  - user.userId:', user.userId);
            console.log('  - user.user_id:', user.user_id);
            console.log('  - user.User_Id:', user.User_Id);
        }

        // Kiểm tra authentication
        if (!isAuthenticated || !user) {
            alert('Vui lòng đăng nhập để tạo bài viết!');
            navigate('/login');
            return;
        }

        // Thử nhiều cách lấy author_id
        const author_id = user?.user_id || user?.userId || user?.id || user?.User_Id || user?.ID;
        
        console.log('  - Final author_id:', author_id);
        
        if (!author_id) {
            alert('Không xác định được tác giả. Vui lòng đăng nhập lại!');
            console.log('❌ No author_id found in user object');
            navigate('/login');
            return;
        }

        // Validation
        if (!validateForm()) {
            alert('Vui lòng kiểm tra lại thông tin đã nhập!');
            return;
        }

        // Tạo slug unique để tránh conflict
        const finalSlug = formData.slug.trim() || generateSlug(formData.title);

        // Chuẩn bị dữ liệu theo đúng schema database
        const blogData = {
            // Các trường bắt buộc
            author_id: author_id,
            title: formData.title.trim().substring(0, 500), // Giới hạn 500 ký tự
            slug: finalSlug.substring(0, 500), // Giới hạn 500 ký tự
            content: formData.content.trim(),
            status: formData.status || 'draft'
        };

        // Các trường optional - chỉ thêm nếu có giá trị
        if (formData.excerpt && formData.excerpt.trim()) {
            blogData.excerpt = formData.excerpt.trim().substring(0, 1000); // Giới hạn 1000 ký tự
        }
        
        if (formData.featured_image_url && formData.featured_image_url.trim()) {
            blogData.featured_image_url = formData.featured_image_url.trim();
        }
        
        if (formData.meta_description && formData.meta_description.trim()) {
            blogData.meta_description = formData.meta_description.trim().substring(0, 500); // Giới hạn 500 ký tự
        }
        
        if (formData.tags && formData.tags.trim()) {
            blogData.tags = formData.tags.trim();
        }
        
        // Hotel ID - chỉ thêm nếu có và là UUID hợp lệ
        if (formData.hotel_id && formData.hotel_id.trim()) {
            const hotelId = formData.hotel_id.trim();
            // Kiểm tra format UUID đơn giản
            if (hotelId.length === 36 && hotelId.includes('-')) {
                blogData.hotel_id = hotelId;
            }
        }

        console.log('📤 Blog data for database:', blogData);

        try {
            setIsSubmitting(true);
            const result = await createBlog(blogData);
            
            // Log chi tiết response
            console.log('✅ Create blog response:', result);
            console.log('✅ Response type:', typeof result);
            
            // Kiểm tra response có thành công không
            if (result && (result.success || result.data || result.blog_id)) {
                console.log('✅ Blog created successfully:', result);
                setShowSuccessModal(true);
                // Không chuyển trang ngay, chờ người dùng đóng modal
            } else {
                console.warn('⚠️ Unexpected response format:', result);
                setShowSuccessModal(true);
            }
            
        } catch (error) {
            console.error('❌ Error creating blog:', error);
            console.error('❌ Error message:', error?.message);
            console.error('❌ Error stack:', error?.stack);
            
            // Kiểm tra xem có phải "fake error" không
            if (error?.message?.includes('Blog created successfully') || 
                error?.message?.includes('successfully') ||
                error?.message?.includes('created')) {
                
                console.log('🎯 Detected success message in error - treating as success');
                alert('Tạo bài viết thành công!');
                navigate('/admin/blog-management');
                return;
            }
            
            // Xử lý lỗi thật sự
            if (error?.message?.includes('duplicate') || 
                error?.message?.includes('unique') ||
                error?.message?.includes('slug') ||
                error?.message?.includes('409')) {
                
                console.log('🔄 Slug conflict detected, generating new slug...');
                
                // Tạo slug mới với timestamp khác
                const newTimestamp = Date.now() + Math.floor(Math.random() * 1000);
                const newSlug = `${formData.title.toLowerCase().replace(/\s+/g, '-')}-${newTimestamp}`;
                
                const retryBlogData = {
                    ...blogData,
                    slug: newSlug.substring(0, 500)
                };
                
                console.log('🔄 Retrying with new slug:', retryBlogData.slug);
                
                try {
                    const retryResult = await createBlog(retryBlogData);
                    console.log('✅ Blog created successfully on retry:', retryResult);
                    alert('Tạo bài viết thành công!');
                    navigate('/admin/blog-management');
                } catch (retryError) {
                    console.error('❌ Retry failed:', retryError);
                    
                    // Kiểm tra retry cũng có "fake error" không
                    if (retryError?.message?.includes('successfully')) {
                        alert('Tạo bài viết thành công!');
                        navigate('/admin/blog-management');
                    } else {
                        alert('Không thể tạo bài viết. Vui lòng thử với tiêu đề khác!');
                    }
                }
            } else if (error?.message?.includes('author_id')) {
                alert('Lỗi xác thực tác giả. Vui lòng đăng nhập lại!');
                navigate('/login');
            } else if (error?.message?.includes('foreign key')) {
                alert('ID khách sạn không hợp lệ. Vui lòng kiểm tra lại!');
            } else if (error?.message?.includes('400')) {
                alert('Dữ liệu không hợp lệ. Kiểm tra độ dài các trường!');
            } else if (error?.message?.includes('401')) {
                alert('Phiên đăng nhập hết hạn. Đăng nhập lại!');
                navigate('/login');
            } else if (error?.message?.includes('403')) {
                alert('Không có quyền tạo bài viết!');
            } else {
                alert(`Lỗi: ${error?.message || 'Vui lòng thử lại!'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Đóng modal và chuyển về trang danh sách
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        navigate('/admin/blog-management');
    };

    /**
     * Handle navigation back
     */
    const handleGoBack = () => {
        if (formData.title || formData.content) {
            if (window.confirm('Bạn có chắc muốn rời khỏi? Dữ liệu chưa lưu sẽ bị mất.')) {
                navigate('/admin/blog-management');
            }
        } else {
            navigate('/admin/blog-management');
        }
    };

    // Loading state for authentication
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Đang kiểm tra đăng nhập...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Quay lại</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Tạo bài viết mới
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Tạo bài viết du lịch hoặc đánh giá khách sạn
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {showPreview ? 'Chỉnh sửa' : 'Xem trước'}
                    </button>
                    
                    <button
                        form="blog-form"
                        type="submit"
                        disabled={loading || isSubmitting}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {(loading || isSubmitting) ? (
                            <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        <span>
                            {(loading || isSubmitting) ? 'Đang lưu...' : 'Lưu bài viết'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">
                                Có lỗi xảy ra
                            </h3>
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

            {/* Form or Preview */}
            <div className="bg-white rounded-lg shadow-sm border">
                {showPreview ? (
                    // Preview Mode
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">Xem trước bài viết</h2>
                        <div className="prose max-w-none">
                            <h1>{formData.title || 'Tiêu đề bài viết'}</h1>
                            {formData.featured_image_url && (
                                <img 
                                    src={formData.featured_image_url} 
                                    alt="Featured" 
                                    className="w-full h-64 object-cover rounded-lg"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            )}
                            {formData.excerpt && (
                                <p className="text-lg text-gray-600 italic">
                                    {formData.excerpt}
                                </p>
                            )}
                            <div className="whitespace-pre-wrap">
                                {formData.content || 'Nội dung bài viết sẽ hiển thị ở đây...'}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Form Mode
                    <form id="blog-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Title and Slug */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tiêu đề *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        formErrors.title ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập tiêu đề bài viết"
                                />
                                {formErrors.title && (
                                    <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Đường dẫn (Slug) *
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        formErrors.slug ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="duong-dan-url"
                                />
                                {formErrors.slug && (
                                    <p className="text-red-600 text-sm mt-1">{formErrors.slug}</p>
                                )}
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tóm tắt
                            </label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Mô tả ngắn gọn về bài viết (tùy chọn)"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nội dung *
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                required
                                rows={12}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    formErrors.content ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Viết nội dung chi tiết bài viết..."
                            />
                            {formErrors.content && (
                                <p className="text-red-600 text-sm mt-1">{formErrors.content}</p>
                            )}
                            <p className="text-gray-500 text-sm mt-1">
                                Hiện tại: {formData.content.length} ký tự
                            </p>
                        </div>

                        {/* Featured Image and Hotel ID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ảnh đại diện (URL)
                                </label>
                                <input
                                    type="url"
                                    name="featured_image_url"
                                    value={formData.featured_image_url}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        formErrors.featured_image_url ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="https://example.com/image.jpg"
                                />
                                {formErrors.featured_image_url && (
                                    <p className="text-red-600 text-sm mt-1">{formErrors.featured_image_url}</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ID Khách sạn (tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    name="hotel_id"
                                    value={formData.hotel_id}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="UUID của khách sạn"
                                />
                            </div>
                        </div>

                        {/* Tags and Meta Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="du lịch, khách sạn, resort (phân cách bằng dấu phẩy)"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meta Description (SEO)
                                </label>
                                <input
                                    type="text"
                                    name="meta_description"
                                    value={formData.meta_description}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Mô tả cho công cụ tìm kiếm (150-160 ký tự)"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="draft">Nháp</option>
                                <option value="pending">Chờ duyệt</option>
                                <option value="published">Xuất bản</option>
                                <option value="archived">Lưu trữ</option>
                            </select>
                        </div>

                        {/* Image Preview */}
                        {formData.featured_image_url && isValidUrl(formData.featured_image_url) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Xem trước ảnh
                                </label>
                                <div className="relative">
                                    <img
                                        src={formData.featured_image_url}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-lg"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            setFormErrors(prev => ({
                                                ...prev,
                                                featured_image_url: 'Không thể tải ảnh từ URL này'
                                            }));
                                        }}
                                        onLoad={() => {
                                            setFormErrors(prev => ({
                                                ...prev,
                                                featured_image_url: null
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </form>
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
                            <h2 className="text-xl font-semibold mb-2 text-orange-700">Tạo bài viết thành công</h2>
                            <p className="mb-6 text-gray-700">Bài viết của bạn đã được tạo thành công!</p>
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
        </div>
    );
};

export default CreateBlogPage;