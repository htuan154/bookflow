// ============================================
// AMENITY MODEL
// ============================================

import 'dart:convert';

class Amenity {
  final String amenityId;
  final String name;
  final String? description;
  final String? iconUrl;

  Amenity({
    required this.amenityId,
    required this.name,
    this.description,
    this.iconUrl,
  });

  // Factory constructor từ JSON
  factory Amenity.fromJson(Map<String, dynamic> json) {
    return Amenity(
      amenityId: json['amenity_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      iconUrl: json['icon_url'] as String?,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'amenity_id': amenityId,
      'name': name,
      'description': description,
      'icon_url': iconUrl,
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory Amenity.fromJsonString(String jsonString) {
    return Amenity.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  Amenity copyWith({
    String? amenityId,
    String? name,
    String? description,
    String? iconUrl,
  }) {
    return Amenity(
      amenityId: amenityId ?? this.amenityId,
      name: name ?? this.name,
      description: description ?? this.description,
      iconUrl: iconUrl ?? this.iconUrl,
    );
  }

  // Helper methods
  String get displayName => name;
  String get displayDescription => description ?? 'No description available';
  bool get hasIcon => iconUrl != null && iconUrl!.isNotEmpty;

  // Lấy category của amenity dựa vào tên (có thể mở rộng sau)
  AmenityCategory get category {
    final lowercaseName = name.toLowerCase();
    
    if (lowercaseName.contains('wifi') || 
        lowercaseName.contains('internet') || 
        lowercaseName.contains('tv') ||
        lowercaseName.contains('cable')) {
      return AmenityCategory.technology;
    }
    
    if (lowercaseName.contains('pool') || 
        lowercaseName.contains('gym') || 
        lowercaseName.contains('spa') ||
        lowercaseName.contains('fitness')) {
      return AmenityCategory.recreation;
    }
    
    if (lowercaseName.contains('restaurant') || 
        lowercaseName.contains('breakfast') || 
        lowercaseName.contains('bar') ||
        lowercaseName.contains('cafe')) {
      return AmenityCategory.dining;
    }
    
    if (lowercaseName.contains('parking') || 
        lowercaseName.contains('shuttle') || 
        lowercaseName.contains('airport') ||
        lowercaseName.contains('transport')) {
      return AmenityCategory.transportation;
    }
    
    if (lowercaseName.contains('ac') || 
        lowercaseName.contains('air conditioning') || 
        lowercaseName.contains('heating') ||
        lowercaseName.contains('safe') ||
        lowercaseName.contains('minibar')) {
      return AmenityCategory.roomFeatures;
    }
    
    return AmenityCategory.other;
  }

  @override
  String toString() {
    return 'Amenity(amenityId: $amenityId, name: $name, description: $description, hasIcon: $hasIcon)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Amenity && other.amenityId == amenityId;
  }

  @override
  int get hashCode => amenityId.hashCode;
}

// ============================================
// ENUM DEFINITIONS
// ============================================
enum AmenityCategory { 
  technology, 
  recreation, 
  dining, 
  transportation, 
  roomFeatures, 
  other 
}

extension AmenityCategoryExtension on AmenityCategory {
  String get displayName {
    switch (this) {
      case AmenityCategory.technology:
        return 'Technology';
      case AmenityCategory.recreation:
        return 'Recreation';
      case AmenityCategory.dining:
        return 'Dining';
      case AmenityCategory.transportation:
        return 'Transportation';
      case AmenityCategory.roomFeatures:
        return 'Room Features';
      case AmenityCategory.other:
        return 'Other';
    }
  }

  String get iconName {
    switch (this) {
      case AmenityCategory.technology:
        return 'wifi';
      case AmenityCategory.recreation:
        return 'pool';
      case AmenityCategory.dining:
        return 'restaurant';
      case AmenityCategory.transportation:
        return 'car';
      case AmenityCategory.roomFeatures:
        return 'bed';
      case AmenityCategory.other:
        return 'star';
    }
  }
}