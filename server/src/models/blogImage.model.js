class BlogImage {
    constructor({ image_id, blog_id, image_url, caption, order_index, uploaded_at }) {
        this.imageId = image_id;
        this.blogId = blog_id;
        this.imageUrl = image_url;
        this.caption = caption;
        this.orderIndex = order_index;
        this.uploadedAt = uploaded_at;
    }

    toJSON() {
        return {
            imageId: this.imageId,
            blogId: this.blogId,
            imageUrl: this.imageUrl,
            caption: this.caption,
            orderIndex: this.orderIndex,
        };
    }
}

module.exports = BlogImage;