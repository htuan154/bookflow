// ============================================
// PROMOTION DETAIL MODEL
// ============================================

import 'promotion_model.dart';
import 'room_type_model.dart';

enum DiscountType { percentage, fixedAmount }

class PromotionDetail {
  final String? detailId;
  final String promotionId;
  final String roomTypeId;
  final DiscountType discountType;
  final double discountValue;
  final DateTime? createdAt;
  
  // Quan hệ với các model khác - optional
  final Promotion? promotion;
  final RoomType? roomType;

  const PromotionDetail({
    this.detailId,
    required this.promotionId,
    required this.roomTypeId,
    required this.discountType,
    required this.discountValue,
    this.createdAt,
    this.promotion,
    this.roomType,
  });

  /// Tạo PromotionDetail từ JSON
  factory PromotionDetail.fromJson(Map<String, dynamic> json) {
    return PromotionDetail(
      detailId: json['detail_id'] as String?,
      promotionId: json['promotion_id'] as String,
      roomTypeId: json['room_type_id'] as String,
      discountType: _parseDiscountType(json['discount_type'] as String),
      discountValue: (json['discount_value'] as num).toDouble(),
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
      promotion: json['promotion'] != null ? Promotion.fromJson(json['promotion']) : null,
      roomType: json['room_type'] != null ? RoomType.fromJson(json['room_type']) : null,
    );
  }

  /// Chuyển PromotionDetail thành JSON
  Map<String, dynamic> toJson() {
    return {
      'detail_id': detailId,
      'promotion_id': promotionId,
      'room_type_id': roomTypeId,
      'discount_type': _discountTypeToString(discountType),
      'discount_value': discountValue,
      'created_at': createdAt?.toIso8601String(),
      if (promotion != null) 'promotion': promotion!.toJson(),
      if (roomType != null) 'room_type': roomType!.toJson(),
    };
  }

  /// Parse discount type từ string
  static DiscountType _parseDiscountType(String discountTypeString) {
    switch (discountTypeString.toLowerCase()) {
      case 'percentage':
        return DiscountType.percentage;
      case 'fixed_amount':
        return DiscountType.fixedAmount;
      default:
        return DiscountType.percentage;
    }
  }

  /// Chuyển discount type thành string
  static String _discountTypeToString(DiscountType discountType) {
    switch (discountType) {
      case DiscountType.percentage:
        return 'percentage';
      case DiscountType.fixedAmount:
        return 'fixed_amount';
    }
  }

  /// Tính giá trị giảm giá cho một giá cụ thể
  double calculateDiscount(double originalPrice) {
    switch (discountType) {
      case DiscountType.percentage:
        return originalPrice * (discountValue / 100);
      case DiscountType.fixedAmount:
        return discountValue;
    }
  }

  /// Tính giá sau khi giảm
  double calculateFinalPrice(double originalPrice) {
    final discount = calculateDiscount(originalPrice);
    final finalPrice = originalPrice - discount;
    return finalPrice < 0 ? 0 : finalPrice; // Không cho phép giá âm
  }

  /// Kiểm tra discount value có hợp lệ không
  bool get isDiscountValueValid {
    if (discountValue <= 0) return false;
    
    // Nếu là percentage thì không được vượt quá 100%
    if (discountType == DiscountType.percentage && discountValue > 100) {
      return false;
    }
    
    return true;
  }

  /// Format discount value để hiển thị
  String get formattedDiscountValue {
    switch (discountType) {
      case DiscountType.percentage:
        return '${discountValue.toStringAsFixed(1)}%';
      case DiscountType.fixedAmount:
        return '${discountValue.toStringAsFixed(0)} VND';
    }
  }

  /// Lấy mô tả chi tiết về discount
  String get discountDescription {
    final roomTypeName = roomType?.name ?? 'Unknown Room Type';
    return 'Giảm ${formattedDiscountValue} cho loại phòng: $roomTypeName';
  }

  /// Kiểm tra có phải là discount theo phần trăm không
  bool get isPercentageDiscount => discountType == DiscountType.percentage;

  /// Kiểm tra có phải là discount theo số tiền cố định không
  bool get isFixedAmountDiscount => discountType == DiscountType.fixedAmount;

  /// Copy với giá trị mới
  PromotionDetail copyWith({
    String? detailId,
    String? promotionId,
    String? roomTypeId,
    DiscountType? discountType,
    double? discountValue,
    DateTime? createdAt,
    Promotion? promotion,
    RoomType? roomType,
  }) {
    return PromotionDetail(
      detailId: detailId ?? this.detailId,
      promotionId: promotionId ?? this.promotionId,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      discountType: discountType ?? this.discountType,
      discountValue: discountValue ?? this.discountValue,
      createdAt: createdAt ?? this.createdAt,
      promotion: promotion ?? this.promotion,
      roomType: roomType ?? this.roomType,
    );
  }

  @override
  String toString() {
    return 'PromotionDetail{detailId: $detailId, promotionId: $promotionId, roomTypeId: $roomTypeId, discountType: ${_discountTypeToString(discountType)}, discountValue: $discountValue}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PromotionDetail &&
        other.detailId == detailId &&
        other.promotionId == promotionId &&
        other.roomTypeId == roomTypeId &&
        other.discountType == discountType &&
        other.discountValue == discountValue &&
        other.createdAt == createdAt &&
        other.promotion == promotion &&
        other.roomType == roomType;
  }

  @override
  int get hashCode {
    return Object.hash(
      detailId,
      promotionId,
      roomTypeId,
      discountType,
      discountValue,
      createdAt,
      promotion,
      roomType,
    );
  }
}

// ============================================
// EXTENSION METHODS
// ============================================

extension PromotionDetailListExtension on List<PromotionDetail> {
  /// Lọc theo promotion ID
  List<PromotionDetail> filterByPromotion(String promotionId) {
    return where((detail) => detail.promotionId == promotionId).toList();
  }

  /// Lọc theo room type ID
  List<PromotionDetail> filterByRoomType(String roomTypeId) {
    return where((detail) => detail.roomTypeId == roomTypeId).toList();
  }

  /// Lọc theo discount type
  List<PromotionDetail> filterByDiscountType(DiscountType discountType) {
    return where((detail) => detail.discountType == discountType).toList();
  }

  /// Lấy các detail theo phần trăm
  List<PromotionDetail> get percentageDiscounts {
    return filterByDiscountType(DiscountType.percentage);
  }

  /// Lấy các detail theo số tiền cố định
  List<PromotionDetail> get fixedAmountDiscounts {
    return filterByDiscountType(DiscountType.fixedAmount);
  }

  /// Tìm detail cho một room type cụ thể
  PromotionDetail? findByRoomType(String roomTypeId) {
    try {
      return firstWhere((detail) => detail.roomTypeId == roomTypeId);
    } catch (e) {
      return null;
    }
  }

  /// Sắp xếp theo discount value (cao nhất trước)
  List<PromotionDetail> sortByDiscountValue({bool descending = true}) {
    final sorted = List<PromotionDetail>.from(this);
    sorted.sort((a, b) {
      return descending
          ? b.discountValue.compareTo(a.discountValue)
          : a.discountValue.compareTo(b.discountValue);
    });
    return sorted;
  }

  /// Kiểm tra có detail nào không hợp lệ không
  bool get hasInvalidDiscounts {
    return any((detail) => !detail.isDiscountValueValid);
  }

  /// Lấy danh sách room type IDs
  List<String> get roomTypeIds {
    return map((detail) => detail.roomTypeId).toSet().toList();
  }
}