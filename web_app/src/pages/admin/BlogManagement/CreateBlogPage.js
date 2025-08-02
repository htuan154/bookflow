// src/pages/admin/BlogManagement/CreateBlogPage.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import BlogForm from '../../../components/blog/BlogForm';

const CreateBlogPage = () => {
    const navigate = useNavigate();
    const { createBlog } = useBlogContext();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (blogData) => {
        try {
            setIsSubmitting(true);
            
            // Navigate to blog list or view the created blog
            navigate('/admin/blogs', { 
                state: { message: 'Bài viết đã được tạo thành công!' }
            });
        } catch (error) {
            console.error('Failed to create blog:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/blogs');
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                    <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Quay lại</span>
                    </button>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900">
                    Tạo bài viết mới
                </h1>
                <p className="text-gray-600 mt-1">
                    Tạo bài viết du lịch mới cho website
                </p>
            </div>

            {/* Blog Form */}
            <BlogForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isEditing={false}
                submitButtonText="Tạo bài viết"
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default CreateBlogPage;