// ============================================
// BLOG IMAGE MODEL
// ============================================

import 'dart:convert';
import 'blog_model.dart';

class BlogImage {
  final String imageId;
  final String blogId;
  final String imageUrl;
  final String? caption;
  final int orderIndex;
  final DateTime uploadedAt;

  // Quan hệ với Blog (optional)
  final Blog? blog;

  const BlogImage({
    required this.imageId,
    required this.blogId,
    required this.imageUrl,
    this.caption,
    this.orderIndex = 0,
    required this.uploadedAt,
    this.blog,
  });

  /// Factory constructor từ JSON
  factory BlogImage.fromJson(Map<String, dynamic> json) {
    return BlogImage(
      imageId: json['image_id'] as String,
      blogId: json['blog_id'] as String,
      imageUrl: json['image_url'] as String,
      caption: json['caption'] as String?,
      orderIndex: json['order_index'] as int? ?? 0,
      uploadedAt: DateTime.parse(json['uploaded_at'] as String),
      blog: json['blog'] != null ? Blog.fromJson(json['blog']) : null,
    );
  }

  /// Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'image_id': imageId,
      'blog_id': blogId,
      'image_url': imageUrl,
      'caption': caption,
      'order_index': orderIndex,
      'uploaded_at': uploadedAt.toIso8601String(),
      if (blog != null) 'blog': blog!.toJson(),
    };
  }

  /// Tạo đối tượng từ JSON string
  factory BlogImage.fromJsonString(String jsonString) {
    return BlogImage.fromJson(json.decode(jsonString));
  }

  /// Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  /// CopyWith method
  BlogImage copyWith({
    String? imageId,
    String? blogId,
    String? imageUrl,
    String? caption,
    int? orderIndex,
    DateTime? uploadedAt,
    Blog? blog,
  }) {
    return BlogImage(
      imageId: imageId ?? this.imageId,
      blogId: blogId ?? this.blogId,
      imageUrl: imageUrl ?? this.imageUrl,
      caption: caption ?? this.caption,
      orderIndex: orderIndex ?? this.orderIndex,
      uploadedAt: uploadedAt ?? this.uploadedAt,
      blog: blog ?? this.blog,
    );
  }

  /// Cập nhật thứ tự hình ảnh
  BlogImage updateOrder(int newOrder) {
    return copyWith(orderIndex: newOrder);
  }

  /// Cập nhật caption
  BlogImage updateCaption(String newCaption) {
    return copyWith(caption: newCaption);
  }

  /// Kiểm tra có caption không
  bool get hasCaption => caption != null && caption!.isNotEmpty;

  /// Kiểm tra URL có hợp lệ không
  bool get isValidUrl {
    try {
      final uri = Uri.parse(imageUrl);
      return uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https');
    } catch (e) {
      return false;
    }
  }

  /// Lấy tên file từ URL
  String get fileName {
    try {
      return imageUrl.split('/').last;
    } catch (e) {
      return 'unknown';
    }
  }

  /// Lấy extension file
  String get fileExtension {
    try {
      return fileName.split('.').last.toLowerCase();
    } catch (e) {
      return 'unknown';
    }
  }

  /// Kiểm tra file có phải là ảnh hợp lệ không
  bool get isValidImageFormat {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    return validExtensions.contains(fileExtension);
  }

  /// Caption hiển thị mặc định
  String get displayCaption => caption ?? 'Blog Image';

  @override
  String toString() {
    return 'BlogImage(imageId: $imageId, blogId: $blogId, caption: $caption, orderIndex: $orderIndex)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BlogImage && other.imageId == imageId;
  }

  @override
  int get hashCode => imageId.hashCode;
}