// ============================================
// BLOG MODEL
// ============================================

import 'user_model.dart';
import 'hotel_model.dart';

class Blog {
  final String blogId;
  final String authorId;
  final String? hotelId;
  final String title;
  final String slug;
  final String content;
  final String? excerpt;
  final String? featuredImageUrl;
  final String? metaDescription;
  final String? tags;
  final BlogStatus status;
  final int viewCount;
  final int likeCount;
  final int commentCount;
  final DateTime createdAt;
  final String? approvedBy;
  final DateTime? approvedAt;

  // Quan hệ với các model khác
  final User? author;
  final Hotel? hotel;
  final User? approver;

  const Blog({
    required this.blogId,
    required this.authorId,
    this.hotelId,
    required this.title,
    required this.slug,
    required this.content,
    this.excerpt,
    this.featuredImageUrl,
    this.metaDescription,
    this.tags,
    this.status = BlogStatus.draft,
    this.viewCount = 0,
    this.likeCount = 0,
    this.commentCount = 0,
    required this.createdAt,
    this.approvedBy,
    this.approvedAt,
    this.author,
    this.hotel,
    this.approver,
  });

  factory Blog.fromJson(Map<String, dynamic> json) {
    print('DEBUG Blog.fromJson input: $json');
    try {
      final blog = Blog(
        blogId: json['blogId'] as String,
        authorId: json['authorId'] as String,
        hotelId: json['hotelId'] as String?,
        title: json['title'] as String,
        slug: json['slug'] as String,
        content: json['content'] as String,
        excerpt: json['excerpt'] as String?,
        featuredImageUrl: json['featuredImageUrl'] as String?,
        metaDescription: json['metaDescription'] as String?,
        tags: json['tags'] as String?,
        status: BlogStatus.fromString(json['status'] as String? ?? 'draft'),
        viewCount: json['viewCount'] as int? ?? 0,
        likeCount: json['likeCount'] as int? ?? 0,
        commentCount: json['commentCount'] as int? ?? 0,
        createdAt: DateTime.parse(json['createdAt'] as String),
        approvedBy: json['approvedBy'] as String?,
        approvedAt: json['approvedAt'] != null
            ? DateTime.parse(json['approvedAt'] as String)
            : null,
        author: json['author'] != null ? User.fromJson(json['author']) : null,
        hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
        approver: json['approver'] != null
            ? User.fromJson(json['approver'])
            : null,
      );
      print('DEBUG Blog.fromJson success: ${blog.blogId}');
      return blog;
    } catch (e) {
      print('DEBUG Blog.fromJson error: $e');
      print('DEBUG Blog.fromJson json keys: ${json.keys.toList()}');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'blog_id': blogId,
      'author_id': authorId,
      'hotel_id': hotelId,
      'title': title,
      'slug': slug,
      'content': content,
      'excerpt': excerpt,
      'featured_image_url': featuredImageUrl,
      'meta_description': metaDescription,
      'tags': tags,
      'status': status.value,
      'view_count': viewCount,
      'like_count': likeCount,
      'comment_count': commentCount,
      'created_at': createdAt.toIso8601String(),
      'approved_by': approvedBy,
      'approved_at': approvedAt?.toIso8601String(),
      if (author != null) 'author': author!.toJson(),
      if (hotel != null) 'hotel': hotel!.toJson(),
      if (approver != null) 'approver': approver!.toJson(),
    };
  }

