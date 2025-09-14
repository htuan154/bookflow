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
      roomTypeId: json['roomTypeId'] ?? json['room_type_id'] ?? '',
      hotelId: json['hotelId'] ?? json['hotel_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      // Sửa lỗi parse basePrice từ String
      basePrice: json['basePrice'] != null 
          ? double.tryParse(json['basePrice'].toString()) ?? 0.0
          : (json['base_price'] != null 
              ? double.tryParse(json['base_price'].toString()) ?? 0.0 
              : 0.0),
      maxOccupancy: json['maxOccupancy'] ?? json['max_occupancy'] ?? 1,
      numberOfRooms: json['numberOfRooms'] ?? json['number_of_rooms'] ?? 1,
      // Sửa lỗi parse areaSqm từ String
      areaSqm: json['areaSqm'] != null 
          ? double.tryParse(json['areaSqm'].toString())
          : (json['area_sqm'] != null 
              ? double.tryParse(json['area_sqm'].toString()) 
              : null),
      bedType: json['bedType'] ?? json['bed_type'],
      createdAt: DateTime.parse(json['createdAt'] ?? json['created_at'] ?? DateTime.now().toIso8601String()),
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
    );
  }

  /// Chuyển RoomType thành JSON
  Map<String, dynamic> toJson() {
    return {
      // Trả về cả 2 format để tương thích
      'roomTypeId': roomTypeId,
      'room_type_id': roomTypeId,
      'hotelId': hotelId,
      'hotel_id': hotelId,
      'name': name,
      'description': description,
      'maxOccupancy': maxOccupancy,
      'max_occupancy': maxOccupancy,
      'basePrice': basePrice,
      'base_price': basePrice,
      'numberOfRooms': numberOfRooms,
      'number_of_rooms': numberOfRooms,
      'bedType': bedType,
      'bed_type': bedType,
      'areaSqm': areaSqm,
      'area_sqm': areaSqm,
      'createdAt': createdAt?.toIso8601String(),
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