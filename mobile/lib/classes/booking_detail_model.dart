// ============================================
// BOOKING DETAIL MODEL
// ============================================

import 'booking_model.dart';
import 'room_type_model.dart';

class BookingDetail {
  final String detailId;
  final String bookingId;
  final String roomTypeId;
  final int quantity;
  final double unitPrice;
  final double subtotal;
  final int guestsPerRoom;

  // Quan hệ với các model khác
  final Booking? booking;
  final RoomType? roomType;

  const BookingDetail({
    required this.detailId,
    required this.bookingId,
    required this.roomTypeId,
    required this.quantity,
    required this.unitPrice,
    required this.subtotal,
    this.guestsPerRoom = 1,
    this.booking,
    this.roomType,
  });

  factory BookingDetail.fromJson(Map<String, dynamic> json) {
    return BookingDetail(
      detailId: json['detail_id'] as String,
      bookingId: json['booking_id'] as String,
      roomTypeId: json['room_type_id'] as String,
      quantity: json['quantity'] as int,
      unitPrice: (json['unit_price'] as num).toDouble(),
      subtotal: (json['subtotal'] as num).toDouble(),
      guestsPerRoom: json['guests_per_room'] as int? ?? 1,
      booking: json['booking'] != null ? Booking.fromJson(json['booking']) : null,
      roomType: json['room_type'] != null ? RoomType.fromJson(json['room_type']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'detail_id': detailId,
      'booking_id': bookingId,
      'room_type_id': roomTypeId,
      'quantity': quantity,
      'unit_price': unitPrice,
      'subtotal': subtotal,
      'guests_per_room': guestsPerRoom,
      if (booking != null) 'booking': booking!.toJson(),
      if (roomType != null) 'room_type': roomType!.toJson(),
    };
  }

  BookingDetail copyWith({
    String? detailId,
    String? bookingId,
    String? roomTypeId,
    int? quantity,
    double? unitPrice,
    double? subtotal,
    int? guestsPerRoom,
    Booking? booking,
    RoomType? roomType,
  }) {
    return BookingDetail(
      detailId: detailId ?? this.detailId,
      bookingId: bookingId ?? this.bookingId,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      subtotal: subtotal ?? this.subtotal,
      guestsPerRoom: guestsPerRoom ?? this.guestsPerRoom,
      booking: booking ?? this.booking,
      roomType: roomType ?? this.roomType,
    );
  }

  /// Tính tổng giá trị (quantity * unitPrice)
  double get totalValue => quantity * unitPrice;

  /// Kiểm tra subtotal có khớp với tính toán không
  bool get isSubtotalValid => (subtotal - totalValue).abs() < 0.01;

  @override
  String toString() {
    return 'BookingDetail(detailId: $detailId, bookingId: $bookingId, roomTypeId: $roomTypeId, quantity: $quantity, unitPrice: $unitPrice, subtotal: $subtotal)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BookingDetail && other.detailId == detailId;
  }

  @override
  int get hashCode => detailId.hashCode;
}