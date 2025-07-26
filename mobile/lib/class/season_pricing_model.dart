import 'room_type_model.dart';
import 'season_model.dart';

class SeasonalPricing {
  final String pricingId;
  final String roomTypeId;
  final int? seasonId;
  final String name;
  final DateTime startDate;
  final DateTime endDate;
  final double priceModifier;

  // Quan hệ với các model khác
  final RoomType? roomType;
  final Season? season;

  const SeasonalPricing({
    required this.pricingId,
    required this.roomTypeId,
    this.seasonId,
    required this.name,
    required this.startDate,
    required this.endDate,
    required this.priceModifier,
    this.roomType,
    this.season,
  });

  factory SeasonalPricing.fromJson(Map<String, dynamic> json) {
    return SeasonalPricing(
      pricingId: json['pricing_id'] as String,
      roomTypeId: json['room_type_id'] as String,
      seasonId: json['season_id'] as int?,
      name: json['name'] as String,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      priceModifier: (json['price_modifier'] as num).toDouble(),
      roomType: json['room_type'] != null ? RoomType.fromJson(json['room_type']) : null,
      season: json['season'] != null ? Season.fromJson(json['season']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pricing_id': pricingId,
      'room_type_id': roomTypeId,
      'season_id': seasonId,
      'name': name,
      'start_date': startDate.toIso8601String().split('T')[0],
      'end_date': endDate.toIso8601String().split('T')[0],
      'price_modifier': priceModifier,
      if (roomType != null) 'room_type': roomType!.toJson(),
      if (season != null) 'season': season!.toJson(),
    };
  }

  SeasonalPricing copyWith({
    String? pricingId,
    String? roomTypeId,
    int? seasonId,
    String? name,
    DateTime? startDate,
    DateTime? endDate,
    double? priceModifier,
    RoomType? roomType,
    Season? season,
  }) {
    return SeasonalPricing(
      pricingId: pricingId ?? this.pricingId,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      seasonId: seasonId ?? this.seasonId,
      name: name ?? this.name,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      priceModifier: priceModifier ?? this.priceModifier,
      roomType: roomType ?? this.roomType,
      season: season ?? this.season,
    );
  }

  /// Tính giá sau khi áp dụng modifier
  double calculateModifiedPrice(double basePrice) {
    return basePrice * priceModifier;
  }

  /// Tính phần trăm thay đổi giá (dương = tăng, âm = giảm)
  double get priceChangePercentage {
    return (priceModifier - 1.0) * 100;
  }

  /// Kiểm tra có phải là giảm giá không
  bool get isDiscount => priceModifier < 1.0;

  /// Kiểm tra có phải là tăng giá không
  bool get isPriceIncrease => priceModifier > 1.0;

  /// Kiểm tra giá có không thay đổi không
  bool get isNormalPrice => priceModifier == 1.0;

  /// Tính số ngày áp dụng
  int get durationInDays {
    return endDate.difference(startDate).inDays + 1;
  }

  /// Kiểm tra ngày cụ thể có nằm trong khoảng thời gian này không
  bool isDateInRange(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final startOnly = DateTime(startDate.year, startDate.month, startDate.day);
    final endOnly = DateTime(endDate.year, endDate.month, endDate.day);
    
    return (dateOnly.isAtSameMomentAs(startOnly) || dateOnly.isAfter(startOnly)) &&
           (dateOnly.isAtSameMomentAs(endOnly) || dateOnly.isBefore(endOnly));
  }

  /// Kiểm tra có đang trong thời gian áp dụng không
  bool get isCurrentlyActive {
    final now = DateTime.now();
    return isDateInRange(now);
  }

  /// Kiểm tra có sắp bắt đầu không (trong vòng 7 ngày tới)
  bool get isUpcoming {
    final now = DateTime.now();
    final daysUntilStart = startDate.difference(now).inDays;
    return daysUntilStart > 0 && daysUntilStart <= 7;
  }

  /// Kiểm tra đã kết thúc chưa
  bool get isExpired {
    final now = DateTime.now();
    return now.isAfter(endDate);
  }

  /// Lấy tên loại phòng
  String get roomTypeName => roomType?.name ?? 'Loại phòng';

  /// Lấy tên mùa
  String get seasonName => season?.name ?? 'Không xác định';

  /// Lấy mô tả giá
  String get priceDescription {
    if (isDiscount) {
      return 'Giảm ${priceChangePercentage.abs().toStringAsFixed(1)}%';
    } else if (isPriceIncrease) {
      return 'Tăng ${priceChangePercentage.toStringAsFixed(1)}%';
    } else {
      return 'Giá chuẩn';
    }
  }

  /// Lấy trạng thái hiển thị
  String get statusDisplay {
    if (isCurrentlyActive) {
      return 'Đang áp dụng';
    } else if (isUpcoming) {
      return 'Sắp áp dụng';
    } else if (isExpired) {
      return 'Đã hết hạn';
    } else {
      return 'Chưa áp dụng';
    }
  }

  /// Tính số ngày còn lại (nếu đang hoạt động)
  int? get daysRemaining {
    if (!isCurrentlyActive) return null;
    final now = DateTime.now();
    return endDate.difference(now).inDays;
  }

  /// Tính số ngày cho đến khi bắt đầu (nếu chưa bắt đầu)
  int? get daysUntilStart {
    if (isCurrentlyActive || isExpired) return null;
    final now = DateTime.now();
    return startDate.difference(now).inDays;
  }

  @override
  String toString() {
    return 'SeasonalPricing(pricingId: $pricingId, name: $name, priceModifier: $priceModifier, status: $statusDisplay)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SeasonalPricing && other.pricingId == pricingId;
  }

  @override
  int get hashCode => pricingId.hashCode;
}