class BlogComment {
    constructor({ comment_id, blog_id, user_id, parent_comment_id, content, status, like_count, created_at, updated_at, full_name }) {
        this.commentId = comment_id;
        this.blogId = blog_id;
        this.userId = user_id;
        this.parentCommentId = parent_comment_id;
        this.content = content;
        this.status = status;
        this.likeCount = like_count;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
        this.full_name = full_name; 
    }

    toJSON() {
        return {
            commentId: this.commentId,
            blogId: this.blogId,
            userId: this.userId,
            parentCommentId: this.parentCommentId,
            content: this.content,
            status: this.status,
            likeCount: this.likeCount,
            createdAt: this.createdAt,
            full_name: this.full_name 
        };
    }
}

module.exports = BlogComment;