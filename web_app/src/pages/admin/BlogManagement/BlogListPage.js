// src/pages/admin/BlogManagement/BlogListPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import useAuth from '../../../hooks/useAuth';
import BlogList from '../../../components/blog/BlogList';


const BlogListPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { fetchBlogs, updateBlogStatus, deleteBlog } = useBlogContext();

    const [actionLoading, setActionLoading] = useState(null);

    // Load blogs on mount
    useEffect(() => {
        fetchBlogs({ adminView: true });
    }, [fetchBlogs]);

    // Handle blog actions
    const handleCreateBlog = () => {
        navigate('/admin/blogs/create');
    };

    const handleEditBlog = (blog) => {
        navigate(`/admin/blogs/${blog.blogId}/edit`);
    };

    const handleViewBlog = (blog) => {
        navigate(`/admin/blogs/${blog.blogId}`);
    };

    const handleStatusChange = async (blogId, newStatus) => {
        try {
            setActionLoading(`status-${blogId}`);
            await updateBlogStatus(blogId, newStatus);
        } catch (error) {
            console.error('Failed to update blog status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteBlog = async (blog) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${blog.title}"?`)) {
            try {
                setActionLoading(`delete-${blog.blogId}`);
                await deleteBlog(blog.blogId);
            } catch (error) {
                console.error('Failed to delete blog:', error);
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

            {/* Blog List */}
            <BlogList
                showActions={true}
                adminView={true}
                onBlogSelect={(action, blog) => {
                    if (action === 'create') handleCreateBlog();
                    else if (action === 'edit') handleEditBlog(blog);
                    else if (action === 'view') handleViewBlog(blog);
                }}
                onEdit={handleEditBlog}
                onDelete={handleDeleteBlog}
                onStatusChange={handleStatusChange}
                isAdmin={user?.role === 'admin'}
                loading={actionLoading !== null}
            />
        </div>
    );
};

export default BlogListPage;