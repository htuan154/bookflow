// src/api/v1/repositories/blog.repository.js

const pool = require('../../../config/db');
const Blog = require('../../../models/blog.model');
const Blog_custom = require('../../../models/blog_custom');

/**
 * Tạo một bài blog mới.
 * @param {object} blogData - Dữ liệu của bài blog.
 * @returns {Promise<Blog>}
 */
const create = async (blogData) => {
    const {
        author_id, hotel_id, title, slug, content, excerpt,
        featured_image_url, meta_description, tags, status
    } = blogData;
    const query = `
        INSERT INTO blogs (
            author_id, hotel_id, title, slug, content, excerpt,
            featured_image_url, meta_description, tags, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
    `;
    const values = [
        author_id, hotel_id, title, slug, content, excerpt,
        featured_image_url, meta_description, tags, status
    ];
    const result = await pool.query(query, values);
    return new Blog(result.rows[0]);
};

/**
 * Tìm một bài blog bằng slug.
 * @param {string} slug - Slug của bài blog.
 * @returns {Promise<Blog|null>}
 */
const findBySlug = async (slug) => {
    const result = await pool.query('SELECT * FROM blogs WHERE slug = $1', [slug]);
    return result.rows[0] ? new Blog(result.rows[0]) : null;
};

/**
 * Tìm một bài blog bằng ID (dùng cho trang chi tiết).
 * @param {string} blogId - ID của bài blog.
 * @returns {Promise<Blog|null>}
 */
const findById = async (blogId) => {
    const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [blogId]);
    // Trả về đầy đủ trường, bao gồm view_count, like_count, comment_count,...
    return result.rows[0] ? new Blog(result.rows[0]) : null;
};


/**
 * Lấy tất cả các bài blog đã được xuất bản (có phân trang).
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<Blog[]>}
 */
