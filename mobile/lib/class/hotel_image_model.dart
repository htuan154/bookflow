// ============================================
// HOTEL IMAGE MODEL
// ============================================

import 'dart:convert';
import 'hotel_model.dart';

class HotelImage {
  final String imageId;
  final String hotelId;
  final String imageUrl;
  final String? caption;
  final bool isThumbnail;
  final int? orderIndex;
  final DateTime uploadedAt;

  // Quan hệ với Hotel (optional)
  final Hotel? hotel;

  HotelImage({
    required this.imageId,
    required this.hotelId,
    required this.imageUrl,
    this.caption,
    this.isThumbnail = false,
    this.orderIndex,
    required this.uploadedAt,
    this.hotel,
  });

  // Factory constructor từ JSON
  factory HotelImage.fromJson(Map<String, dynamic> json) {
    return HotelImage(
      imageId: json['image_id'] as String,
      hotelId: json['hotel_id'] as String,
      imageUrl: json['image_url'] as String,
      caption: json['caption'] as String?,
      isThumbnail: json['is_thumbnail'] as bool? ?? false,
      orderIndex: json['order_index'] as int?,
      uploadedAt: DateTime.parse(json['uploaded_at'] as String),
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'image_id': imageId,
      'hotel_id': hotelId,
      'image_url': imageUrl,
      'caption': caption,
      'is_thumbnail': isThumbnail,
      'order_index': orderIndex,
      'uploaded_at': uploadedAt.toIso8601String(),
      if (hotel != null) 'hotel': hotel!.toJson(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory HotelImage.fromJsonString(String jsonString) {
    return HotelImage.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  HotelImage copyWith({
    String? imageId,
    String? hotelId,
    String? imageUrl,
    String? caption,
    bool? isThumbnail,
    int? orderIndex,
    DateTime? uploadedAt,
    Hotel? hotel,
  }) {
    return HotelImage(
      imageId: imageId ?? this.imageId,
      hotelId: hotelId ?? this.hotelId,
      imageUrl: imageUrl ?? this.imageUrl,
      caption: caption ?? this.caption,
      isThumbnail: isThumbnail ?? this.isThumbnail,
      orderIndex: orderIndex ?? this.orderIndex,
      uploadedAt: uploadedAt ?? this.uploadedAt,
      hotel: hotel ?? this.hotel,
    );
  }

  // Helper methods
  String get displayCaption => caption ?? 'Hotel Image';

  // Kiểm tra xem có phải ảnh chính không
  bool get isMainImage => isThumbnail;

  // Lấy tên file từ URL
  String get fileName {
    try {
      return imageUrl.split('/').last;
    } catch (e) {
      return 'unknown';
    }
  }

  // Lấy extension file
  String get fileExtension {
    try {
      return fileName.split('.').last.toLowerCase();
    } catch (e) {
      return 'unknown';
    }
  }

  // Kiểm tra file có phải là image hợp lệ không
  bool get isValidImageFormat {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    return validExtensions.contains(fileExtension);
  }

  @override
  String toString() {
    return 'HotelImage(imageId: $imageId, hotelId: $hotelId, caption: $caption, isThumbnail: $isThumbnail, orderIndex: $orderIndex)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is HotelImage && other.imageId == imageId;
  }

  @override
  int get hashCode => imageId.hashCode;
}