// ============================================
// PROMOTION MODEL
// ============================================

import 'hotel_model.dart';
import 'user_model.dart';

enum PromotionStatus { pending, approved, rejected, active, inactive }
enum PromotionType { general, roomSpecific }

class Promotion {
  final String? promotionId;
  final String? hotelId;
  final String code;
  final String name;
  final String? description;
  final double discountValue;
  final double? minBookingPrice;
  final DateTime validFrom;
  final DateTime validUntil;
  final int? usageLimit;
  final int usedCount;
  final PromotionStatus status;
  final PromotionType promotionType;
  final String? createdBy;
  final DateTime? createdAt;
  
  // Quan hệ với Hotel - optional
  final Hotel? hotel;
  // Quan hệ với User (creator) - optional  
  final User? creator;

  const Promotion({
    this.promotionId,
    this.hotelId,
    required this.code,
    required this.name,
    this.description,
    required this.discountValue,
    this.minBookingPrice,
    required this.validFrom,
    required this.validUntil,
    this.usageLimit,
    this.usedCount = 0,
    this.status = PromotionStatus.active,
    this.promotionType = PromotionType.general,
    this.createdBy,
    this.createdAt,
    this.hotel,
    this.creator,
  });

  /// Tạo Promotion từ JSON
  factory Promotion.fromJson(Map<String, dynamic> json) {
    return Promotion(
      promotionId: json['promotion_id'] as String?,
      hotelId: json['hotel_id'] as String?,
      code: json['code'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      discountValue: (json['discount_value'] as num).toDouble(),
      minBookingPrice: json['min_booking_price'] != null ? (json['min_booking_price'] as num).toDouble() : null,
      validFrom: DateTime.parse(json['valid_from'] as String),
      validUntil: DateTime.parse(json['valid_until'] as String),
      usageLimit: json['usage_limit'] as int?,
      usedCount: json['used_count'] as int? ?? 0,
      status: _parseStatus(json['status'] as String?),
      promotionType: _parsePromotionType(json['promotion_type'] as String?),
      createdBy: json['created_by'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
      creator: json['creator'] != null ? User.fromJson(json['creator']) : null,
    );
  }

  /// Chuyển Promotion thành JSON
  Map<String, dynamic> toJson() {
    return {
      'promotion_id': promotionId,
      'hotel_id': hotelId,
      'code': code,
      'name': name,
      'description': description,
      'discount_value': discountValue,
      'min_booking_price': minBookingPrice,
      'valid_from': validFrom.toIso8601String(),
      'valid_until': validUntil.toIso8601String(),
      'usage_limit': usageLimit,
      'used_count': usedCount,
      'status': _statusToString(status),
      'promotion_type': _promotionTypeToString(promotionType),
      'created_by': createdBy,
      'created_at': createdAt?.toIso8601String(),
      if (hotel != null) 'hotel': hotel!.toJson(),
      if (creator != null) 'creator': creator!.toJson(),
    };
  }

  /// Parse status từ string
  static PromotionStatus _parseStatus(String? statusString) {
    switch (statusString?.toLowerCase()) {
      case 'pending':
        return PromotionStatus.pending;
      case 'approved':
        return PromotionStatus.approved;
      case 'rejected':
        return PromotionStatus.rejected;
      case 'active':
        return PromotionStatus.active;
      case 'inactive':
        return PromotionStatus.inactive;
      default:
        return PromotionStatus.active;
    }
  }

  /// Chuyển status thành string
  static String _statusToString(PromotionStatus status) {
    switch (status) {
      case PromotionStatus.pending:
        return 'pending';
      case PromotionStatus.approved:
        return 'approved';
      case PromotionStatus.rejected:
        return 'rejected';
      case PromotionStatus.active:
        return 'active';
      case PromotionStatus.inactive:
        return 'inactive';
    }
  }

  /// Parse promotion type từ string
  static PromotionType _parsePromotionType(String? typeString) {
    switch (typeString?.toLowerCase()) {
      case 'general':
        return PromotionType.general;
      case 'room_specific':
        return PromotionType.roomSpecific;
      default:
        return PromotionType.general;
    }
  }

  /// Chuyển promotion type thành string
  static String _promotionTypeToString(PromotionType type) {
    switch (type) {
      case PromotionType.general:
        return 'general';
      case PromotionType.roomSpecific:
        return 'room_specific';
    }
  }

  /// Kiểm tra promotion có hợp lệ không
  bool get isValid {
    final now = DateTime.now();
    return status == PromotionStatus.active &&
           !now.isBefore(validFrom) &&
           !now.isAfter(validUntil) &&
           (usageLimit == null || usedCount < usageLimit!);
  }

  /// Kiểm tra có thể áp dụng cho giá booking không
  bool canApplyToBooking(double bookingPrice) {
    return isValid && (minBookingPrice == null || bookingPrice >= minBookingPrice!);
  }

  /// Tính giá trị giảm giá
  double calculateDiscount(double bookingPrice) {
    if (!canApplyToBooking(bookingPrice)) return 0;
    
    // Chỉ áp dụng discount chung nếu là general promotion
    if (promotionType == PromotionType.general) {
      return bookingPrice * (discountValue / 100);
    }
    
    // Với room_specific promotion, cần sử dụng PromotionDetail để tính
    return 0;
  }

  /// Kiểm tra có phải promotion chung không
  bool get isGeneralPromotion => promotionType == PromotionType.general;

  /// Kiểm tra có phải promotion theo phòng không
  bool get isRoomSpecificPromotion => promotionType == PromotionType.roomSpecific;

  /// Kiểm tra có hết hạn không
  bool get isExpired {
    return DateTime.now().isAfter(validUntil);
  }

  /// Kiểm tra có đạt giới hạn sử dụng không
  bool get isUsageLimitReached {
    return usageLimit != null && usedCount >= usageLimit!;
  }

  /// Tính số ngày còn lại
  int get daysRemaining {
    if (isExpired) return 0;
    return validUntil.difference(DateTime.now()).inDays;
  }

  /// Copy với giá trị mới
  Promotion copyWith({
    String? promotionId,
    String? hotelId,
    String? code,
    String? name,
    String? description,
    double? discountValue,
    double? minBookingPrice,
    DateTime? validFrom,
    DateTime? validUntil,
    int? usageLimit,
    int? usedCount,
    PromotionStatus? status,
    PromotionType? promotionType,
    String? createdBy,
    DateTime? createdAt,
    Hotel? hotel,
    User? creator,
  }) {
    return Promotion(
      promotionId: promotionId ?? this.promotionId,
      hotelId: hotelId ?? this.hotelId,
      code: code ?? this.code,
      name: name ?? this.name,
      description: description ?? this.description,
      discountValue: discountValue ?? this.discountValue,
      minBookingPrice: minBookingPrice ?? this.minBookingPrice,
      validFrom: validFrom ?? this.validFrom,
      validUntil: validUntil ?? this.validUntil,
      usageLimit: usageLimit ?? this.usageLimit,
      usedCount: usedCount ?? this.usedCount,
      status: status ?? this.status,
      promotionType: promotionType ?? this.promotionType,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      hotel: hotel ?? this.hotel,
      creator: creator ?? this.creator,
    );
  }

  @override
  String toString() {
    return 'Promotion{promotionId: $promotionId, code: $code, name: $name, discountValue: $discountValue%, type: ${_promotionTypeToString(promotionType)}, status: ${_statusToString(status)}}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Promotion &&
        other.promotionId == promotionId &&
        other.hotelId == hotelId &&
        other.code == code &&
        other.name == name &&
        other.description == description &&
        other.discountValue == discountValue &&
        other.minBookingPrice == minBookingPrice &&
        other.validFrom == validFrom &&
        other.validUntil == validUntil &&
        other.usageLimit == usageLimit &&
        other.usedCount == usedCount &&
        other.status == status &&
        other.promotionType == promotionType &&
        other.createdBy == createdBy &&
        other.createdAt == createdAt &&
        other.hotel == hotel &&
        other.creator == creator;
  }

  @override
  int get hashCode {
    return Object.hash(
      promotionId,
      hotelId,
      code,
      name,
      description,
      discountValue,
      minBookingPrice,
      validFrom,
      validUntil,
      usageLimit,
      usedCount,
      status,
      promotionType,
      createdBy,
      createdAt,
      hotel,
      creator,
    );
  }
}