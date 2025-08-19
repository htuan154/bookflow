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
    // Thêm 
    /**
 * Admin hoặc chủ khách sạn trả lời bình luận.
 * @param {string} blogId - ID của bài blog.
 * @param {string} parentCommentId - ID bình luận gốc.
 * @param {string} content - Nội dung trả lời.
 * @param {object} currentUser - Thông tin người dùng hiện tại (admin hoặc chủ khách sạn).
 * @returns {Promise<BlogComment>}
 */
    async replyToComment(blogId, parentCommentId, content, currentUser) {
        // --- Kiểm tra quyền ---
        if (!['admin', 'hotel_owner'].includes(currentUser.role)) {
            throw new AppError('Forbidden: Only admin or hotel owner can reply to comments', 403);
        }

        // --- Kiểm tra blog ---
        const blog = await blogRepository.findById(blogId);
        if (!blog || blog.status !== 'published') {
            throw new AppError('Blog not found or is not published', 404);
        }

        // --- Kiểm tra bình luận gốc ---
        const parentComment = await blogCommentRepository.findById(parentCommentId);
        if (!parentComment || parentComment.blogId !== blogId) {
            throw new AppError('Parent comment is invalid', 400);
        }

        // --- Tạo dữ liệu trả lời ---
        const replyData = {
            blog_id: blogId,
            user_id: currentUser.id,
            parent_comment_id: parentCommentId,
            content,
            status: 'approved', // Admin/chủ KS trả lời thì duyệt ngay
        };

        // --- Gọi repository ---
        const replyComment = await blogCommentRepository.replyToComment(replyData);

        // TODO: Tăng comment_count trong bảng blogs nếu cần
        // await blogRepository.incrementCommentCount(blogId);

        return replyComment;
    }
    

    /**
 * Lấy tất cả bình luận của một blog, kèm tên người bình luận và ngày tạo
 * @param {string} blogId - ID của bài blog
 * @returns {Promise<any[]>}
 */
    async getCommentsWithUser(blogId) {
        // Gọi repository mới tạo
        const comments = await blogCommentRepository.findCommentsWithUserByBlogId(blogId);

        return comments;
    }
 //them 16/8
    /**
     * Admin cập nhật trạng thái comment
     * @param {string} commentId - ID comment cần update
     * @param {string} status - pending | approved | rejected | hidden
     * @param {object} currentUser - thông tin user hiện tại
     * @returns {Promise<BlogComment>}
     */
   async updateCommentStatus(commentId, status, currentUser) {
    if (currentUser.role !== 'admin') {
        throw new AppError('Forbidden: Only admin can update comment status', 403);
    }

    // Lấy comment cũ
    const oldComment = await blogCommentRepository.getById(commentId);
    if (!oldComment) {
        throw new AppError('Comment not found', 404);
    }

    // Update status
    const updatedComment = await blogCommentRepository.updateStatus(commentId, status);

    // Nếu thay đổi liên quan đến "approved" thì cập nhật số comment
    if (oldComment.status !== 'approved' && status === 'approved') {
        await blogRepository.updateCommentCount(updatedComment.blog_id, +1);
    } else if (oldComment.status === 'approved' && status !== 'approved') {
        await blogRepository.updateCommentCount(updatedComment.blog_id, -1);
    }

    return updatedComment;
}

}

module.exports = new BlogCommentService();