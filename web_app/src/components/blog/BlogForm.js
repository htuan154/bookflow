// src/components/admin/blog/BlogForm.js
import React, { useState, useEffect } from 'react';
import { useBlogContext } from '../../context/BlogContext';
import useAuth from '../../hooks/useAuth';

const BlogForm = ({ 
    blog = null,
    initialData = null,
    onSubmit, 
    onCancel, 
    isEditing = false,
    submitButtonText = 'Tạo bài viết',
    isSubmitting = false 
}) => {
    const { user } = useAuth();
    const { createBlog, updateBlog, error, loading } = useBlogContext();

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featuredImageUrl: '',
        metaDescription: '',
        tags: '',
        status: 'draft',
        hotelId: '',
    });

    const [formErrors, setFormErrors] = useState({});
    const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

    // ✅ CẬP NHẬT: Initialize form data with correct Blog model mapping
    useEffect(() => {
        const blogData = blog || initialData;
        
        if (isEditing && blogData) {
            console.log('🔍 BlogForm received data:', blogData);
            console.log('🔍 Available fields:', Object.keys(blogData));
            
            const newFormData = {
                title: blogData.title || '',
                slug: blogData.slug || '',
                content: blogData.content || '',
                excerpt: blogData.excerpt || '',
                // ✅ ĐÚNG FIELD NAME từ toJSON() method
                featuredImageUrl: blogData.featuredImageUrl || '',
                metaDescription: blogData.metaDescription || '',
                // ✅ XỬ LÝ TAGS từ toJSON()
                tags: (() => {
                    if (Array.isArray(blogData.tags)) {
                        return blogData.tags.join(', ');
                    } else if (typeof blogData.tags === 'string') {
                        try {
                            const parsed = JSON.parse(blogData.tags);
                            if (Array.isArray(parsed)) {
                                return parsed.join(', ');
                            }
                            return blogData.tags;
                        } catch {
                            return blogData.tags;
                        }
                    } else {
                        return '';
                    }
                })(),
                status: blogData.status || 'draft',
                hotelId: blogData.hotelId || '',
            };
            
            console.log('✅ Final form data to set:', newFormData);
            console.log('✅ Form featuredImageUrl:', newFormData.featuredImageUrl);
            console.log('✅ Form metaDescription:', newFormData.metaDescription);
            console.log('✅ Form tags:', newFormData.tags);
            
            setFormData(newFormData);
        } else if (!isEditing) {
            // Reset form cho trường hợp tạo mới
            console.log('🆕 Resetting form for new blog creation');
            setFormData({
                title: '',
                slug: '',
                content: '',
                excerpt: '',
                featuredImageUrl: '',
                metaDescription: '',
                tags: '',
                status: 'draft',
                hotelId: '',
            });
        }
    }, [isEditing, blog, initialData]);

    // Auto-generate slug from title
    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
            .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
            .replace(/[ìíịỉĩ]/g, 'i')
            .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
            .replace(/[ùúụủũưừứựửữ]/g, 'u')
            .replace(/[ỳýỵỷỹ]/g, 'y')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-generate slug when title changes (only for new blogs)
        if (name === 'title' && !isEditing) {
            setIsGeneratingSlug(true);
            const newSlug = generateSlug(value);
            setFormData(prev => ({
                ...prev,
                slug: newSlug
            }));
            setTimeout(() => setIsGeneratingSlug(false), 300);
        }

        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề là bắt buộc';
        }

        if (!formData.slug.trim()) {
            errors.slug = 'Slug là bắt buộc';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            errors.slug = 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang';
        }

        if (!formData.content.trim()) {
            errors.content = 'Nội dung là bắt buộc';
        }

        if (!formData.excerpt.trim()) {
            errors.excerpt = 'Tóm tắt là bắt buộc';
        }

        if (formData.metaDescription && formData.metaDescription.length > 160) {
            errors.metaDescription = 'Meta description không được quá 160 ký tự';
        }

        if (formData.excerpt.length > 500) {
            errors.excerpt = 'Tóm tắt không được quá 500 ký tự';
        }

        return errors;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const blogData = {
                ...formData,
                // ✅ MAPPING field names cho backend (snake_case)
                author_id: user?.userId || user?.id,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                hotel_id: formData.hotelId || null,
                featured_image_url: formData.featuredImageUrl || null,
                meta_description: formData.metaDescription || null,
            };

            console.log('📤 Submitting blog data:', blogData);

            if (onSubmit) {
                await onSubmit(blogData);
            }
        } catch (error) {
            console.error('Error submitting blog:', error);
        }
    };

    // Handle manual slug generation
    const handleGenerateSlug = () => {
        if (formData.title) {
            const newSlug = generateSlug(formData.title);
            setFormData(prev => ({
                ...prev,
                slug: newSlug
            }));
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h2>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Có lỗi xảy ra
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    {error}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.title ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Nhập tiêu đề bài viết..."
                        />
                        {formErrors.title && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                        )}
                    </div>

                    {/* Slug */}
                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                            Slug <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                id="slug"
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                className={`flex-1 px-3 py-2 border rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    formErrors.slug ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="url-cua-bai-viet"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateSlug}
                                disabled={!formData.title || isGeneratingSlug}
                                className="px-4 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingSlug ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Tạo'
                                )}
                            </button>
                        </div>
                        {formErrors.slug && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.slug}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            URL của bài viết. Chỉ sử dụng chữ thường, số và dấu gạch ngang.
                        </p>
                    </div>

                    {/* Content */}
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                            Nội dung <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            rows={12}
                            value={formData.content}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.content ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Nhập nội dung bài viết..."
                        />
                        {formErrors.content && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            {formData.content.length} ký tự
                        </p>
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                            Tóm tắt <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="excerpt"
                            name="excerpt"
                            rows={3}
                            value={formData.excerpt}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.excerpt ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Nhập tóm tắt ngắn gọn về bài viết..."
                            maxLength={500}
                        />
                        {formErrors.excerpt && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.excerpt}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            {formData.excerpt.length}/500 ký tự
                        </p>
                    </div>

                    {/* Featured Image URL */}
                    <div>
                        <label htmlFor="featuredImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                            URL ảnh đại diện
                        </label>
                        <input
                            type="url"
                            id="featuredImageUrl"
                            name="featuredImageUrl"
                            value={formData.featuredImageUrl}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/image.jpg"
                        />
                        {formData.featuredImageUrl && (
                            <div className="mt-2">
                                <img
                                    src={formData.featuredImageUrl}
                                    alt="Preview"
                                    className="w-32 h-20 object-cover rounded border"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Meta Description */}
                    <div>
                        <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
                            Meta Description
                        </label>
                        <textarea
                            id="metaDescription"
                            name="metaDescription"
                            rows={2}
                            value={formData.metaDescription}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.metaDescription ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Mô tả ngắn gọn cho SEO..."
                            maxLength={160}
                        />
                        {formErrors.metaDescription && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.metaDescription}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            {formData.metaDescription.length}/160 ký tự
                        </p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                            Tags
                        </label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="du lịch, khách sạn, nghỉ dưỡng"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Nhập các tag cách nhau bằng dấu phẩy
                        </p>
                    </div>

                    {/* Hotel ID */}
                    <div>
                        <label htmlFor="hotelId" className="block text-sm font-medium text-gray-700 mb-2">
                            ID Khách sạn liên quan
                        </label>
                        <input
                            type="text"
                            id="hotelId"
                            name="hotelId"
                            value={formData.hotelId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập ID khách sạn (tùy chọn)"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            ID của khách sạn mà bài viết này liên quan đến (nếu có)
                        </p>
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="draft">Bản nháp</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="published">Đã xuất bản</option>
                            <option value="rejected">Bị từ chối</option>
                        </select>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {(loading || isSubmitting) ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </div>
                            ) : (
                                submitButtonText
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlogForm;