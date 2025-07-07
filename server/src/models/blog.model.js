class Blog {
  constructor({
    blog_id, author_id, hotel_id, title, slug, content, excerpt,
    featured_image_url, meta_description, tags, status, view_count,
    like_count, comment_count, created_at, approved_by, approved_at
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
    };
  }
}

module.exports = Blog;