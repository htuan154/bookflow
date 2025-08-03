// ============================================
// REVIEW IMAGE MODEL
// ============================================

import 'review_model.dart';

class ReviewImage {
  final String imageId;
  final String reviewId;
  final String imageUrl;
  final DateTime uploadedAt;

  // Quan hệ với review
  final Review? review;

  const ReviewImage({
    required this.imageId,
    required this.reviewId,
    required this.imageUrl,
    required this.uploadedAt,
    this.review,
  });

  factory ReviewImage.fromJson(Map<String, dynamic> json) {
    return ReviewImage(
      imageId: json['image_id'] as String,
      reviewId: json['review_id'] as String,
      imageUrl: json['image_url'] as String,
      uploadedAt: DateTime.parse(json['uploaded_at'] as String),
      review: json['review'] != null ? Review.fromJson(json['review']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'image_id': imageId,
      'review_id': reviewId,
      'image_url': imageUrl,
      'uploaded_at': uploadedAt.toIso8601String(),
      if (review != null) 'review': review!.toJson(),
    };
  }

  ReviewImage copyWith({
    String? imageId,
    String? reviewId,
    String? imageUrl,
    DateTime? uploadedAt,
    Review? review,
  }) {
    return ReviewImage(
      imageId: imageId ?? this.imageId,
      reviewId: reviewId ?? this.reviewId,
      imageUrl: imageUrl ?? this.imageUrl,
      uploadedAt: uploadedAt ?? this.uploadedAt,
      review: review ?? this.review,
    );
  }

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
      final uri = Uri.parse(imageUrl);
      final segments = uri.pathSegments;
      return segments.isNotEmpty ? segments.last : 'unknown.jpg';
    } catch (e) {
      return 'unknown.jpg';
    }
  }

  /// Lấy extension của file
  String get fileExtension {
    final name = fileName;
    final lastDot = name.lastIndexOf('.');
    return lastDot != -1 ? name.substring(lastDot + 1).toLowerCase() : '';
  }

  /// Kiểm tra có phải là định dạng ảnh hợp lệ không
  bool get isValidImageFormat {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    return validExtensions.contains(fileExtension);
  }

  @override
  String toString() {
    return 'ReviewImage(imageId: $imageId, reviewId: $reviewId, imageUrl: $imageUrl, uploadedAt: $uploadedAt)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ReviewImage && other.imageId == imageId;
  }

  @override
  int get hashCode => imageId.hashCode;
}