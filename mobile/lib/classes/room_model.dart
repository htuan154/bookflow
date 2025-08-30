// ============================================
// ROOM MODEL
// ============================================

import 'dart:convert';
import 'room_type_model.dart';

class Room {
  final String roomId;
  final String roomTypeId;
  final String roomNumber;
  final int? floorNumber;
  final String status;
  final DateTime createdAt;

  // Quan hệ với RoomType (optional) - sẽ được import sau khi có room_type_model
  final RoomType? roomType;

  Room({
    required this.roomId,
    required this.roomTypeId,
    required this.roomNumber,
    this.floorNumber,
    this.status = 'available',
    required this.createdAt,
    this.roomType,
  });

  // Factory constructor từ JSON
  factory Room.fromJson(Map<String, dynamic> json) {
    return Room(
      roomId: json['room_id'] as String,
      roomTypeId: json['room_type_id'] as String,
      roomNumber: json['room_number'] as String,
      floorNumber: json['floor_number'] as int?,
      status: json['status'] as String? ?? 'available',
      createdAt: DateTime.parse(json['created_at'] as String),
      roomType: json['room_type'] != null ? RoomType.fromJson(json['room_type']) : null,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'room_id': roomId,
      'room_type_id': roomTypeId,
      'room_number': roomNumber,
      'floor_number': floorNumber,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      // Sửa key từ 'room_type' thành 'roomType'
      if (roomType != null) 'roomType': roomType!.toJson(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory Room.fromJsonString(String jsonString) {
    return Room.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  Room copyWith({
    String? roomId,
    String? roomTypeId,
    String? roomNumber,
    int? floorNumber,
    String? status,
    DateTime? createdAt,
    RoomType? roomType,
  }) {
    return Room(
      roomId: roomId ?? this.roomId,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      roomNumber: roomNumber ?? this.roomNumber,
      floorNumber: floorNumber ?? this.floorNumber,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      roomType: roomType ?? this.roomType,
    );
  }

  // Helper methods để kiểm tra status
  bool get isAvailable => status == 'available';
  bool get isOccupied => status == 'occupied';
  bool get isMaintenance => status == 'maintenance';
  bool get isOutOfOrder => status == 'out_of_order';
  bool get isCleaning => status == 'cleaning';

  // Kiểm tra phòng có thể đặt được không
  bool get isBookable => isAvailable;

  // Kiểm tra phòng có đang sử dụng không
  bool get isInUse => isOccupied;

  // Kiểm tra phòng có cần bảo trì không
  bool get needsMaintenance => isMaintenance || isOutOfOrder;

  // Lấy display name cho phòng
  String get displayName {
    if (floorNumber != null) {
      return 'Room $roomNumber (Floor $floorNumber)';
    }
    return 'Room $roomNumber';
  }

  // Lấy mã định danh ngắn
  String get shortId => roomNumber;

  // Lấy màu sắc status cho UI
  String get statusColor {
    switch (status) {
      case 'available':
        return '#4CAF50'; // Green
      case 'occupied':
        return '#F44336'; // Red
      case 'maintenance':
        return '#FF9800'; // Orange
      case 'out_of_order':
        return '#9C27B0'; // Purple
      case 'cleaning':
        return '#2196F3'; // Blue
      default:
        return '#9E9E9E'; // Grey
    }
  }

  // Lấy icon status cho UI
  String get statusIcon {
    switch (status) {
      case 'available':
        return 'check_circle';
      case 'occupied':
        return 'person';
      case 'maintenance':
        return 'build';
      case 'out_of_order':
        return 'error';
      case 'cleaning':
        return 'cleaning_services';
      default:
        return 'help';
    }
  }

  @override
  String toString() {
    return 'Room(roomId: $roomId, roomNumber: $roomNumber, floorNumber: $floorNumber, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Room && other.roomId == roomId;
  }

  @override
  int get hashCode => roomId.hashCode;
}

// ============================================
// ENUM DEFINITIONS
// ============================================
enum RoomStatus { available, occupied, maintenance, outOfOrder, cleaning }

extension RoomStatusExtension on RoomStatus {
  String get value {
    switch (this) {
      case RoomStatus.available:
        return 'available';
      case RoomStatus.occupied:
        return 'occupied';
      case RoomStatus.maintenance:
        return 'maintenance';
      case RoomStatus.outOfOrder:
        return 'out_of_order';
      case RoomStatus.cleaning:
        return 'cleaning';
    }
  }

  static RoomStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'available':
        return RoomStatus.available;
      case 'occupied':
        return RoomStatus.occupied;
      case 'maintenance':
        return RoomStatus.maintenance;
      case 'out_of_order':
        return RoomStatus.outOfOrder;
      case 'cleaning':
        return RoomStatus.cleaning;
      default:
        throw ArgumentError('Invalid room status: $value');
    }
  }

  String get displayName {
    switch (this) {
      case RoomStatus.available:
        return 'Available';
      case RoomStatus.occupied:
        return 'Occupied';
      case RoomStatus.maintenance:
        return 'Under Maintenance';
      case RoomStatus.outOfOrder:
        return 'Out of Order';
      case RoomStatus.cleaning:
        return 'Being Cleaned';
    }
  }

  String get description {
    switch (this) {
      case RoomStatus.available:
        return 'Room is ready for booking';
      case RoomStatus.occupied:
        return 'Room is currently occupied by guests';
      case RoomStatus.maintenance:
        return 'Room is under maintenance';
      case RoomStatus.outOfOrder:
        return 'Room is out of order and cannot be used';
      case RoomStatus.cleaning:
        return 'Room is being cleaned';
    }
  }
}

// ============================================
// HELPER CLASS FOR ROOM STATISTICS
// ============================================
class RoomStatusSummary {
  final int totalRooms;
  final int availableRooms;
  final int occupiedRooms;
  final int maintenanceRooms;
  final int outOfOrderRooms;
  final int cleaningRooms;

  RoomStatusSummary({
    required this.totalRooms,
    required this.availableRooms,
    required this.occupiedRooms,
    required this.maintenanceRooms,
    required this.outOfOrderRooms,
    required this.cleaningRooms,
  });

  factory RoomStatusSummary.fromRooms(List<Room> rooms) {
    return RoomStatusSummary(
      totalRooms: rooms.length,
      availableRooms: rooms.where((r) => r.isAvailable).length,
      occupiedRooms: rooms.where((r) => r.isOccupied).length,
      maintenanceRooms: rooms.where((r) => r.isMaintenance).length,
      outOfOrderRooms: rooms.where((r) => r.isOutOfOrder).length,
      cleaningRooms: rooms.where((r) => r.isCleaning).length,
    );
  }

  double get occupancyRate {
    if (totalRooms == 0) return 0.0;
    return (occupiedRooms / totalRooms) * 100;
  }

  double get availabilityRate {
    if (totalRooms == 0) return 0.0;
    return (availableRooms / totalRooms) * 100;
  }

  int get bookableRooms => availableRooms;

  int get unavailableRooms => totalRooms - availableRooms;

  Map<String, int> get statusBreakdown => {
    'available': availableRooms,
    'occupied': occupiedRooms,
    'maintenance': maintenanceRooms,
    'out_of_order': outOfOrderRooms,
    'cleaning': cleaningRooms,
  };

  @override
  String toString() {
    return 'RoomStatusSummary(total: $totalRooms, available: $availableRooms, occupied: $occupiedRooms, occupancy: ${occupancyRate.toStringAsFixed(1)}%)';
  }
}