// ============================================
// BLOG COMMENT MODEL
// ============================================

import 'dart:convert';
import 'user_model.dart';

class BlogComment {
  final String commentId;
  final String blogId;
  final String userId;
  final String? parentCommentId;
  final String content;
  final String status;
  final int likeCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Quan hệ với các model khác (optional)
  final User? user;
  final BlogComment? parentComment;
  final List<BlogComment>? replies;

  BlogComment({
    required this.commentId,
    required this.blogId,
    required this.userId,
    this.parentCommentId,
    required this.content,
    this.status = 'pending',
    this.likeCount = 0,
    required this.createdAt,
    required this.updatedAt,
    this.user,
    this.parentComment,
    this.replies,
  });

  // Factory constructor từ JSON
  factory BlogComment.fromJson(Map<String, dynamic> json) {
    print('DEBUG BlogComment.fromJson input: $json');
    try {
      final comment = BlogComment(
        commentId: json['commentId'] as String,
        blogId: json['blogId'] as String,
        userId: json['userId'] as String,
        parentCommentId: json['parentCommentId'] as String?,
        content: json['content'] as String,
        status: json['status'] as String? ?? 'pending',
        likeCount: json['likeCount'] as int? ?? 0,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: json['updatedAt'] != null
            ? DateTime.parse(json['updatedAt'] as String)
            : DateTime.parse(json['createdAt'] as String),
        user: json['user'] != null ? User.fromJson(json['user']) : null,
        parentComment: json['parentComment'] != null
            ? BlogComment.fromJson(json['parentComment'])
            : null,
        replies: json['replies'] != null
            ? (json['replies'] as List<dynamic>)
                  .map((reply) => BlogComment.fromJson(reply))
                  .toList()
            : null,
      );
      print('DEBUG BlogComment.fromJson success: ${comment.commentId}');
      return comment;
    } catch (e) {
      print('DEBUG BlogComment.fromJson error: $e');
      print('DEBUG BlogComment.fromJson json keys: ${json.keys.toList()}');
      rethrow;
    }
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'comment_id': commentId,
      'blog_id': blogId,
      'user_id': userId,
      'parent_comment_id': parentCommentId,
      'content': content,
      'status': status,
      'like_count': likeCount,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      if (user != null) 'user': user!.toJson(),
      if (parentComment != null) 'parent_comment': parentComment!.toJson(),
      if (replies != null)
        'replies': replies!.map((reply) => reply.toJson()).toList(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory BlogComment.fromJsonString(String jsonString) {
    return BlogComment.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  BlogComment copyWith({
    String? commentId,
    String? blogId,
    String? userId,
    String? parentCommentId,
    String? content,
    String? status,
    int? likeCount,
    DateTime? createdAt,
    DateTime? updatedAt,
    User? user,
    BlogComment? parentComment,
    List<BlogComment>? replies,
  }) {
    return BlogComment(
      commentId: commentId ?? this.commentId,
      blogId: blogId ?? this.blogId,
      userId: userId ?? this.userId,
      parentCommentId: parentCommentId ?? this.parentCommentId,
      content: content ?? this.content,
      status: status ?? this.status,
      likeCount: likeCount ?? this.likeCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      user: user ?? this.user,
      parentComment: parentComment ?? this.parentComment,
      replies: replies ?? this.replies,
    );
  }

  // Helper methods để kiểm tra status
  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isHidden => status == 'hidden';

  // Kiểm tra có phải comment gốc không
  bool get isRootComment => parentCommentId == null;

  // Kiểm tra có phải reply không
  bool get isReply => parentCommentId != null;

  // Lấy tên người comment
  String get authorName => user?.fullName ?? user?.username ?? 'Anonymous';

  // Lấy avatar người comment
  String? get authorAvatar => user?.profilePictureUrl;

  // Tính thời gian đã comment (relative time)
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '${weeks}w ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '${months}mo ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '${years}y ago';
    }
  }

  // Kiểm tra comment có được chỉnh sửa không
  bool get isEdited =>
      updatedAt.isAfter(createdAt.add(const Duration(minutes: 1)));

  // Số lượng replies
  int get replyCount => replies?.length ?? 0;

  // Kiểm tra có replies không
  bool get hasReplies => replyCount > 0;

  // Truncate content nếu quá dài
  String getContentPreview([int maxLength = 100]) {
    if (content.length <= maxLength) return content;
    return '${content.substring(0, maxLength)}...';
  }

  @override
  String toString() {
    return 'BlogComment(commentId: $commentId, blogId: $blogId, authorName: $authorName, status: $status, isReply: $isReply, likeCount: $likeCount)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BlogComment && other.commentId == commentId;
  }

  @override
  int get hashCode => commentId.hashCode;
}

// ============================================
// ENUM DEFINITIONS
// ============================================
enum CommentStatus { pending, approved, rejected, hidden }

extension CommentStatusExtension on CommentStatus {
  String get value {
    switch (this) {
      case CommentStatus.pending:
        return 'pending';
      case CommentStatus.approved:
        return 'approved';
      case CommentStatus.rejected:
        return 'rejected';
      case CommentStatus.hidden:
        return 'hidden';
    }
  }

  static CommentStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return CommentStatus.pending;
      case 'approved':
        return CommentStatus.approved;
      case 'rejected':
        return CommentStatus.rejected;
      case 'hidden':
        return CommentStatus.hidden;
      default:
        throw ArgumentError('Invalid comment status: $value');
    }
  }

  String get displayName {
    switch (this) {
      case CommentStatus.pending:
        return 'Pending Review';
      case CommentStatus.approved:
        return 'Approved';
      case CommentStatus.rejected:
        return 'Rejected';
      case CommentStatus.hidden:
        return 'Hidden';
    }
  }
}
