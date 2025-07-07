class BlogLike {
    constructor({ like_id, blog_id, user_id, created_at }) {
        this.likeId = like_id;
        this.blogId = blog_id;
        this.userId = user_id;
        this.createdAt = created_at;
    }

    toJSON() {
        return {
            likeId: this.likeId,
            blogId: this.blogId,
            userId: this.userId,
            createdAt: this.createdAt,
        };
    }
}

module.exports = BlogLike;