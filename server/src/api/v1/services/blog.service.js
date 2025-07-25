// src/api/v1/services/blog.service.js

const blogRepository = require('../repositories/blog.repository');
const { AppError } = require('../../../utils/errors');
const slugify = require('slugify'); // Cần cài đặt: npm install slugify

class BlogService {
    /**
     * Tạo một bài blog mới.
     * @param {object} blogData - Dữ liệu bài blog.
     * @param {string} authorId - ID của tác giả.
     * @returns {Promise<Blog>}
     */
    async createBlog(blogData, authorId) {
        // Tự động tạo slug từ title
        const slug = slugify(blogData.title, { lower: true, strict: true });
        
        const existingBlog = await blogRepository.findBySlug(slug);
        if (existingBlog) {
            throw new AppError('A blog with this title already exists, please choose another.', 409);
        }

        const fullBlogData = {
            ...blogData,
            author_id: authorId,
            slug: slug,
            status: 'draft', // Mặc định là bản nháp
        };

        return await blogRepository.create(fullBlogData);
    }

    /**
     * Lấy danh sách các bài blog đã xuất bản.
     * @param {object} pagination - Tùy chọn phân trang.
     * @returns {Promise<Blog[]>}
     */
    async getPublishedBlogs(pagination = {}) {
        const { page = 1, limit = 10 } = pagination;
        const offset = (page - 1) * limit;
        return await blogRepository.findAllPublished(limit, offset);
    }

    /**
     * Lấy một bài blog bằng slug và tăng lượt xem.
     * @param {string} slug - Slug của bài blog.
     * @returns {Promise<Blog>}
     */
    // async getBlogBySlug(slug) {
    //     const blog = await blogRepository.findBySlug(slug);
    //     if (!blog || blog.status !== 'published') {
    //         throw new AppError('Blog not found or is not published', 404);
    //     }
    //     // Tăng lượt xem (không cần đợi kết quả)
    //     blogRepository.incrementViewCount(blog.blogId);
    //     return blog;
    // }
    async getBlogBySlug(slug) {
        const blog = await blogRepository.findBySlug(slug);
        console.log('DEBUG - slug param:', slug);
        // In ra thông tin blog để kiểm tra
        console.log('DEBUG - blog found by slug:', blog);

        if (!blog || blog.status !== 'published') {
            throw new AppError('Blog not found or is not published', 404);
        }

        // Tăng lượt xem (không cần đợi kết quả)
        blogRepository.incrementViewCount(blog.blogId);

        return blog;
    }


    /**
     * Cập nhật một bài blog.
     * @param {string} blogId - ID của bài blog.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<Blog>}
     */
    async updateBlog(blogId, updateData, userId) {
        const blog = await blogRepository.findById(blogId);
        if (!blog) throw new AppError('Blog not found', 404);

        if (blog.authorId !== userId) {
            throw new AppError('Forbidden: You can only edit your own blog posts', 403);
        }
        
        // Nếu title thay đổi, cập nhật lại slug
        if (updateData.title) {
            updateData.slug = slugify(updateData.title, { lower: true, strict: true });
        }

        return await blogRepository.update(blogId, updateData);
    }
}

module.exports = new BlogService();