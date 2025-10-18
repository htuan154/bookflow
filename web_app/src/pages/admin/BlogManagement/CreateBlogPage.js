// src/pages/admin/BlogManagement/CreateBlogPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Loader, Eye, FileText, Image, Tag, Link2 } from 'lucide-react';
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
        status: 'draft'
    });

    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        console.log('🔍 CreateBlogPage - User Debug Info:');
        console.log('  - isAuthenticated:', isAuthenticated);
        console.log('  - user object:', user);
        console.log('  - user keys:', user ? Object.keys(user) : 'null');

        if (!isAuthenticated) {
            console.warn('⚠️ User not authenticated, redirecting to login');
            navigate('/login');
        }
    }, [user, isAuthenticated, navigate]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                clearError();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, clearError]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'title' && !prev.slug ? { slug: generateSlug(value) } : {})
        }));
    };

    const generateSlug = (title) => {
        if (!title) return '';
        
        let baseSlug = title
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        if (baseSlug.length > 400) {
            baseSlug = baseSlug.substring(0, 400);
        }
        
        const timestamp = Date.now();
        const finalSlug = `${baseSlug}-${timestamp}`;
        
        return finalSlug;
    };

    const validateForm = () => {
        const errors = {};

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

        const slug = formData.slug || generateSlug(formData.title);
        if (!slug) {
            errors.slug = 'Đường dẫn không hợp lệ';
        } else if (slug.length < 3) {
            errors.slug = 'Đường dẫn phải có ít nhất 3 ký tự';
        }

        if (formData.featured_image_url && !isValidUrl(formData.featured_image_url)) {
            errors.featured_image_url = 'URL ảnh không hợp lệ';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
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

        if (!isAuthenticated || !user) {
            alert('Vui lòng đăng nhập để tạo bài viết!');
            navigate('/login');
            return;
        }

        const author_id = user?.user_id || user?.userId || user?.id || user?.User_Id || user?.ID;
        
        console.log('  - Final author_id:', author_id);
        
        if (!author_id) {
            alert('Không xác định được tác giả. Vui lòng đăng nhập lại!');
            console.log('❌ No author_id found in user object');
            navigate('/login');
            return;
        }

        if (!validateForm()) {
            alert('Vui lòng kiểm tra lại thông tin đã nhập!');
            return;
        }

        const finalSlug = formData.slug.trim() || generateSlug(formData.title);

        const blogData = {
            author_id: author_id,
            title: formData.title.trim().substring(0, 500),
            slug: finalSlug.substring(0, 500),
            content: formData.content.trim(),
            status: formData.status || 'draft'
        };

        if (formData.excerpt && formData.excerpt.trim()) {
            blogData.excerpt = formData.excerpt.trim().substring(0, 1000);
        }
        
        if (formData.featured_image_url && formData.featured_image_url.trim()) {
            blogData.featured_image_url = formData.featured_image_url.trim();
        }
        
        if (formData.meta_description && formData.meta_description.trim()) {
            blogData.meta_description = formData.meta_description.trim().substring(0, 500);
        }
        
        if (formData.tags && formData.tags.trim()) {
            blogData.tags = formData.tags.trim();
        }

        console.log('📤 Blog data for database:', blogData);

        try {
            setIsSubmitting(true);
            const submitData = { ...formData, status: 'draft' };
            const result = await createBlog(submitData);
            
            console.log('✅ Create blog response:', result);
            console.log('✅ Response type:', typeof result);
            
            if (result && (result.success || result.data || result.blog_id)) {
                console.log('✅ Blog created successfully:', result);
                setShowSuccessModal(true);
            } else {
                console.warn('⚠️ Unexpected response format:', result);
                setShowSuccessModal(true);
            }
            
        } catch (error) {
            console.error('❌ Error creating blog:', error);
            console.error('❌ Error message:', error?.message);
            console.error('❌ Error stack:', error?.stack);
            
            if (error?.message?.includes('Blog created successfully') || 
                error?.message?.includes('successfully') ||
                error?.message?.includes('created')) {
                
                console.log('🎯 Detected success message in error - treating as success');
                alert('Tạo bài viết thành công!');
                navigate('/admin/blog-management');
                return;
            }
            
            if (error?.message?.includes('duplicate') || 
                error?.message?.includes('unique') ||
                error?.message?.includes('slug') ||
                error?.message?.includes('409')) {
                
                console.log('🔄 Slug conflict detected, generating new slug...');
                
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

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        navigate('/admin/blog-management');
    };

    const handleGoBack = () => {
        if (formData.title || formData.content) {
            if (window.confirm('Bạn có chắc muốn rời khỏi? Dữ liệu chưa lưu sẽ bị mất.')) {
                navigate('/admin/blog-management');
            }
        } else {
            navigate('/admin/blog-management');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleGoBack}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="font-medium">Quay lại</span>
                        </button>
                        <div className="h-8 w-px bg-gray-300"></div>
                        <h1 className="text-2xl font-semibold text-gray-900">Tạo bài viết mới</h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Eye className="h-4 w-4" />
                            <span>{showPreview ? 'Chỉnh sửa' : 'Xem trước'}</span>
                        </button>
                        
                        <button
                            form="blog-form"
                            type="submit"
                            disabled={loading || isSubmitting}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {(loading || isSubmitting) ? (
                                <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            <span>{(loading || isSubmitting) ? 'Đang lưu...' : 'Lưu bài viết'}</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-900">Có lỗi xảy ra</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={clearError}
                                className="text-red-400 hover:text-red-600"
                            >
                                <span className="text-xl leading-none">×</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {showPreview ? (
                        <div className="p-8">
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Xem trước bài viết</h2>
                            </div>
                            <article className="prose prose-lg max-w-none">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                    {formData.title || 'Tiêu đề bài viết'}
                                </h1>
                                {formData.featured_image_url && (
                                    <img 
                                        src={formData.featured_image_url} 
                                        alt="Featured" 
                                        className="w-full h-80 object-cover rounded-lg mb-6"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                {formData.excerpt && (
                                    <p className="text-lg text-gray-600 italic mb-6 pb-6 border-l-4 border-blue-500 pl-4">
                                        {formData.excerpt}
                                    </p>
                                )}
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {formData.content || 'Nội dung bài viết sẽ hiển thị ở đây...'}
                                </div>
                            </article>
                        </div>
                    ) : (
                        <form id="blog-form" onSubmit={handleSubmit} className="p-8">
                            <div className="space-y-6">
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
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                                                formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Nhập tiêu đề bài viết"
                                        />
                                        {formErrors.title && (
                                            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                {formErrors.title}
                                            </p>
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
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                                                formErrors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="duong-dan-url"
                                        />
                                        {formErrors.slug && (
                                            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                {formErrors.slug}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tóm tắt
                                    </label>
                                    <textarea
                                        name="excerpt"
                                        value={formData.excerpt}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                        placeholder="Viết tóm tắt ngắn gọn..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nội dung *
                                    </label>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        required
                                        rows={16}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none ${
                                            formErrors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Viết nội dung chi tiết..."
                                    />
                                    {formErrors.content && (
                                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {formErrors.content}
                                        </p>
                                    )}
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>{formData.content.length} ký tự</span>
                                        <span className={formData.content.length >= 100 ? 'text-green-600' : 'text-amber-600'}>
                                            {formData.content.length >= 100 ? 'Đủ nội dung ✓' : 'Nên viết ít nhất 100 ký tự'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ảnh đại diện (URL)
                                    </label>
                                    <input
                                        type="url"
                                        name="featured_image_url"
                                        value={formData.featured_image_url}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                                            formErrors.featured_image_url ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {formErrors.featured_image_url && (
                                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {formErrors.featured_image_url}
                                        </p>
                                    )}
                                </div>

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
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            placeholder="du lịch, khách sạn, resort"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meta Description
                                        </label>
                                        <input
                                            type="text"
                                            name="meta_description"
                                            value={formData.meta_description}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Mô tả cho SEO"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                    >
                                        <option value="draft">Nháp</option>
                                        <option value="pending">Chờ duyệt</option>
                                        <option value="published">Xuất bản</option>
                                        <option value="archived">Lưu trữ</option>
                                    </select>
                                </div>

                                {formData.featured_image_url && isValidUrl(formData.featured_image_url) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Xem trước ảnh
                                        </label>
                                        <img
                                            src={formData.featured_image_url}
                                            alt="Preview"
                                            className="w-full h-64 object-cover rounded-lg border border-gray-200"
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
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Tạo bài viết thành công!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Bài viết của bạn đã được lưu vào hệ thống.
                            </p>
                            <button
                                onClick={handleCloseSuccessModal}
                                className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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