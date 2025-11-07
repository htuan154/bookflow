class BookingNightlyPrice {
  final String priceId;
  final String bookingId;
  final String? bookingDetailId;
  final String roomTypeId;
  final DateTime stayDate;
  final int quantity;
  final double baseRate;
  final String? seasonPricingId;
  final double seasonMultiplier;
  final double grossNightlyPrice;
  final double grossNightlyTotal;
  final DateTime createdAt;

  const BookingNightlyPrice({
    required this.priceId,
    required this.bookingId,
    this.bookingDetailId,
    required this.roomTypeId,
    required this.stayDate,
    required this.quantity,
    required this.baseRate,
    this.seasonPricingId,
    required this.seasonMultiplier,
    required this.grossNightlyPrice,
    required this.grossNightlyTotal,
    required this.createdAt,
  });

  factory BookingNightlyPrice.fromJson(Map<String, dynamic> json) {
    return BookingNightlyPrice(
      priceId: json['priceId'] ?? '',
      bookingId: json['bookingId'] ?? '',
      bookingDetailId: json['bookingDetailId'],
      roomTypeId: json['roomTypeId'] ?? '',
      stayDate: DateTime.parse(json['stayDate'].toString()),
      quantity: json['quantity'] ?? 1,
      baseRate: _parseDouble(json['baseRate']),
      seasonPricingId: json['seasonPricingId'],
      seasonMultiplier: _parseDouble(json['seasonMultiplier']),
      grossNightlyPrice: _parseDouble(json['grossNightlyPrice']),
      grossNightlyTotal: _parseDouble(json['grossNightlyTotal']),
      createdAt: json['createdAt'] != null 
        ? DateTime.parse(json['createdAt'].toString())
        : DateTime.now(),
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      try {
        return double.parse(value);
      } catch (e) {
        print('Error parsing double: $value');
        return 0.0;
      }
    }
    return 0.0;
  }

  Map<String, dynamic> toJson() {
    return {
      'priceId': priceId,
      'bookingId': bookingId,
      'bookingDetailId': bookingDetailId,
      'roomTypeId': roomTypeId,
      'stayDate': stayDate.toIso8601String().split('T')[0],
      'quantity': quantity,
      'baseRate': baseRate,
      'seasonPricingId': seasonPricingId,
      'seasonMultiplier': seasonMultiplier,
      'grossNightlyPrice': grossNightlyPrice,
      'grossNightlyTotal': grossNightlyTotal,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Kiểm tra có áp dụng giá mùa không
  bool get hasSeasonalPricing => seasonPricingId != null && seasonMultiplier != 1.0;

  /// Lấy tên thứ trong tuần
  String get weekdayName {
    const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return weekdays[stayDate.weekday % 7];
  }

  /// Format ngày hiển thị
  String get formattedDate {
    return '${stayDate.day.toString().padLeft(2, '0')}/${stayDate.month.toString().padLeft(2, '0')}';
  }

  /// Format full ngày
  String get fullFormattedDate {
    return '${stayDate.day.toString().padLeft(2, '0')}/${stayDate.month.toString().padLeft(2, '0')}/${stayDate.year}';
  }

  @override
  String toString() {
    return 'BookingNightlyPrice(priceId: $priceId, stayDate: $stayDate, grossNightlyTotal: $grossNightlyTotal)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BookingNightlyPrice && other.priceId == priceId;
  }

  @override
  int get hashCode => priceId.hashCode;
}
