// ============================================
// SEASON MODEL
// ============================================

class Season {
  final int? seasonId;
  final String name;
  final DateTime startDate;
  final DateTime endDate;
  final int year;
  final String? description;
  final DateTime? createdAt;

  const Season({
    this.seasonId,
    required this.name,
    required this.startDate,
    required this.endDate,
    required this.year,
    this.description,
    this.createdAt,
  });

  /// Tạo Season từ JSON
  factory Season.fromJson(Map<String, dynamic> json) {
    return Season(
      seasonId: json['season_id'] as int?,
      name: json['name'] as String,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      year: json['year'] as int,
      description: json['description'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
    );
  }

  /// Chuyển Season thành JSON
  Map<String, dynamic> toJson() {
    return {
      'season_id': seasonId,
      'name': name,
      'start_date': _formatDateOnly(startDate),
      'end_date': _formatDateOnly(endDate),
      'year': year,
      'description': description,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  /// Format date to YYYY-MM-DD string
  String _formatDateOnly(DateTime date) {
    return '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  /// Kiểm tra ngày có trong mùa không
  bool containsDate(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final startOnly = DateTime(startDate.year, startDate.month, startDate.day);
    final endOnly = DateTime(endDate.year, endDate.month, endDate.day);
    
    return !dateOnly.isBefore(startOnly) && !dateOnly.isAfter(endOnly);
  }

  /// Tính số ngày trong mùa
  int get durationInDays {
    return endDate.difference(startDate).inDays + 1;
  }

  /// Kiểm tra mùa có đang diễn ra không
  bool get isActive {
    final now = DateTime.now();
    return containsDate(now);
  }

  /// Copy với giá trị mới
  Season copyWith({
    int? seasonId,
    String? name,
    DateTime? startDate,
    DateTime? endDate,
    int? year,
    String? description,
    DateTime? createdAt,
  }) {
    return Season(
      seasonId: seasonId ?? this.seasonId,
      name: name ?? this.name,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      year: year ?? this.year,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'Season{seasonId: $seasonId, name: $name, year: $year, startDate: ${_formatDateOnly(startDate)}, endDate: ${_formatDateOnly(endDate)}}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Season &&
        other.seasonId == seasonId &&
        other.name == name &&
        other.startDate == startDate &&
        other.endDate == endDate &&
        other.year == year &&
        other.description == description &&
        other.createdAt == createdAt;
  }

  @override
  int get hashCode {
    return Object.hash(
      seasonId,
      name,
      startDate,
      endDate,
      year,
      description,
      createdAt,
    );
  }
}