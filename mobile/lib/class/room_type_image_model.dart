// ============================================
// ROOM TYPE IMAGE MODEL
// ============================================

import 'room_type_model.dart';

class RoomTypeImage {
  final String? imageId;
  final String roomTypeId;
  final String imageUrl;
  final String? caption;
  final bool isThumbnail;
  final DateTime? uploadedAt;
  
  // Quan hệ với RoomType - optional
  final RoomType? roomType;

  const RoomTypeImage({
    this.imageId,
    required this.roomTypeId,
    required this.imageUrl,
    this.caption,
    this.isThumbnail = false,
    this.uploadedAt,
    this.roomType,
  });

  /// Tạo RoomTypeImage từ JSON
  factory RoomTypeImage.fromJson(Map<String, dynamic> json) {
    return RoomTypeImage(
      imageId: json['image_id'] as String?,
      roomTypeId: json['room_type_id'] as String,
      imageUrl: json['image_url'] as String,
      caption: json['caption'] as String?,
      isThumbnail: json['is_thumbnail'] as bool? ?? false,
      uploadedAt: json['uploaded_at'] != null ? DateTime.parse(json['uploaded_at'] as String) : null,
      roomType: json['room_type'] != null ? RoomType.fromJson(json['room_type']) : null,
    );
  }

  /// Chuyển RoomTypeImage thành JSON
  Map<String, dynamic> toJson() {
    return {
      'image_id': imageId,
      'room_type_id': roomTypeId,
      'image_url': imageUrl,
      'caption': caption,
      'is_thumbnail': isThumbnail,
      'uploaded_at': uploadedAt?.toIso8601String(),
      if (roomType != null) 'room_type': roomType!.toJson(),
    };
  }

  /// Copy với giá trị mới
  RoomTypeImage copyWith({
    String? imageId,
    String? roomTypeId,
    String? imageUrl,
    String? caption,
    bool? isThumbnail,
    DateTime? uploadedAt,
    RoomType? roomType,
  }) {
    return RoomTypeImage(
      imageId: imageId ?? this.imageId,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      imageUrl: imageUrl ?? this.imageUrl,
      caption: caption ?? this.caption,
      isThumbnail: isThumbnail ?? this.isThumbnail,
      uploadedAt: uploadedAt ?? this.uploadedAt,
      roomType: roomType ?? this.roomType,
    );
  }

  @override
  String toString() {
    return 'RoomTypeImage{imageId: $imageId, roomTypeId: $roomTypeId, imageUrl: $imageUrl, isThumbnail: $isThumbnail}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is RoomTypeImage &&
        other.imageId == imageId &&
        other.roomTypeId == roomTypeId &&
        other.imageUrl == imageUrl &&
        other.caption == caption &&
        other.isThumbnail == isThumbnail &&
        other.uploadedAt == uploadedAt &&
        other.roomType == roomType;
  }

  @override
  int get hashCode {
    return Object.hash(
      imageId,
      roomTypeId,
      imageUrl,
      caption,
      isThumbnail,
      uploadedAt,
      roomType,
    );
  }
}