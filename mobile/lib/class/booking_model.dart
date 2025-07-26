// ============================================
// BOOKING MODEL
// ============================================

import 'user_model.dart';
import 'hotel_model.dart';
import 'promotion_model.dart';

class Booking {
  final String bookingId;
  final String userId;
  final String hotelId;
  final DateTime checkInDate;
  final DateTime checkOutDate;
  final int nights;
  final DateTime? actualCheckInDate;
  final DateTime? actualCheckOutDate;
  final int totalGuests;
  final double totalPrice;
  final BookingStatus bookingStatus;
  final PaymentStatus paymentStatus;
  final String? paymentMethod;
  final String? promotionId;
  final String? specialRequests;
  final DateTime bookedAt;
  final DateTime lastUpdatedAt;

  // Quan hệ với các model khác
  final User? user;
  final Hotel? hotel;
  final Promotion? promotion;

  const Booking({
    required this.bookingId,
    required this.userId,
    required this.hotelId,
    required this.checkInDate,
    required this.checkOutDate,
    required this.nights,
    this.actualCheckInDate,
    this.actualCheckOutDate,
    required this.totalGuests,
    required this.totalPrice,
    this.bookingStatus = BookingStatus.pending,
    this.paymentStatus = PaymentStatus.pending,
    this.paymentMethod,
    this.promotionId,
    this.specialRequests,
    required this.bookedAt,
    required this.lastUpdatedAt,
    this.user,
    this.hotel,
    this.promotion,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      bookingId: json['booking_id'] as String,
      userId: json['user_id'] as String,
      hotelId: json['hotel_id'] as String,
      checkInDate: DateTime.parse(json['check_in_date'] as String),
      checkOutDate: DateTime.parse(json['check_out_date'] as String),
      nights: json['nights'] as int,
      actualCheckInDate: json['actual_check_in_date'] != null
          ? DateTime.parse(json['actual_check_in_date'] as String)
          : null,
      actualCheckOutDate: json['actual_check_out_date'] != null
          ? DateTime.parse(json['actual_check_out_date'] as String)
          : null,
      totalGuests: json['total_guests'] as int,
      totalPrice: (json['total_price'] as num).toDouble(),
      bookingStatus: BookingStatus.fromString(json['booking_status'] as String),
      paymentStatus: PaymentStatus.fromString(json['payment_status'] as String),
      paymentMethod: json['payment_method'] as String?,
      promotionId: json['promotion_id'] as String?,
      specialRequests: json['special_requests'] as String?,
      bookedAt: DateTime.parse(json['booked_at'] as String),
      lastUpdatedAt: DateTime.parse(json['last_updated_at'] as String),
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
      promotion: json['promotion'] != null ? Promotion.fromJson(json['promotion']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'booking_id': bookingId,
      'user_id': userId,
      'hotel_id': hotelId,
      'check_in_date': checkInDate.toIso8601String().split('T')[0],
      'check_out_date': checkOutDate.toIso8601String().split('T')[0],
      'nights': nights,
      'actual_check_in_date': actualCheckInDate?.toIso8601String(),
      'actual_check_out_date': actualCheckOutDate?.toIso8601String(),
      'total_guests': totalGuests,
      'total_price': totalPrice,
      'booking_status': bookingStatus.value,
      'payment_status': paymentStatus.value,
      'payment_method': paymentMethod,
      'promotion_id': promotionId,
      'special_requests': specialRequests,
      'booked_at': bookedAt.toIso8601String(),
      'last_updated_at': lastUpdatedAt.toIso8601String(),
      if (user != null) 'user': user!.toJson(),
      if (hotel != null) 'hotel': hotel!.toJson(),
      if (promotion != null) 'promotion': promotion!.toJson(),
    };
  }

  Booking copyWith({
    String? bookingId,
    String? userId,
    String? hotelId,
    DateTime? checkInDate,
    DateTime? checkOutDate,
    int? nights,
    DateTime? actualCheckInDate,
    DateTime? actualCheckOutDate,
    int? totalGuests,
    double? totalPrice,
    BookingStatus? bookingStatus,
    PaymentStatus? paymentStatus,
    String? paymentMethod,
    String? promotionId,
    String? specialRequests,
    DateTime? bookedAt,
    DateTime? lastUpdatedAt,
    User? user,
    Hotel? hotel,
    Promotion? promotion,
  }) {
    return Booking(
      bookingId: bookingId ?? this.bookingId,
      userId: userId ?? this.userId,
      hotelId: hotelId ?? this.hotelId,
      checkInDate: checkInDate ?? this.checkInDate,
      checkOutDate: checkOutDate ?? this.checkOutDate,
      nights: nights ?? this.nights,
      actualCheckInDate: actualCheckInDate ?? this.actualCheckInDate,
      actualCheckOutDate: actualCheckOutDate ?? this.actualCheckOutDate,
      totalGuests: totalGuests ?? this.totalGuests,
      totalPrice: totalPrice ?? this.totalPrice,
      bookingStatus: bookingStatus ?? this.bookingStatus,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      promotionId: promotionId ?? this.promotionId,
      specialRequests: specialRequests ?? this.specialRequests,
      bookedAt: bookedAt ?? this.bookedAt,
      lastUpdatedAt: lastUpdatedAt ?? this.lastUpdatedAt,
      user: user ?? this.user,
      hotel: hotel ?? this.hotel,
      promotion: promotion ?? this.promotion,
    );
  }

  @override
  String toString() {
    return 'Booking(bookingId: $bookingId, userId: $userId, hotelId: $hotelId, checkInDate: $checkInDate, checkOutDate: $checkOutDate, totalPrice: $totalPrice, bookingStatus: $bookingStatus)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Booking && other.bookingId == bookingId;
  }

  @override
  int get hashCode => bookingId.hashCode;
}

enum BookingStatus {
  pending('pending'),
  confirmed('confirmed'),
  canceled('canceled'),
  completed('completed'),
  noShow('no_show');

  const BookingStatus(this.value);
  final String value;

  static BookingStatus fromString(String value) {
    return BookingStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => BookingStatus.pending,
    );
  }

  @override
  String toString() => value;
}

enum PaymentStatus {
  pending('pending'),
  paid('paid'),
  refunded('refunded'),
  failed('failed');

  const PaymentStatus(this.value);
  final String value;

  static PaymentStatus fromString(String value) {
    return PaymentStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => PaymentStatus.pending,
    );
  }

  @override
  String toString() => value;
}