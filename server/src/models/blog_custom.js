class Blog_custom {
  constructor({
    blog_id, author_id, hotel_id, title, slug, content, excerpt,
    featured_image_url, meta_description, tags, status, view_count,
    like_count, comment_count, created_at, approved_by, approved_at, username
  }) {
    this.blogId = blog_id;
    this.authorId = author_id;

    this.hotelId = hotel_id;
    this.title = title;
    this.slug = slug;
    this.content = content;
    this.excerpt = excerpt;
    this.featuredImageUrl = featured_image_url;
    this.metaDescription = meta_description;
    this.tags = tags;
    this.status = status;
    this.viewCount = view_count;
    this.likeCount = like_count;
    this.commentCount = comment_count;
    this.createdAt = created_at;
    this.approvedBy = approved_by;
    this.approvedAt = approved_at;
    this.username = username; // Thêm trường username
  }

  toJSON() {
    return {
      blogId: this.blogId,
      authorId: this.authorId,
      hotelId: this.hotelId,
      title: this.title,
      slug: this.slug,
      content: this.content,
      excerpt: this.excerpt,
      featuredImageUrl: this.featuredImageUrl,
      status: this.status,
      viewCount: this.viewCount,
      likeCount: this.likeCount,
      commentCount: this.commentCount,
      createdAt: this.createdAt,
      tags: this.tags,
      metaDescription: this.metaDescription,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      username: this.username
    };
  }
}

// Các trường đã đúng chuẩn camelCase cho frontend sử dụng.

module.exports = Blog_custom;