// ============================================
// HOTEL AMENITY MODEL (Many-to-Many Relationship)
// ============================================

import 'dart:convert';
import 'hotel_model.dart';
import 'amenity_model.dart';

class HotelAmenity {
  final String hotelId;
  final String amenityId;

  // Quan hệ với Hotel và Amenity (optional)
  final Hotel? hotel;
  final Amenity? amenity;

  HotelAmenity({
    required this.hotelId,
    required this.amenityId,
    this.hotel,
    this.amenity,
  });

  // Factory constructor từ JSON
  factory HotelAmenity.fromJson(Map<String, dynamic> json) {
    return HotelAmenity(
      hotelId: json['hotel_id'] as String,
      amenityId: json['amenity_id'] as String,
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
      amenity: json['amenity'] != null ? Amenity.fromJson(json['amenity']) : null,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'hotel_id': hotelId,
      'amenity_id': amenityId,
      if (hotel != null) 'hotel': hotel!.toJson(),
      if (amenity != null) 'amenity': amenity!.toJson(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory HotelAmenity.fromJsonString(String jsonString) {
    return HotelAmenity.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  HotelAmenity copyWith({
    String? hotelId,
    String? amenityId,
    Hotel? hotel,
    Amenity? amenity,
  }) {
    return HotelAmenity(
      hotelId: hotelId ?? this.hotelId,
      amenityId: amenityId ?? this.amenityId,
      hotel: hotel ?? this.hotel,
      amenity: amenity ?? this.amenity,
    );
  }

  // Helper methods
  String get hotelName => hotel?.name ?? 'Unknown Hotel';
  String get amenityName => amenity?.name ?? 'Unknown Amenity';
  String get amenityDescription => amenity?.description ?? 'No description';
  bool get hasAmenityIcon => amenity?.hasIcon ?? false;
  String? get amenityIconUrl => amenity?.iconUrl;

  @override
  String toString() {
    return 'HotelAmenity(hotelId: $hotelId, amenityId: $amenityId, hotelName: $hotelName, amenityName: $amenityName)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is HotelAmenity && 
           other.hotelId == hotelId && 
           other.amenityId == amenityId;
  }

  @override
  int get hashCode => hotelId.hashCode ^ amenityId.hashCode;
}

// ============================================
// HELPER CLASS FOR HOTEL WITH AMENITIES
// ============================================
class HotelWithAmenities {
  final Hotel hotel;
  final List<Amenity> amenities;

  HotelWithAmenities({
    required this.hotel,
    required this.amenities,
  });

  // Factory constructor từ JSON
  factory HotelWithAmenities.fromJson(Map<String, dynamic> json) {
    return HotelWithAmenities(
      hotel: Hotel.fromJson(json['hotel']),
      amenities: (json['amenities'] as List<dynamic>)
          .map((amenityJson) => Amenity.fromJson(amenityJson))
          .toList(),
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'hotel': hotel.toJson(),
      'amenities': amenities.map((amenity) => amenity.toJson()).toList(),
    };
  }

  // Helper methods
  bool hasAmenity(String amenityName) {
    return amenities.any((amenity) => 
        amenity.name.toLowerCase().contains(amenityName.toLowerCase()));
  }

  List<Amenity> getAmenitiesByCategory(AmenityCategory category) {
    return amenities.where((amenity) => amenity.category == category).toList();
  }

  Map<AmenityCategory, List<Amenity>> get amenitiesByCategory {
    final Map<AmenityCategory, List<Amenity>> result = {};
    
    for (final amenity in amenities) {
      final category = amenity.category;
      result[category] = result[category] ?? [];
      result[category]!.add(amenity);
    }
    
    return result;
  }

  int get totalAmenities => amenities.length;

  List<String> get amenityNames => 
      amenities.map((amenity) => amenity.name).toList();

  @override
  String toString() {
    return 'HotelWithAmenities(hotel: ${hotel.name}, totalAmenities: $totalAmenities)';
  }
}