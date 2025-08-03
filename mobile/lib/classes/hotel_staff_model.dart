import 'hotel_model.dart';
import 'user_model.dart';

class HotelStaff {
  final String staffId;
  final String hotelId;
  final String userId;
  final String? position;
  final DateTime startDate;
  final DateTime? endDate;
  final StaffStatus status;
  final String? contact;
  final String? hiredBy;
  final DateTime createdAt;

  // Quan hệ với các model khác
  final Hotel? hotel;
  final User? user;
  final User? hirer;

  const HotelStaff({
    required this.staffId,
    required this.hotelId,
    required this.userId,
    this.position,
    required this.startDate,
    this.endDate,
    this.status = StaffStatus.active,
    this.contact,
    this.hiredBy,
    required this.createdAt,
    this.hotel,
    this.user,
    this.hirer,
  });

  factory HotelStaff.fromJson(Map<String, dynamic> json) {
    return HotelStaff(
      staffId: json['staff_id'] as String,
      hotelId: json['hotel_id'] as String,
      userId: json['user_id'] as String,
      position: json['position'] as String?,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] != null 
          ? DateTime.parse(json['end_date'] as String) 
          : null,
      status: StaffStatus.fromString(json['status'] as String? ?? 'active'),
      contact: json['contact'] as String?,
      hiredBy: json['hired_by'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      hirer: json['hirer'] != null ? User.fromJson(json['hirer']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'staff_id': staffId,
      'hotel_id': hotelId,
      'user_id': userId,
      'position': position,
      'start_date': startDate.toIso8601String().split('T')[0],
      'end_date': endDate?.toIso8601String().split('T')[0],
      'status': status.value,
      'contact': contact,
      'hired_by': hiredBy,
      'created_at': createdAt.toIso8601String(),
      if (hotel != null) 'hotel': hotel!.toJson(),
      if (user != null) 'user': user!.toJson(),
      if (hirer != null) 'hirer': hirer!.toJson(),
    };
  }

  HotelStaff copyWith({
    String? staffId,
    String? hotelId,
    String? userId,
    String? position,
    DateTime? startDate,
    DateTime? endDate,
    StaffStatus? status,
    String? contact,
    String? hiredBy,
    DateTime? createdAt,
    Hotel? hotel,
    User? user,
    User? hirer,
  }) {
    return HotelStaff(
      staffId: staffId ?? this.staffId,
      hotelId: hotelId ?? this.hotelId,
      userId: userId ?? this.userId,
      position: position ?? this.position,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      status: status ?? this.status,
      contact: contact ?? this.contact,
      hiredBy: hiredBy ?? this.hiredBy,
      createdAt: createdAt ?? this.createdAt,
      hotel: hotel ?? this.hotel,
      user: user ?? this.user,
      hirer: hirer ?? this.hirer,
    );
  }

  /// Cập nhật trạng thái nhân viên
  HotelStaff updateStatus(StaffStatus newStatus) {
    return copyWith(status: newStatus);
  }

  /// Kết thúc hợp đồng lao động
  HotelStaff terminate(DateTime terminationDate) {
    return copyWith(
      status: StaffStatus.terminated,
      endDate: terminationDate,
    );
  }

  /// Tạm ngưng làm việc
  HotelStaff suspend() {
    return copyWith(status: StaffStatus.suspended);
  }

  /// Kích hoạt lại
  HotelStaff activate() {
    return copyWith(status: StaffStatus.active);
  }

  /// Vô hiệu hóa
  HotelStaff deactivate() {
    return copyWith(status: StaffStatus.inactive);
  }

  /// Kiểm tra nhân viên có đang hoạt động không
  bool get isActive => status == StaffStatus.active;

  /// Kiểm tra nhân viên có bị tạm ngưng không
  bool get isSuspended => status == StaffStatus.suspended;

  /// Kiểm tra nhân viên có bị vô hiệu hóa không
  bool get isInactive => status == StaffStatus.inactive;

  /// Kiểm tra nhân viên có bị sa thải không
  bool get isTerminated => status == StaffStatus.terminated;

  /// Kiểm tra nhân viên có đang làm việc không (chưa kết thúc hợp đồng)
  bool get isCurrentEmployee {
    if (endDate == null) return true;
    return DateTime.now().isBefore(endDate!);
  }

  /// Tính số ngày làm việc
  int get workingDays {
    final endDateToUse = endDate ?? DateTime.now();
    return endDateToUse.difference(startDate).inDays;
  }

  /// Tính số năm làm việc
  double get workingYears {
    return workingDays / 365.0;
  }

  /// Kiểm tra có vị trí công việc không
  bool get hasPosition => position != null && position!.isNotEmpty;

  /// Kiểm tra có thông tin liên hệ không
  bool get hasContact => contact != null && contact!.isNotEmpty;

  /// Lấy tên nhân viên
  String get staffName => user?.fullName ?? 'Nhân viên';

  /// Lấy tên khách sạn
  String get hotelName => hotel?.name ?? 'Khách sạn';

  /// Lấy tên người tuyển dụng
  String get hirerName => hirer?.fullName ?? 'Không xác định';

  /// Lấy vị trí làm việc hiển thị
  String get displayPosition => hasPosition ? position! : 'Nhân viên';

  /// Kiểm tra có phải nhân viên lâu năm không (>= 1 năm)
  bool get isVeteranEmployee => workingYears >= 1.0;

  /// Kiểm tra có phải nhân viên mới không (<= 3 tháng)
  bool get isNewEmployee => workingDays <= 90;

  /// Lấy trạng thái hiển thị bằng tiếng Việt
  String get statusDisplayText {
    switch (status) {
      case StaffStatus.active:
        return 'Đang hoạt động';
      case StaffStatus.inactive:
        return 'Không hoạt động';
      case StaffStatus.suspended:
        return 'Bị tạm ngưng';
      case StaffStatus.terminated:
        return 'Đã sa thải';
    }
  }

  @override
  String toString() {
    return 'HotelStaff(staffId: $staffId, staffName: $staffName, position: $displayPosition, status: $status, workingDays: $workingDays)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is HotelStaff && other.staffId == staffId;
  }

  @override
  int get hashCode => staffId.hashCode;
}

enum StaffStatus {
  active('active'),
  inactive('inactive'),
  suspended('suspended'),
  terminated('terminated');

  const StaffStatus(this.value);
  final String value;

  static StaffStatus fromString(String value) {
    return StaffStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => StaffStatus.active,
    );
  }

  @override
  String toString() => value;
}