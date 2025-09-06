import 'booking_model.dart';
import 'hotel_staff_model.dart';

class BookingStatusHistory {
  final String historyId;
  final String bookingId;
  final String? oldStatus;
  final String newStatus;
  final String changedByStaff;
  final String? changeReason;
  final String? notes;
  final DateTime changedAt;

  // Quan hệ với các model khác
  final Booking? booking;
  final HotelStaff? staff;

  const BookingStatusHistory({
    required this.historyId,
    required this.bookingId,
    this.oldStatus,
    required this.newStatus,
    required this.changedByStaff,
    this.changeReason,
    this.notes,
    required this.changedAt,
    this.booking,
    this.staff,
  });

  factory BookingStatusHistory.fromJson(Map<String, dynamic> json) {
    return BookingStatusHistory(
      historyId: json['history_id'] as String,
      bookingId: json['booking_id'] as String,
      oldStatus: json['old_status'] as String?,
      newStatus: json['new_status'] as String,
      changedByStaff: json['changed_by_staff'] as String,
      changeReason: json['change_reason'] as String?,
      notes: json['notes'] as String?,
      changedAt: DateTime.parse(json['changed_at'] as String),
      booking: json['booking'] != null ? Booking.fromJson(json['booking']) : null,
      staff: json['staff'] != null ? HotelStaff.fromJson(json['staff']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'history_id': historyId,
      'booking_id': bookingId,
      'old_status': oldStatus,
      'new_status': newStatus,
      'changed_by_staff': changedByStaff,
      'change_reason': changeReason,
      'notes': notes,
      'changed_at': changedAt.toIso8601String(),
      if (booking != null) 'booking': booking!.toJson(),
      if (staff != null) 'staff': staff!.toJson(),
    };
  }

  BookingStatusHistory copyWith({
    String? historyId,
    String? bookingId,
    String? oldStatus,
    String? newStatus,
    String? changedByStaff,
    String? changeReason,
    String? notes,
    DateTime? changedAt,
    Booking? booking,
    HotelStaff? staff,
  }) {
    return BookingStatusHistory(
      historyId: historyId ?? this.historyId,
      bookingId: bookingId ?? this.bookingId,
      oldStatus: oldStatus ?? this.oldStatus,
      newStatus: newStatus ?? this.newStatus,
      changedByStaff: changedByStaff ?? this.changedByStaff,
      changeReason: changeReason ?? this.changeReason,
      notes: notes ?? this.notes,
      changedAt: changedAt ?? this.changedAt,
      booking: booking ?? this.booking,
      staff: staff ?? this.staff,
    );
  }

  /// Kiểm tra có phải lần đầu tạo booking không (oldStatus null)
  bool get isInitialStatus => oldStatus == null;

  /// Kiểm tra có lý do thay đổi không
  bool get hasChangeReason => changeReason != null && changeReason!.isNotEmpty;

  /// Kiểm tra có ghi chú không
  bool get hasNotes => notes != null && notes!.isNotEmpty;

  /// Lấy tên nhân viên thực hiện thay đổi
  String get staffName => staff?.staffName ?? 'Nhân viên';

  /// Lấy mô tả thay đổi trạng thái
  String get statusChangeDescription {
    if (isInitialStatus) {
      return 'Tạo booking với trạng thái: ${getStatusDisplayText(newStatus)}';
    } else {
      return 'Thay đổi từ ${getStatusDisplayText(oldStatus!)} sang ${getStatusDisplayText(newStatus)}';
    }
  }

  /// Chuyển đổi status code sang text hiển thị
  String getStatusDisplayText(String status) {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'canceled':
        return 'Đã hủy';
      case 'completed':
        return 'Hoàn thành';
      case 'no_show':
        return 'Không đến';
      default:
        return status;
    }
  }

  /// Kiểm tra có phải thay đổi tích cực không (pending -> confirmed, confirmed -> completed)
  bool get isPositiveChange {
    if (isInitialStatus) return true;
    
    const positiveTransitions = [
      {'from': 'pending', 'to': 'confirmed'},
      {'from': 'confirmed', 'to': 'completed'},
    ];
    
    return positiveTransitions.any((transition) => 
      transition['from'] == oldStatus && transition['to'] == newStatus);
  }

  /// Kiểm tra có phải thay đổi tiêu cực không (confirmed -> canceled, pending -> canceled, etc.)
  bool get isNegativeChange {
    if (isInitialStatus) return false;
    
    const negativeTransitions = [
      {'from': 'pending', 'to': 'canceled'},
      {'from': 'confirmed', 'to': 'canceled'},
      {'from': 'confirmed', 'to': 'no_show'},
    ];
    
    return negativeTransitions.any((transition) => 
      transition['from'] == oldStatus && transition['to'] == newStatus);
  }

  /// Kiểm tra thay đổi có trong ngày hôm nay không
  bool get isToday {
    final now = DateTime.now();
    final changeDate = DateTime(changedAt.year, changedAt.month, changedAt.day);
    final today = DateTime(now.year, now.month, now.day);
    return changeDate.isAtSameMomentAs(today);
  }

  /// Lấy thời gian tương đối
  String get relativeTime {
    final now = DateTime.now();
    final difference = now.difference(changedAt);

    if (difference.inMinutes < 1) {
      return 'Vừa xong';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} phút trước';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ngày trước';
    } else {
      return '${(difference.inDays / 7).floor()} tuần trước';
    }
  }

  /// Lấy icon màu sắc cho loại thay đổi
  String get changeTypeIcon {
    if (isPositiveChange) return '✅';
    if (isNegativeChange) return '❌';
    return 'ℹ️';
  }

  /// Lấy màu cho loại thay đổi (hex color)
  String get changeTypeColor {
    if (isPositiveChange) return '#4CAF50'; // Green
    if (isNegativeChange) return '#F44336'; // Red
    return '#2196F3'; // Blue
  }

  /// Lấy summary ngắn gọn cho notification
  String get summaryText {
    final action = isInitialStatus ? 'tạo' : 'cập nhật';
    final reasonText = hasChangeReason ? ' - ${changeReason!}' : '';
    return 'Booking đã được $action$reasonText';
  }

  @override
  String toString() {
    return 'BookingStatusHistory(historyId: $historyId, bookingId: $bookingId, statusChangeDescription: $statusChangeDescription, changedAt: $changedAt)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BookingStatusHistory && other.historyId == historyId;
  }

  @override
  int get hashCode => historyId.hashCode;
}