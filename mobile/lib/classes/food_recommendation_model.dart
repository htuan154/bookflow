// ============================================
// FOOD RECOMMENDATION MODEL
// ============================================

import 'tourist_location_model.dart';

class FoodRecommendation {
  final String foodId;
  final String? locationId;
  final String name;
  final String? description;
  final String? imageUrl;
  final DateTime createdAt;
  final double? latitude;
  final double? longitude;

  // Quan hệ với tourist location
  final TouristLocation? location;

  const FoodRecommendation({
    required this.foodId,
    this.locationId,
    required this.name,
    this.description,
    this.imageUrl,
    required this.createdAt,
    this.latitude,
    this.longitude,
    this.location,
  });

  factory FoodRecommendation.fromJson(Map<String, dynamic> json) {
    return FoodRecommendation(
      foodId: json['food_id'] as String,
      locationId: json['location_id'] as String?,
      name: json['name'] as String,
      description: json['description'] as String?,
      imageUrl: json['image_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
      location: json['location'] != null ? TouristLocation.fromJson(json['location']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'food_id': foodId,
      'location_id': locationId,
      'name': name,
      'description': description,
      'image_url': imageUrl,
      'created_at': createdAt.toIso8601String(),
      'latitude': latitude,
      'longitude': longitude,
      if (location != null) 'location': location!.toJson(),
    };
  }

  FoodRecommendation copyWith({
    String? foodId,
    String? locationId,
    String? name,
    String? description,
    String? imageUrl,
    DateTime? createdAt,
    double? latitude,
    double? longitude,
    TouristLocation? location,
  }) {
    return FoodRecommendation(
      foodId: foodId ?? this.foodId,
      locationId: locationId ?? this.locationId,
      name: name ?? this.name,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      createdAt: createdAt ?? this.createdAt,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      location: location ?? this.location,
    );
  }

  /// Kiểm tra có hình ảnh không
  bool get hasImage => imageUrl != null && imageUrl!.isNotEmpty;

  /// Kiểm tra có mô tả không
  bool get hasDescription => description != null && description!.isNotEmpty;

  /// Kiểm tra có thuộc về địa điểm du lịch nào không
  bool get hasLocation => locationId != null;

  /// Lấy tên món ăn viết hoa chữ cái đầu
  String get nameCapitalized {
    if (name.isEmpty) return name;
    return name.split(' ').map((word) => 
      word.isNotEmpty ? word[0].toUpperCase() + word.substring(1).toLowerCase() : word
    ).join(' ');
  }

  /// Kiểm tra URL hình ảnh có hợp lệ không
  bool get isValidImageUrl {
    if (imageUrl == null || imageUrl!.isEmpty) return false;
    try {
      final uri = Uri.parse(imageUrl!);
      return uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https');
    } catch (e) {
      return false;
    }
  }

  /// Lấy mô tả ngắn (tối đa 100 ký tự)
  String get shortDescription {
    if (description == null || description!.isEmpty) return '';
    if (description!.length <= 100) return description!;
    return '${description!.substring(0, 97)}...';
  }

  /// Lấy thông tin địa điểm (tên + thành phố nếu có)
  String get locationInfo {
    if (location == null) return 'Không xác định';
    return '${location!.name}, ${location!.cityCapitalized}';
  }

  @override
  String toString() {
    return 'FoodRecommendation(foodId: $foodId, name: $name, locationId: $locationId, hasImage: $hasImage)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is FoodRecommendation && other.foodId == foodId;
  }

  @override
  int get hashCode => foodId.hashCode;
}