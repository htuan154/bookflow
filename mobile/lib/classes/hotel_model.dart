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
    required this.name, // Có thể cần đổi thành this.name,
    required this.address, // Có thể cần đổi thành this.address,
    this.description,
    required this.ownerId,
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
      hotelId:
          json['hotelId']
              as String, // API trả về 'hotelId', không phải 'hotel_id'
      ownerId:
          json['ownerId']
              as String, // API trả về 'ownerId', không phải 'owner_id'
      name: json['name'] ?? '',
      description: json['description'] as String?,
      address: json['address'] ?? '',
      city: json['city'] as String,
      starRating:
          json['starRating']
              as int?, // API trả về 'starRating', không phải 'star_rating'
      phoneNumber:
          json['phoneNumber']
              as String?, // API trả về 'phoneNumber', không phải 'phone_number'
      email: json['email'] as String?,
      checkInTime:
          json['checkInTime']
              as String?, // API trả về 'checkInTime', không phải 'check_in_time'
      checkOutTime:
          json['checkOutTime']
              as String?, // API trả về 'checkOutTime', không phải 'check_out_time'
      status: json['status'] as String? ?? 'pending',
      averageRating: _parseDouble(
        json['averageRating'],
      ), // API trả về string "0.00"
      totalReviews:
          json['totalReviews'] as int? ??
          0, // API trả về 'totalReviews', không phải 'total_reviews'
      createdAt: DateTime.parse(
        json['createdAt'] as String,
      ), // API trả về 'createdAt', không phải 'created_at'
      owner: json['owner'] != null ? User.fromJson(json['owner']) : null,
    );
  }

  // Helper method để parse double từ string hoặc number
  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    return 0.0;
  }

  // Chuyển đối tượng thành JSON (cần khớp với API)
  Map<String, dynamic> toJson() {
    return {
      'hotelId': hotelId, // Sửa từ 'hotel_id' thành 'hotelId'
      'ownerId': ownerId, // Sửa từ 'owner_id' thành 'ownerId'
      'name': name,
      'description': description,
      'address': address,
      'city': city,
      'starRating': starRating, // Sửa từ 'star_rating' thành 'starRating'
      'phoneNumber': phoneNumber, // Sửa từ 'phone_number' thành 'phoneNumber'
      'email': email,
      'checkInTime': checkInTime, // Sửa từ 'check_in_time' thành 'checkInTime'
      'checkOutTime':
          checkOutTime, // Sửa từ 'check_out_time' thành 'checkOutTime'
      'status': status,
      'averageRating':
          averageRating, // Sửa từ 'average_rating' thành 'averageRating'
      'totalReviews':
          totalReviews, // Sửa từ 'total_reviews' thành 'totalReviews'
      'createdAt': createdAt
          .toIso8601String(), // Sửa từ 'created_at' thành 'createdAt'
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
