// src/api/v1/services/blogComment.service.js

const blogCommentRepository = require('../repositories/blogComment.repository');
const blogRepository = require('../repositories/blog.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class BlogCommentService {
    /**
     * Tạo một bình luận mới.
     * @param {object} commentData - Dữ liệu bình luận.
     * @param {string} userId - ID của người bình luận.
     * @returns {Promise<BlogComment>}
     */
    async createComment(commentData, userId) {
        const { blog_id, parent_comment_id } = commentData;

        // --- Kiểm tra nghiệp vụ ---
        const blog = await blogRepository.findById(blog_id);
        if (!blog || blog.status !== 'published') {
            throw new AppError('Blog not found or is not published', 404);
        }
        if (parent_comment_id) {
            const parentComment = await blogCommentRepository.findById(parent_comment_id);
            if (!parentComment || parentComment.blogId !== blog_id) {
                throw new AppError('Parent comment is invalid', 400);
            }
        }

        const fullCommentData = {
            ...commentData,
            user_id: userId,
            status: 'pending', // Mặc định là chờ duyệt
        };

        const newComment = await blogCommentRepository.create(fullCommentData);
        
        // TODO: Tăng comment_count trong bảng blogs
        // await blogRepository.incrementCommentCount(blog_id);

        return newComment;
    }

    /**
     * Lấy các bình luận của một bài blog (đã được cấu trúc).
     * @param {string} blogId - ID của bài blog.
     * @returns {Promise<any[]>}
     */
    async getCommentsByBlog(blogId) {
        // Trả về toàn bộ danh sách comment (flat)
        const comments = await blogCommentRepository.findByBlogId(blogId);
        return comments;
    }

    /**
     * Xóa một bình luận.
     * @param {string} commentId - ID của bình luận.
     * @param {object} currentUser - Thông tin người dùng hiện tại.
     * @returns {Promise<void>}
     */
    async deleteComment(commentId, currentUser) {
        const comment = await blogCommentRepository.findById(commentId);
        if (!comment) throw new AppError('Comment not found', 404);

        if (comment.userId !== currentUser.id && currentUser.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to delete this comment', 403);
        }

        await blogCommentRepository.deleteById(commentId);
        // TODO: Giảm comment_count trong bảng blogs
        // await blogRepository.decrementCommentCount(comment.blogId);
    }
}

module.exports = new BlogCommentService();