// ============================================
// REVIEW MODEL
// ============================================

import 'user_model.dart';
import 'hotel_model.dart';
import 'booking_model.dart';

class Review {
  final String reviewId;
  final String userId;
  final String hotelId;
  final String? bookingId;
  final int? rating;
  final String? comment;
  final int? cleanlinessRating;
  final int? comfortRating;
  final int? serviceRating;
  final int? locationRating;
  final int? valueRating;
  final DateTime createdAt;
  final String? username; // Thêm trường này

  // Quan hệ với các model khác
  final User? user;
  final Hotel? hotel;
  final Booking? booking;

  const Review({
    required this.reviewId,
    required this.userId,
    required this.hotelId,
    this.bookingId,
    this.rating,
    this.comment,
    this.cleanlinessRating,
    this.comfortRating,
    this.serviceRating,
    this.locationRating,
    this.valueRating,
    required this.createdAt,
    this.username, // Thêm parameter này
    this.user,
    this.hotel,
    this.booking,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      reviewId: json['reviewId'] as String,
      userId: json['userId'] as String,
      hotelId: json['hotelId'] as String,
      bookingId: json['bookingId'] as String?,
      rating: json['rating'] as int?,
      comment: json['comment'] as String?,
      cleanlinessRating: json['cleanlinessRating'] as int?,
      comfortRating: json['comfortRating'] as int?,
      serviceRating: json['serviceRating'] as int?,
      locationRating: json['locationRating'] as int?,
      valueRating: json['valueRating'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      username: json['username'] as String?, // Thêm dòng này
      // Nếu API trả về user/hotel/booking thì parse tiếp, còn không thì để null
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
      booking: json['booking'] != null
          ? Booking.fromJson(json['booking'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'reviewId': reviewId,
      'userId': userId,
      'hotelId': hotelId,
      'bookingId': bookingId,
      'rating': rating,
      'comment': comment,
      'cleanlinessRating': cleanlinessRating,
      'comfortRating': comfortRating,
      'serviceRating': serviceRating,
      'locationRating': locationRating,
      'valueRating': valueRating,
      'createdAt': createdAt.toIso8601String(),
      'username': username, // Thêm dòng này
      if (user != null) 'user': user!.toJson(),
      if (hotel != null) 'hotel': hotel!.toJson(),
      if (booking != null) 'booking': booking!.toJson(),
    };
  }

  Review copyWith({
    String? reviewId,
    String? userId,
    String? hotelId,
    String? bookingId,
    int? rating,
    String? comment,
    int? cleanlinessRating,
    int? comfortRating,
    int? serviceRating,
    int? locationRating,
    int? valueRating,
    DateTime? createdAt,
    String? username, // Thêm parameter này
    User? user,
    Hotel? hotel,
    Booking? booking,
  }) {
    return Review(
      reviewId: reviewId ?? this.reviewId,
      userId: userId ?? this.userId,
      hotelId: hotelId ?? this.hotelId,
      bookingId: bookingId ?? this.bookingId,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      cleanlinessRating: cleanlinessRating ?? this.cleanlinessRating,
      comfortRating: comfortRating ?? this.comfortRating,
      serviceRating: serviceRating ?? this.serviceRating,
      locationRating: locationRating ?? this.locationRating,
      valueRating: valueRating ?? this.valueRating,
      createdAt: createdAt ?? this.createdAt,
      username: username ?? this.username, // Thêm dòng này
      user: user ?? this.user,
      hotel: hotel ?? this.hotel,
      booking: booking ?? this.booking,
    );
  }

  /// Lấy tên người đánh giá (ưu tiên username, sau đó user.fullName)
  String get reviewerName => (username != null && username!.isNotEmpty)
      ? username!
      : (user?.fullName ?? 'Ẩn danh');

  /// Tính điểm trung bình của tất cả các rating
  double? get averageRating {
    final ratings = [
      rating,
      cleanlinessRating,
      comfortRating,
      serviceRating,
      locationRating,
      valueRating,
    ].where((r) => r != null).cast<int>();

    if (ratings.isEmpty) return null;

    return ratings.reduce((a, b) => a + b) / ratings.length;
  }

  /// Kiểm tra review có hợp lệ không
  bool get isValid {
    return rating != null && rating! >= 1 && rating! <= 5;
  }

  @override
  String toString() {
    return 'Review(reviewId: $reviewId, userId: $userId, hotelId: $hotelId, rating: $rating, username: $username, comment: ${comment?.substring(0, comment!.length > 50 ? 50 : comment!.length)}...)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Review && other.reviewId == reviewId;
  }

  @override
  int get hashCode => reviewId.hashCode;
}