const findAllPublished = async (limit = 10, offset = 0) => {
    const query = `
        SELECT blogs.*, users.username
        FROM blogs
        JOIN users ON users.user_id = blogs.author_id
        WHERE blogs.status = 'published'
        ORDER BY blogs.created_at DESC
        LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows.map(row => new Blog_custom(row));
};

/**
 * Cập nhật một bài blog.
 * @param {string} blogId - ID của bài blog.
 * @param {object} updateData - Dữ liệu cập nhật.
 * @returns {Promise<Blog|null>}
 */
const update = async (blogId, updateData) => {
    const fields = Object.keys(updateData).map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(updateData);
    values.push(blogId);

    const query = `
        UPDATE blogs SET ${fields.join(', ')}
        WHERE blog_id = $${values.length}
        RETURNING *;
    `;
    const result = await pool.query(query, values);
    return result.rows[0] ? new Blog(result.rows[0]) : null;
};

/**
 * Tăng số lượt xem của một bài blog.
 * @param {string} blogId - ID của bài blog.
 */
const incrementViewCount = async (blogId) => {
    await pool.query('UPDATE blogs SET view_count = view_count + 1 WHERE blog_id = $1', [blogId]);
};

/**
 * Tăng/giảm số lượt thích.
 * @param {string} blogId - ID của bài blog.
 * @param {number} amount - Số lượng để thay đổi (1 hoặc -1).
 * @param {object} client - Đối tượng client của pg từ transaction.
 */
const updateLikeCount = async (blogId, amount, client) => {
    const query = 'UPDATE blogs SET like_count = like_count + $1 WHERE blog_id = $2 AND like_count + $1 >= 0';
    await client.query(query, [amount, blogId]);
};

/**
 * Tăng/giảm số bình luận.
 * @param {string} blogId - ID của bài blog.
 * @param {number} amount - Số lượng để thay đổi (1 hoặc -1).
 */
const updateCommentCount = async (blogId, amount) => {
    const query = 'UPDATE blogs SET comment_count = comment_count + $1 WHERE blog_id = $2 AND comment_count + $1 >= 0';
    await pool.query(query, [amount, blogId]);
};

/**
 * Lấy các bài blog theo trạng thái với phân trang và sắp xếp.
 * @param {string} status - Trạng thái của blog ('draft', 'pending', 'published', 'archived', 'rejected').
 * @param {number} limit - Số lượng bài blog trên mỗi trang.
 * @param {number} offset - Vị trí bắt đầu.
 * @param {string} sortBy - Trường để sắp xếp (mặc định: 'created_at').
 * @param {string} sortOrder - Thứ tự sắp xếp ('ASC' hoặc 'DESC', mặc định: 'DESC').
 * @returns {Promise<{blogs: Blog[], total: number}>}
 */
const findByStatus = async (status, limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'DESC') => {
    // Validate status
    const validStatuses = ['draft', 'pending', 'published', 'archived', 'rejected'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
    }

    // Validate sortBy để tránh SQL injection
    const validSortFields = ['created_at', 'updated_at', 'title', 'view_count', 'like_count'];
    if (!validSortFields.includes(sortBy)) {
        sortBy = 'created_at';
    }

    // Validate sortOrder
    sortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query để lấy blogs
    const blogQuery = `
        SELECT b.*, u.full_name as author_name, h.name as hotel_name
        FROM blogs b
        LEFT JOIN users u ON b.author_id = u.user_id
        LEFT JOIN hotels h ON b.hotel_id = h.hotel_id
        WHERE b.status = $1
        ORDER BY b.${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
    `;

    // Query để đếm tổng số blogs
    const countQuery = `
        SELECT COUNT(*) as total 
        FROM blogs 
        WHERE status = $1
    `;

    try {
        const [blogResult, countResult] = await Promise.all([
            pool.query(blogQuery, [status, limit, offset]),
            pool.query(countQuery, [status])
        ]);

        const blogs = blogResult.rows.map(row => new Blog(row));
        const total = parseInt(countResult.rows[0].total);

        return { blogs, total };
    } catch (error) {
        throw new Error(`Error fetching blogs by status: ${error.message}`);
    }
};

/**
 * Lấy thống kê số lượng blogs theo từng trạng thái.
 * @returns {Promise<object>} Object chứa số lượng blogs theo từng status.
 */
const getBlogStatsByStatus = async () => {
    const query = `
        SELECT 
            status,
            COUNT(*) as count
        FROM blogs 
        GROUP BY status
        ORDER BY status
    `;
    
    try {
        const result = await pool.query(query);
        const stats = {};
        
        // Initialize all statuses with 0
        const validStatuses = ['draft', 'pending', 'published', 'archived', 'rejected'];
        validStatuses.forEach(status => {
            stats[status] = 0;
        });
        
        // Fill in actual counts
        result.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
        });
        
        return stats;
    } catch (error) {
        throw new Error(`Error fetching blog statistics: ${error.message}`);
    }
};
/**
 * Xóa một bài blog theo ID.
 * @param {string} blogId - ID của bài blog.
 * @returns {Promise<boolean>} - Trả về true nếu xóa thành công, false nếu không tìm thấy blog.
 */
const deleteById = async (blogId) => {
    const query = 'DELETE FROM blogs WHERE blog_id = $1 RETURNING *';
    const result = await pool.query(query, [blogId]);
    return result.rowCount > 0;
};

//Thêm hàm cập nhật trạng thái của blog
/**
 * Cập nhật trạng thái của một blog.
 * @param {string} blogId - ID của blog.
 * @param {string} newStatus - Trạng thái mới.
 * @param {string|null} approvedBy - ID của người duyệt (nếu có).
 * @returns {Promise<Blog|null>}
 */
const updateStatus = async (blogId, newStatus, approvedBy = null) => {
    const validStatuses = ['draft', 'pending', 'published', 'archived', 'rejected'];

    if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}`);
    }

    let query;
    let values;

    if (newStatus === 'published' && approvedBy) {
        // Nếu là published và có người duyệt
        query = `
            UPDATE blogs
            SET status = $1, approved_by = $2, approved_at = NOW()
            WHERE blog_id = $3
            RETURNING *;
        `;
        values = [newStatus, approvedBy, blogId];
    } else {
        // Các trường hợp khác
        query = `
            UPDATE blogs
            SET status = $1
            WHERE blog_id = $2
            RETURNING *;
        `;
        values = [newStatus, blogId];
    }

    const result = await pool.query(query, values);
    return result.rows[0] ? new Blog(result.rows[0]) : null;
};

//thêm hàm tìm kiếm theo tiêu đè có phân trang 
/**
 * Tìm kiếm blog theo tiêu đề (có phân trang, tùy chọn lọc theo trạng thái)
 * @param {string} keyword - Từ khóa tiêu đề.
 * @param {number} limit - Số lượng/trang.
 * @param {number} offset - Vị trí bắt đầu.
 * @param {string} [status] - Tùy chọn: 'published', 'pending', v.v...
 * @returns {Promise<{blogs: Blog[], total: number}>}
 */
