// ============================================
// ROOM TYPE AVAILABILITY MODEL
// ============================================

class RoomTypeAvailability {
  final String? hotelId;
  final String? roomTypeId;
  final String roomTypeName;
  final int numberOfRooms;
  final int totalRoomsBooked;
  final int availableRooms;
  final int? maxOccupancy; // Thêm trường mới

  const RoomTypeAvailability({
    this.hotelId,
    this.roomTypeId,
    required this.roomTypeName,
    required this.numberOfRooms,
    required this.totalRoomsBooked,
    required this.availableRooms,
    this.maxOccupancy, // Thêm vào constructor
  });

  /// Tạo RoomTypeAvailability từ JSON
  factory RoomTypeAvailability.fromJson(Map<String, dynamic> json) {
    return RoomTypeAvailability(
      hotelId: json['hotelId'] ?? json['hotel_id'],
      roomTypeId: json['roomTypeId'] ?? json['room_type_id'],
      roomTypeName: json['roomTypeName'] ?? json['room_type_name'] ?? '',
      numberOfRooms: _parseToInt(json['numberOfRooms'] ?? json['number_of_rooms']),
      totalRoomsBooked: _parseToInt(json['totalRoomsBooked'] ?? json['total_rooms_booked']),
      availableRooms: _parseToInt(json['availableRooms'] ?? json['available_rooms']),
      maxOccupancy: _parseToInt(json['maxOccupancy'] ?? json['max_occupancy']), // Thêm parse
    );
  }

  /// Helper method để parse String thành int
  static int _parseToInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) {
      return int.tryParse(value) ?? 0;
    }
    if (value is double) return value.toInt();
    return 0;
  }

  /// Chuyển RoomTypeAvailability thành JSON
  Map<String, dynamic> toJson() {
    return {
      // Trả về cả 2 format để tương thích
      'hotelId': hotelId,
      'hotel_id': hotelId,
      'roomTypeId': roomTypeId,
      'room_type_id': roomTypeId,
      'roomTypeName': roomTypeName,
      'room_type_name': roomTypeName,
      'numberOfRooms': numberOfRooms,
      'number_of_rooms': numberOfRooms,
      'totalRoomsBooked': totalRoomsBooked,
      'total_rooms_booked': totalRoomsBooked,
      'availableRooms': availableRooms,
      'available_rooms': availableRooms,
      'maxOccupancy': maxOccupancy, // Thêm vào toJson
      'max_occupancy': maxOccupancy,
    };
  }

  /// Copy với giá trị mới
  RoomTypeAvailability copyWith({
    String? hotelId,
    String? roomTypeId,
    String? roomTypeName,
    int? numberOfRooms,
    int? totalRoomsBooked,
    int? availableRooms,
    int? maxOccupancy, // Thêm vào copyWith
  }) {
    return RoomTypeAvailability(
      hotelId: hotelId ?? this.hotelId,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      roomTypeName: roomTypeName ?? this.roomTypeName,
      numberOfRooms: numberOfRooms ?? this.numberOfRooms,
      totalRoomsBooked: totalRoomsBooked ?? this.totalRoomsBooked,
      availableRooms: availableRooms ?? this.availableRooms,
      maxOccupancy: maxOccupancy ?? this.maxOccupancy, // Thêm vào copyWith
    );
  }

  /// Kiểm tra phòng có còn trống không
  bool get hasAvailableRooms => availableRooms > 0;

  /// Tỷ lệ phòng đã đặt (%)
  double get occupancyRate {
    if (numberOfRooms == 0) return 0.0;
    return (totalRoomsBooked / numberOfRooms) * 100;
  }

  /// Tỷ lệ phòng còn trống (%)
  double get availabilityRate {
    if (numberOfRooms == 0) return 0.0;
    return (availableRooms / numberOfRooms) * 100;
  }

  /// Trạng thái availability dạng text
  String get availabilityStatus {
    if (availableRooms == 0) return 'Hết phòng';
    if (availableRooms <= 2) return 'Sắp hết';
    if (availableRooms <= numberOfRooms * 0.3) return 'Còn ít';
    return 'Còn nhiều';
  }

  /// Kiểm tra xem số khách có phù hợp với maxOccupancy không
  bool canAccommodateGuests(int guestCount) {
    if (maxOccupancy == null) return true; // Nếu không có limit thì OK
    return guestCount <= maxOccupancy!;
  }

  /// Lấy thông tin occupancy dạng text
  String get occupancyInfo {
    if (maxOccupancy == null || maxOccupancy == 0) return '';
    return 'Tối đa $maxOccupancy khách';
  }

  @override
  String toString() {
    return 'RoomTypeAvailability{roomTypeId: $roomTypeId, roomTypeName: $roomTypeName, numberOfRooms: $numberOfRooms, availableRooms: $availableRooms, maxOccupancy: $maxOccupancy}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is RoomTypeAvailability &&
        other.hotelId == hotelId &&
        other.roomTypeId == roomTypeId &&
        other.roomTypeName == roomTypeName &&
        other.numberOfRooms == numberOfRooms &&
        other.totalRoomsBooked == totalRoomsBooked &&
        other.availableRooms == availableRooms &&
        other.maxOccupancy == maxOccupancy; // Thêm vào comparison
  }

  @override
  int get hashCode {
    return Object.hash(
      hotelId,
      roomTypeId,
      roomTypeName,
      numberOfRooms,
      totalRoomsBooked,
      availableRooms,
      maxOccupancy, // Thêm vào hashCode
    );
  }
}