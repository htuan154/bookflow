// ============================================
// TOURIST LOCATION MODEL
// ============================================

import 'user_model.dart';
import 'food_recommendation_model.dart';

class TouristLocation {
  final String locationId;
  final String name;
  final String? description;
  final String city;
  final String? imageUrl;
  final String? createdBy;
  final DateTime createdAt;

  // Quan hệ với các model khác
  final User? creator;
  final List<FoodRecommendation>? foodRecommendations;

  const TouristLocation({
    required this.locationId,
    required this.name,
    this.description,
    required this.city,
    this.imageUrl,
    this.createdBy,
    required this.createdAt,
    this.creator,
    this.foodRecommendations,
  });

  factory TouristLocation.fromJson(Map<String, dynamic> json) {
    return TouristLocation(
      locationId: json['location_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      city: json['city'] as String,
      imageUrl: json['image_url'] as String?,
      createdBy: json['created_by'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      creator: json['creator'] != null ? User.fromJson(json['creator']) : null,
      foodRecommendations: json['food_recommendations'] != null
          ? (json['food_recommendations'] as List)
              .map((food) => FoodRecommendation.fromJson(food))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'location_id': locationId,
      'name': name,
      'description': description,
      'city': city,
      'image_url': imageUrl,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
      if (creator != null) 'creator': creator!.toJson(),
      if (foodRecommendations != null)
        'food_recommendations': foodRecommendations!.map((food) => food.toJson()).toList(),
    };
  }

  TouristLocation copyWith({
    String? locationId,
    String? name,
    String? description,
    String? city,
    String? imageUrl,
    String? createdBy,
    DateTime? createdAt,
    User? creator,
    List<FoodRecommendation>? foodRecommendations,
  }) {
    return TouristLocation(
      locationId: locationId ?? this.locationId,
      name: name ?? this.name,
      description: description ?? this.description,
      city: city ?? this.city,
      imageUrl: imageUrl ?? this.imageUrl,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      creator: creator ?? this.creator,
      foodRecommendations: foodRecommendations ?? this.foodRecommendations,
    );
  }

  /// Kiểm tra có hình ảnh không
  bool get hasImage => imageUrl != null && imageUrl!.isNotEmpty;

  /// Kiểm tra có mô tả không
  bool get hasDescription => description != null && description!.isNotEmpty;

  /// Số lượng món ăn được gợi ý
  int get foodRecommendationCount => foodRecommendations?.length ?? 0;

  /// Kiểm tra có món ăn được gợi ý không
  bool get hasFoodRecommendations => foodRecommendationCount > 0;

  /// Lấy tên thành phố viết hoa chữ cái đầu
  String get cityCapitalized {
    if (city.isEmpty) return city;
    return city[0].toUpperCase() + city.substring(1).toLowerCase();
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

  @override
  String toString() {
    return 'TouristLocation(locationId: $locationId, name: $name, city: $city, foodRecommendationCount: $foodRecommendationCount)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TouristLocation && other.locationId == locationId;
  }

  @override
  int get hashCode => locationId.hashCode;
}