// src/api/v1/repositories/blog.repository.js
// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseTones = (str) => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};
const searchByTitleSimple = async (keyword, limit = 10, offset = 0, status) => {
    const searchValue = `%${keyword}%`;

    // Tạo điều kiện WHERE
    let whereClause = `WHERE LOWER(title) LIKE LOWER($1)`;
    const params = [searchValue];

    if (status) {
        whereClause = `WHERE status = $2 AND LOWER(title) LIKE LOWER($1)`;
        params.push(status);
    }

    // Nếu có status thì limit/offset là param thứ 3 và 4, ép kiểu int
    const limitParamIndex = params.length + 1;
    const offsetParamIndex = params.length + 2;

    const blogsQuery = `
        SELECT * FROM blogs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitParamIndex}::int OFFSET $${offsetParamIndex}::int
    `;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM blogs
        ${whereClause}
    `;

    const queryParams = [...params, parseInt(limit), parseInt(offset)];

    const [blogsResult, countResult] = await Promise.all([
        pool.query(blogsQuery, queryParams),
        pool.query(countQuery, params)
    ]);

    let blogs = blogsResult.rows.map(row => new Blog(row));
    let total = parseInt(countResult.rows[0].total);

    // Tìm không dấu nếu không có kết quả
    if (blogs.length === 0 && keyword) {
        let allQuery = `SELECT * FROM blogs ORDER BY created_at DESC`;
        const allResult = await pool.query(allQuery);

        const keywordNoSign = removeVietnameseTones(keyword.toLowerCase());
        blogs = allResult.rows
            .filter(row => {
                if (status && row.status !== status) return false;
                return removeVietnameseTones(row.title?.toLowerCase() || '').includes(keywordNoSign);
            })
            .slice(offset, offset + limit)
            .map(row => new Blog(row));

        total = blogs.length;
    }

    return { blogs, total };
};


//thêm vào ngày 18
// dành cho dashboard
/**
 * Lấy danh sách blog theo trạng thái kèm số lượt thích và số bình luận
 * @param {string} status - Trạng thái blog ('published')
 * @returns {Promise<Array>}
 */
    const findBlogsWithStatsByStatus = async (status = 'published') => {
    const query = `
        SELECT 
        b.blog_id,
        b.title,
        b.excerpt,
        b.author_id,
        b.status,
        b.tags,
        b.created_at::date AS created_at,
        b.like_count,
        b.comment_count
        FROM blogs b
        WHERE b.status = $1
        ORDER BY b.created_at DESC;
    `;

    const result = await pool.query(query, [status]);

    return result.rows.map(row => ({
        blogId: row.blog_id,
        title: row.title,
        excerpt: row.excerpt,
        authorId: row.author_id,
        status: row.status,
        tags: row.tags,
        createdAt: row.created_at,
        likeCount: parseInt(row.like_count, 10) || 0,
        commentCount: parseInt(row.comment_count, 10) || 0
    }));
};
//Tôi vừa mới thêm vào lúc 10h43 ngày 04/10/2025 hàm lấy blog đúng theo chủ khách sạn đó 
/**
 * Lấy danh sách blog theo author_id (có phân trang, tuỳ chọn status)
 * @param {string} authorId - ID của tác giả (chủ khách sạn)
 * @param {object} options - { limit, offset, status }
 * @returns {Promise<{blogs: Blog[], total: number}>}
 */
const findByAuthorId = async (authorId, options = {}) => {
    const { limit = 10, offset = 0, status } = options;
    let whereClause = 'WHERE author_id = $1';
    const params = [authorId];
    if (status) {
        whereClause += ' AND status = $2';
        params.push(status);
    }
    const limitParamIndex = params.length + 1;
    const offsetParamIndex = params.length + 2;
    const blogsQuery = `
        SELECT * FROM blogs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitParamIndex}::int OFFSET $${offsetParamIndex}::int
    `;
    const countQuery = `
        SELECT COUNT(*) as total FROM blogs
        ${whereClause}
    `;
    const queryParams = [...params, parseInt(limit), parseInt(offset)];
    const [blogsResult, countResult] = await Promise.all([
        pool.query(blogsQuery, queryParams),
        pool.query(countQuery, params)
    ]);
    const blogs = blogsResult.rows.map(row => new Blog(row));
    const total = parseInt(countResult.rows[0].total);
    return { blogs, total };
};
/**
 * Lấy các blog do admin đăng (không hardcode role, truyền role qua tham số)
 * @param {number} limit
 * @param {number} offset
 * @param {string} status
 * @param {string} adminRole - role của admin, mặc định là 'admin'
 * @returns {Promise<Blog[]>}
 */
const findAdminBlogs = async (limit = 10, offset = 0, status, adminRole = 'admin') => {
    let whereClause = `WHERE r.role_name = $1`;
    const params = [adminRole];
    if (status) {
        whereClause += ' AND b.status = $2';
        params.push(status);
    }
    const limitParamIndex = params.length + 1;
    const offsetParamIndex = params.length + 2;
    const query = `
        SELECT b.*
        FROM blogs b
        JOIN users u ON b.author_id = u.user_id
        JOIN roles r ON u.role_id = r.role_id
        ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;
    const result = await pool.query(query, [...params, limit, offset]);
    return result.rows.map(row => new Blog(row));
};

module.exports = {
    create,
    findBySlug,
    findById,
    findAllPublished,
    findByStatus, // Thêm function mới
    getBlogStatsByStatus, // Thêm function mới
    update,
    incrementViewCount,
    updateLikeCount,
    updateCommentCount,
    deleteById,
    updateStatus, // Thêm function mới
    searchByTitleSimple, // Thêm export hàm đơn giản này
    findBlogsWithStatsByStatus
    ,findByAuthorId // Thêm export hàm mới ngày 4/10/2025
    ,findAdminBlogs // Export hàm lấy blog do admin đăng thêm ngày 9/10
};