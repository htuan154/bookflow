// ============================================
// ROOM TYPE MODEL
// ============================================

import 'hotel_model.dart';

class RoomType {
  final String? roomTypeId;
  final String hotelId;
  final String name;
  final String? description;
  final int maxOccupancy;
  final double basePrice;
  final int numberOfRooms;
  final String? bedType;
  final double? areaSqm;
  final DateTime? createdAt;
  
  // Quan hệ với Hotel - optional
  final Hotel? hotel;

  const RoomType({
    this.roomTypeId,
    required this.hotelId,
    required this.name,
    this.description,
    required this.maxOccupancy,
    required this.basePrice,
    required this.numberOfRooms,
    this.bedType,
    this.areaSqm,
    this.createdAt,
    this.hotel,
  });

  /// Tạo RoomType từ JSON
  factory RoomType.fromJson(Map<String, dynamic> json) {
    return RoomType(
      roomTypeId: json['room_type_id'] as String?,
      hotelId: json['hotel_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      maxOccupancy: json['max_occupancy'] as int,
      basePrice: (json['base_price'] as num).toDouble(),
      numberOfRooms: json['number_of_rooms'] as int,
      bedType: json['bed_type'] as String?,
      areaSqm: json['area_sqm'] != null ? (json['area_sqm'] as num).toDouble() : null,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
    );
  }

  /// Chuyển RoomType thành JSON
  Map<String, dynamic> toJson() {
    return {
      'room_type_id': roomTypeId,
      'hotel_id': hotelId,
      'name': name,
      'description': description,
      'max_occupancy': maxOccupancy,
      'base_price': basePrice,
      'number_of_rooms': numberOfRooms,
      'bed_type': bedType,
      'area_sqm': areaSqm,
      'created_at': createdAt?.toIso8601String(),
      if (hotel != null) 'hotel': hotel!.toJson(),
    };
  }

  /// Copy với giá trị mới
  RoomType copyWith({
    String? roomTypeId,
    String? hotelId,
    String? name,
    String? description,
    int? maxOccupancy,
    double? basePrice,
    int? numberOfRooms,
    String? bedType,
    double? areaSqm,
    DateTime? createdAt,
    Hotel? hotel,
  }) {
    return RoomType(
      roomTypeId: roomTypeId ?? this.roomTypeId,
      hotelId: hotelId ?? this.hotelId,
      name: name ?? this.name,
      description: description ?? this.description,
      maxOccupancy: maxOccupancy ?? this.maxOccupancy,
      basePrice: basePrice ?? this.basePrice,
      numberOfRooms: numberOfRooms ?? this.numberOfRooms,
      bedType: bedType ?? this.bedType,
      areaSqm: areaSqm ?? this.areaSqm,
      createdAt: createdAt ?? this.createdAt,
      hotel: hotel ?? this.hotel,
    );
  }

  @override
  String toString() {
    return 'RoomType{roomTypeId: $roomTypeId, hotelId: $hotelId, name: $name, maxOccupancy: $maxOccupancy, basePrice: $basePrice}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is RoomType &&
        other.roomTypeId == roomTypeId &&
        other.hotelId == hotelId &&
        other.name == name &&
        other.description == description &&
        other.maxOccupancy == maxOccupancy &&
        other.basePrice == basePrice &&
        other.numberOfRooms == numberOfRooms &&
        other.bedType == bedType &&
        other.areaSqm == areaSqm &&
        other.createdAt == createdAt &&
        other.hotel == hotel;
  }

  @override
  int get hashCode {
    return Object.hash(
      roomTypeId,
      hotelId,
      name,
      description,
      maxOccupancy,
      basePrice,
      numberOfRooms,
      bedType,
      areaSqm,
      createdAt,
    );
  }
}