// ============================================
// HOTEL MODEL
// ============================================

import 'dart:convert';
import 'user_model.dart';
import 'time_of_day.dart';

class Hotel {
  final String hotelId;
  final String ownerId;
  final String name;
  final String? description;
  final String address;
  final String city;
  final int? starRating;
  final String? phoneNumber;
  final String? email;
  final String? checkInTime; 
  final String? checkOutTime; 
  final String status;
  final double averageRating;
  final int totalReviews;
  final DateTime createdAt;
  
  // Quan hệ với User (owner) - optional
  final User? owner;

  Hotel({
    required this.hotelId,
    required this.ownerId,
    required this.name,
    this.description,
    required this.address,
    required this.city,
    this.starRating,
    this.phoneNumber,
    this.email,
    this.checkInTime,
    this.checkOutTime,
    this.status = 'pending',
    this.averageRating = 0.0,
    this.totalReviews = 0,
    required this.createdAt,
    this.owner,
  });

  // Factory constructor từ JSON
  factory Hotel.fromJson(Map<String, dynamic> json) {
    return Hotel(
      hotelId: json['hotel_id'] as String,
      ownerId: json['owner_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      address: json['address'] as String,
      city: json['city'] as String,
      starRating: json['star_rating'] as int?,
      phoneNumber: json['phone_number'] as String?,
      email: json['email'] as String?,
      checkInTime: json['check_in_time'] as String?,
      checkOutTime: json['check_out_time'] as String?,
      status: json['status'] as String? ?? 'pending',
      averageRating: (json['average_rating'] as num?)?.toDouble() ?? 0.0,
      totalReviews: json['total_reviews'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      owner: json['owner'] != null ? User.fromJson(json['owner']) : null,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'hotel_id': hotelId,
      'owner_id': ownerId,
      'name': name,
      'description': description,
      'address': address,
      'city': city,
      'star_rating': starRating,
      'phone_number': phoneNumber,
      'email': email,
      'check_in_time': checkInTime,
      'check_out_time': checkOutTime,
      'status': status,
      'average_rating': averageRating,
      'total_reviews': totalReviews,
      'created_at': createdAt.toIso8601String(),
      if (owner != null) 'owner': owner!.toJson(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory Hotel.fromJsonString(String jsonString) {
    return Hotel.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  Hotel copyWith({
    String? hotelId,
    String? ownerId,
    String? name,
    String? description,
    String? address,
    String? city,
    int? starRating,
    String? phoneNumber,
    String? email,
    String? checkInTime,
    String? checkOutTime,
    String? status,
    double? averageRating,
    int? totalReviews,
    DateTime? createdAt,
    User? owner,
  }) {
    return Hotel(
      hotelId: hotelId ?? this.hotelId,
      ownerId: ownerId ?? this.ownerId,
      name: name ?? this.name,
      description: description ?? this.description,
      address: address ?? this.address,
      city: city ?? this.city,
      starRating: starRating ?? this.starRating,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      checkInTime: checkInTime ?? this.checkInTime,
      checkOutTime: checkOutTime ?? this.checkOutTime,
      status: status ?? this.status,
      averageRating: averageRating ?? this.averageRating,
      totalReviews: totalReviews ?? this.totalReviews,
      createdAt: createdAt ?? this.createdAt,
      owner: owner ?? this.owner,
    );
  }

  // Getter methods để chuyển đổi time strings thành TimeOfDay nếu cần
  TimeOfDay? get checkInTimeOfDay {
    if (checkInTime == null) return null;
    final parts = checkInTime!.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  TimeOfDay? get checkOutTimeOfDay {
    if (checkOutTime == null) return null;
    final parts = checkOutTime!.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  // Helper method để kiểm tra status
  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isActive => status == 'active';
  bool get isInactive => status == 'inactive';
  bool get isRejected => status == 'rejected';

  @override
  String toString() {
    return 'Hotel(hotelId: $hotelId, name: $name, city: $city, status: $status, averageRating: $averageRating)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Hotel && other.hotelId == hotelId;
  }

  @override
  int get hashCode => hotelId.hashCode;
}

// ============================================
// ENUM DEFINITIONS
// ============================================
enum HotelStatus { pending, approved, rejected, active, inactive }

extension HotelStatusExtension on HotelStatus {
  String get value {
    switch (this) {
      case HotelStatus.pending:
        return 'pending';
      case HotelStatus.approved:
        return 'approved';
      case HotelStatus.rejected:
        return 'rejected';
      case HotelStatus.active:
        return 'active';
      case HotelStatus.inactive:
        return 'inactive';
    }
  }

  static HotelStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return HotelStatus.pending;
      case 'approved':
        return HotelStatus.approved;
      case 'rejected':
        return HotelStatus.rejected;
      case 'active':
        return HotelStatus.active;
      case 'inactive':
        return HotelStatus.inactive;
      default:
        throw ArgumentError('Invalid hotel status: $value');
    }
  }
}