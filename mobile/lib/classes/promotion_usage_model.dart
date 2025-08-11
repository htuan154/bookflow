// ============================================
// PROMOTION USAGE MODEL
// ============================================

import 'promotion_model.dart';
import 'user_model.dart';
import 'booking_model.dart';

class PromotionUsage {
  final String? usageId;
  final String promotionId;
  final String userId;
  final String bookingId;
  final double discountAmount;
  final double originalAmount;
  final double finalAmount;
  final DateTime? usedAt;
  final String? ipAddress;
  final String? userAgent;
  
  // Quan hệ với các model khác - optional
  final Promotion? promotion;
  final User? user;
  final Booking? booking;

  const PromotionUsage({
    this.usageId,
    required this.promotionId,
    required this.userId,
    required this.bookingId,
    required this.discountAmount,
    required this.originalAmount,
    required this.finalAmount,
    this.usedAt,
    this.ipAddress,
    this.userAgent,
    this.promotion,
    this.user,
    this.booking,
  });

  /// Tạo PromotionUsage từ JSON
  factory PromotionUsage.fromJson(Map<String, dynamic> json) {
    return PromotionUsage(
      usageId: json['usage_id'] as String?,
      promotionId: json['promotion_id'] as String,
      userId: json['user_id'] as String,
      bookingId: json['booking_id'] as String,
      discountAmount: (json['discount_amount'] as num).toDouble(),
      originalAmount: (json['original_amount'] as num).toDouble(),
      finalAmount: (json['final_amount'] as num).toDouble(),
      usedAt: json['used_at'] != null ? DateTime.parse(json['used_at'] as String) : null,
      ipAddress: json['ip_address'] as String?,
      userAgent: json['user_agent'] as String?,
      promotion: json['promotion'] != null ? Promotion.fromJson(json['promotion']) : null,
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      booking: json['booking'] != null ? Booking.fromJson(json['booking']) : null,
    );
  }

  /// Chuyển PromotionUsage thành JSON
  Map<String, dynamic> toJson() {
    return {
      'usage_id': usageId,
      'promotion_id': promotionId,
      'user_id': userId,
      'booking_id': bookingId,
      'discount_amount': discountAmount,
      'original_amount': originalAmount,
      'final_amount': finalAmount,
      'used_at': usedAt?.toIso8601String(),
      'ip_address': ipAddress,
      'user_agent': userAgent,
      if (promotion != null) 'promotion': promotion!.toJson(),
      if (user != null) 'user': user!.toJson(),
      if (booking != null) 'booking': booking!.toJson(),
    };
  }

  /// Tạo PromotionUsage với tính toán tự động final_amount
  factory PromotionUsage.create({
    String? usageId,
    required String promotionId,
    required String userId,
    required String bookingId,
    required double discountAmount,
    required double originalAmount,
    DateTime? usedAt,
    String? ipAddress,
    String? userAgent,
    Promotion? promotion,
    User? user,
    Booking? booking,
  }) {
    final finalAmount = originalAmount - discountAmount;
    
    return PromotionUsage(
      usageId: usageId,
      promotionId: promotionId,
      userId: userId,
      bookingId: bookingId,
      discountAmount: discountAmount,
      originalAmount: originalAmount,
      finalAmount: finalAmount,
      usedAt: usedAt ?? DateTime.now(),
      ipAddress: ipAddress,
      userAgent: userAgent,
      promotion: promotion,
      user: user,
      booking: booking,
    );
  }

  /// Kiểm tra tính hợp lệ của số tiền
  bool get isAmountValid {
    return discountAmount >= 0 &&
           originalAmount > 0 &&
           finalAmount >= 0 &&
           finalAmount == (originalAmount - discountAmount);
  }

  /// Tính phần trăm giảm giá
  double get discountPercentage {
    if (originalAmount <= 0) return 0;
    return (discountAmount / originalAmount) * 100;
  }

  /// Kiểm tra có được sử dụng trong hôm nay không
  bool get isUsedToday {
    if (usedAt == null) return false;
    final now = DateTime.now();
    final usedDate = usedAt!;
    return now.year == usedDate.year &&
           now.month == usedDate.month &&
           now.day == usedDate.day;
  }

  /// Tính số ngày từ khi sử dụng
  int get daysSinceUsed {
    if (usedAt == null) return 0;
    return DateTime.now().difference(usedAt!).inDays;
  }

  /// Format số tiền với currency
  String formatAmount(double amount, {String currency = 'VND'}) {
    return '${amount.toStringAsFixed(0)} $currency';
  }