  Blog copyWith({
    String? blogId,
    String? authorId,
    String? hotelId,
    String? title,
    String? slug,
    String? content,
    String? excerpt,
    String? featuredImageUrl,
    String? metaDescription,
    String? tags,
    BlogStatus? status,
    int? viewCount,
    int? likeCount,
    int? commentCount,
    DateTime? createdAt,
    String? approvedBy,
    DateTime? approvedAt,
    User? author,
    Hotel? hotel,
    User? approver,
  }) {
    return Blog(
      blogId: blogId ?? this.blogId,
      authorId: authorId ?? this.authorId,
      hotelId: hotelId ?? this.hotelId,
      title: title ?? this.title,
      slug: slug ?? this.slug,
      content: content ?? this.content,
      excerpt: excerpt ?? this.excerpt,
      featuredImageUrl: featuredImageUrl ?? this.featuredImageUrl,
      metaDescription: metaDescription ?? this.metaDescription,
      tags: tags ?? this.tags,
      status: status ?? this.status,
      viewCount: viewCount ?? this.viewCount,
      likeCount: likeCount ?? this.likeCount,
      commentCount: commentCount ?? this.commentCount,
      createdAt: createdAt ?? this.createdAt,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedAt: approvedAt ?? this.approvedAt,
      author: author ?? this.author,
      hotel: hotel ?? this.hotel,
      approver: approver ?? this.approver,
    );
  }

  /// Tăng lượt xem
  Blog incrementViewCount() {
    return copyWith(viewCount: viewCount + 1);
  }

  /// Tăng lượt thích
  Blog incrementLikeCount() {
    return copyWith(likeCount: likeCount + 1);
  }

  /// Giảm lượt thích
  Blog decrementLikeCount() {
    return copyWith(likeCount: likeCount > 0 ? likeCount - 1 : 0);
  }

  /// Cập nhật số lượng comment
  Blog updateCommentCount(int newCount) {
    return copyWith(commentCount: newCount);
  }

  /// Duyệt blog
  Blog approve(String approverId) {
    return copyWith(
      status: BlogStatus.published,
      approvedBy: approverId,
      approvedAt: DateTime.now(),
    );
  }

  /// Từ chối blog
  Blog reject() {
    return copyWith(status: BlogStatus.rejected);
  }

  /// Kiểm tra blog có hình ảnh đại diện không
  bool get hasFeaturedImage =>
      featuredImageUrl != null && featuredImageUrl!.isNotEmpty;

  /// Kiểm tra blog có excerpt không
  bool get hasExcerpt => excerpt != null && excerpt!.isNotEmpty;

  /// Kiểm tra blog có tags không
  bool get hasTags => tags != null && tags!.isNotEmpty;

  /// Lấy danh sách tags
  List<String> get tagList {
    if (!hasTags) return [];
    return tags!
        .split(',')
        .map((tag) => tag.trim())
        .where((tag) => tag.isNotEmpty)
        .toList();
  }

  /// Kiểm tra blog có được duyệt không
  bool get isApproved => status == BlogStatus.published && approvedBy != null;

  /// Kiểm tra blog có đang chờ duyệt không
  bool get isPending => status == BlogStatus.pending;

  /// Kiểm tra blog có bị từ chối không
  bool get isRejected => status == BlogStatus.rejected;

  /// Kiểm tra blog có đang draft không
  bool get isDraft => status == BlogStatus.draft;

  /// Kiểm tra blog có bị lưu trữ không
  bool get isArchived => status == BlogStatus.archived;

  /// Lấy tên tác giả
  String get authorName => author?.fullName ?? 'Tác giả ẩn danh';

  /// Lấy tên khách sạn
  String get hotelName => hotel?.name ?? 'Không xác định';

  /// Lấy excerpt hoặc nội dung ngắn gọn
  String get displayExcerpt {
    if (hasExcerpt) return excerpt!;
    if (content.length <= 200) return content;
    return '${content.substring(0, 197)}...';
  }

  @override
  String toString() {
    return 'Blog(blogId: $blogId, title: $title, status: $status, viewCount: $viewCount, likeCount: $likeCount)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Blog && other.blogId == blogId;
  }

  @override
  int get hashCode => blogId.hashCode;
}

enum BlogStatus {
  draft('draft'),
  pending('pending'),
  published('published'),
  archived('archived'),
  rejected('rejected');

  const BlogStatus(this.value);
  final String value;

  static BlogStatus fromString(String value) {
    return BlogStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => BlogStatus.draft,
    );
  }

  @override
  String toString() => value;
}
