// ============================================
// BLOG LIKE MODEL
// ============================================

import 'dart:convert';
import 'user_model.dart';

class BlogLike {
  final String likeId;
  final String blogId;
  final String userId;
  final DateTime createdAt;

  // Quan hệ với User (optional)
  final User? user;

  BlogLike({
    required this.likeId,
    required this.blogId,
    required this.userId,
    required this.createdAt,
    this.user,
  });

  // Factory constructor từ JSON
  factory BlogLike.fromJson(Map<String, dynamic> json) {
    return BlogLike(
      likeId: json['like_id'] as String,
      blogId: json['blog_id'] as String,
      userId: json['user_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'like_id': likeId,
      'blog_id': blogId,
      'user_id': userId,
      'created_at': createdAt.toIso8601String(),
      if (user != null) 'user': user!.toJson(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory BlogLike.fromJsonString(String jsonString) {
    return BlogLike.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  BlogLike copyWith({
    String? likeId,
    String? blogId,
    String? userId,
    DateTime? createdAt,
    User? user,
  }) {
    return BlogLike(
      likeId: likeId ?? this.likeId,
      blogId: blogId ?? this.blogId,
      userId: userId ?? this.userId,
      createdAt: createdAt ?? this.createdAt,
      user: user ?? this.user,
    );
  }

  // Helper methods
  String get userName => user?.fullName ?? user?.username ?? 'Anonymous';
  String? get userAvatar => user?.profilePictureUrl;

  // Tính thời gian đã like (relative time)
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
    } else {
      final years = (difference.inDays / 365).floor();
      return '${years}y ago';
    }
  }

  @override
  String toString() {
    return 'BlogLike(likeId: $likeId, blogId: $blogId, userId: $userId, userName: $userName, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BlogLike && other.likeId == likeId;
  }

  @override
  int get hashCode => likeId.hashCode;
}

// ============================================
// HELPER CLASS FOR BLOG LIKES SUMMARY
// ============================================
class BlogLikeSummary {
  final String blogId;
  final int totalLikes;
  final List<BlogLike> recentLikes;
  final bool isLikedByCurrentUser;

  BlogLikeSummary({
    required this.blogId,
    required this.totalLikes,
    required this.recentLikes,
    this.isLikedByCurrentUser = false,
  });

  // Factory constructor từ JSON
  factory BlogLikeSummary.fromJson(Map<String, dynamic> json) {
    return BlogLikeSummary(
      blogId: json['blog_id'] as String,
      totalLikes: json['total_likes'] as int,
      recentLikes: (json['recent_likes'] as List<dynamic>?)
          ?.map((like) => BlogLike.fromJson(like))
          .toList() ?? [],
      isLikedByCurrentUser: json['is_liked_by_current_user'] as bool? ?? false,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'blog_id': blogId,
      'total_likes': totalLikes,
      'recent_likes': recentLikes.map((like) => like.toJson()).toList(),
      'is_liked_by_current_user': isLikedByCurrentUser,
    };
  }

  // Helper methods
  bool get hasLikes => totalLikes > 0;
  
  List<String> get recentLikerNames => 
      recentLikes.map((like) => like.userName).toList();

  String get likeText {
    if (totalLikes == 0) return 'No likes';
    if (totalLikes == 1) return '1 like';
    return '$totalLikes likes';
  }

  String getLikeDisplayText([String? currentUserName]) {
    if (totalLikes == 0) return 'Be the first to like this';
    
    if (isLikedByCurrentUser && currentUserName != null) {
      if (totalLikes == 1) {
        return 'You liked this';
      } else if (totalLikes == 2) {
        final otherLiker = recentLikes
            .firstWhere((like) => like.userName != currentUserName, 
                      orElse: () => recentLikes.first)
            .userName;
        return 'You and $otherLiker liked this';
      } else {
        return 'You and ${totalLikes - 1} others liked this';
      }
    }
    
    if (totalLikes == 1) {
      return '${recentLikerNames.first} liked this';
    } else if (totalLikes <= 3) {
      return '${recentLikerNames.join(', ')} liked this';
    } else {
      final firstTwo = recentLikerNames.take(2).join(', ');
      return '$firstTwo and ${totalLikes - 2} others liked this';
    }
  }

  @override
  String toString() {
    return 'BlogLikeSummary(blogId: $blogId, totalLikes: $totalLikes, isLikedByCurrentUser: $isLikedByCurrentUser)';
  }
}