  /// Lấy thông tin tóm tắt về việc sử dụng
  String get usageSummary {
    final discountStr = formatAmount(discountAmount);
    final originalStr = formatAmount(originalAmount);
    final finalStr = formatAmount(finalAmount);
    
    return 'Giảm $discountStr từ $originalStr còn $finalStr';
  }

  /// Copy với giá trị mới
  PromotionUsage copyWith({
    String? usageId,
    String? promotionId,
    String? userId,
    String? bookingId,
    double? discountAmount,
    double? originalAmount,
    double? finalAmount,
    DateTime? usedAt,
    String? ipAddress,
    String? userAgent,
    Promotion? promotion,
    User? user,
    Booking? booking,
  }) {
    return PromotionUsage(
      usageId: usageId ?? this.usageId,
      promotionId: promotionId ?? this.promotionId,
      userId: userId ?? this.userId,
      bookingId: bookingId ?? this.bookingId,
      discountAmount: discountAmount ?? this.discountAmount,
      originalAmount: originalAmount ?? this.originalAmount,
      finalAmount: finalAmount ?? this.finalAmount,
      usedAt: usedAt ?? this.usedAt,
      ipAddress: ipAddress ?? this.ipAddress,
      userAgent: userAgent ?? this.userAgent,
      promotion: promotion ?? this.promotion,
      user: user ?? this.user,
      booking: booking ?? this.booking,
    );
  }

  @override
  String toString() {
    return 'PromotionUsage{usageId: $usageId, promotionId: $promotionId, userId: $userId, discountAmount: $discountAmount, originalAmount: $originalAmount, finalAmount: $finalAmount}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PromotionUsage &&
        other.usageId == usageId &&
        other.promotionId == promotionId &&
        other.userId == userId &&
        other.bookingId == bookingId &&
        other.discountAmount == discountAmount &&
        other.originalAmount == originalAmount &&
        other.finalAmount == finalAmount &&
        other.usedAt == usedAt &&
        other.ipAddress == ipAddress &&
        other.userAgent == userAgent &&
        other.promotion == promotion &&
        other.user == user &&
        other.booking == booking;
  }

  @override
  int get hashCode {
    return Object.hash(
      usageId,
      promotionId,
      userId,
      bookingId,
      discountAmount,
      originalAmount,
      finalAmount,
      usedAt,
      ipAddress,
      userAgent,
      promotion,
      user,
      booking,
    );
  }
}

// ============================================
// EXTENSION METHODS
// ============================================

extension PromotionUsageListExtension on List<PromotionUsage> {
  /// Tính tổng số tiền giảm giá
  double get totalDiscountAmount {
    return fold(0, (sum, usage) => sum + usage.discountAmount);
  }

  /// Tính tổng số tiền gốc
  double get totalOriginalAmount {
    return fold(0, (sum, usage) => sum + usage.originalAmount);
  }

  /// Tính tổng số tiền cuối cùng
  double get totalFinalAmount {
    return fold(0, (sum, usage) => sum + usage.finalAmount);
  }

  /// Lọc theo promotion ID
  List<PromotionUsage> filterByPromotion(String promotionId) {
    return where((usage) => usage.promotionId == promotionId).toList();
  }

  /// Lọc theo user ID
  List<PromotionUsage> filterByUser(String userId) {
    return where((usage) => usage.userId == userId).toList();
  }

  /// Lọc theo ngày sử dụng
  List<PromotionUsage> filterByDateRange(DateTime startDate, DateTime endDate) {
    return where((usage) {
      if (usage.usedAt == null) return false;
      return !usage.usedAt!.isBefore(startDate) && 
             !usage.usedAt!.isAfter(endDate);
    }).toList();
  }

  /// Lọc usage trong hôm nay
  List<PromotionUsage> get usedToday {
    final today = DateTime.now();
    return where((usage) {
      if (usage.usedAt == null) return false;
      final usedDate = usage.usedAt!;
      return today.year == usedDate.year &&
             today.month == usedDate.month &&
             today.day == usedDate.day;
    }).toList();
  }

  /// Sắp xếp theo thời gian sử dụng (mới nhất trước)
  List<PromotionUsage> sortByUsedAt({bool descending = true}) {
    final sorted = List<PromotionUsage>.from(this);
    sorted.sort((a, b) {
      if (a.usedAt == null && b.usedAt == null) return 0;
      if (a.usedAt == null) return descending ? 1 : -1;
      if (b.usedAt == null) return descending ? -1 : 1;
      
      return descending 
        ? b.usedAt!.compareTo(a.usedAt!)
        : a.usedAt!.compareTo(b.usedAt!);
    });
    return sorted;
  }
}