// ============================================
// TIME OF DAY MODEL - HELPER CLASS
// ============================================

class TimeOfDay {
  final int hour;
  final int minute;

  const TimeOfDay({required this.hour, required this.minute});

  /// Tạo TimeOfDay từ string format "HH:mm"
  factory TimeOfDay.fromTimeString(String timeString) {
    final parts = timeString.split(':');
    if (parts.length != 2) {
      throw ArgumentError('Invalid time format. Expected "HH:mm"');
    }
    
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    
    if (hour == null || minute == null) {
      throw ArgumentError('Invalid time format. Expected numeric values');
    }
    
    if (hour < 0 || hour > 23) {
      throw ArgumentError('Hour must be between 0 and 23');
    }
    
    if (minute < 0 || minute > 59) {
      throw ArgumentError('Minute must be between 0 and 59');
    }
    
    return TimeOfDay(hour: hour, minute: minute);
  }

  /// Tạo TimeOfDay từ DateTime
  factory TimeOfDay.fromDateTime(DateTime dateTime) {
    return TimeOfDay(hour: dateTime.hour, minute: dateTime.minute);
  }

  /// Tạo TimeOfDay hiện tại
  factory TimeOfDay.now() {
    final now = DateTime.now();
    return TimeOfDay(hour: now.hour, minute: now.minute);
  }

  /// Chuyển thành string format "HH:mm"
  String toTimeString() {
    return '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
  }

  /// Chuyển thành format 12 giờ với AM/PM
  String to12HourFormat() {
    final period = hour < 12 ? 'AM' : 'PM';
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return '${displayHour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')} $period';
  }

  /// Tổng số phút từ 00:00
  int get totalMinutes => hour * 60 + minute;

  /// So sánh với TimeOfDay khác
  int compareTo(TimeOfDay other) {
    return totalMinutes.compareTo(other.totalMinutes);
  }

  /// Kiểm tra có trước TimeOfDay khác không
  bool isBefore(TimeOfDay other) {
    return compareTo(other) < 0;
  }

  /// Kiểm tra có sau TimeOfDay khác không
  bool isAfter(TimeOfDay other) {
    return compareTo(other) > 0;
  }

  /// Tính khoảng cách phút giữa 2 thời điểm
  int differenceInMinutes(TimeOfDay other) {
    return (other.totalMinutes - totalMinutes).abs();
  }

  /// Cộng thêm phút
  TimeOfDay addMinutes(int minutes) {
    final totalMin = totalMinutes + minutes;
    final newHour = (totalMin ~/ 60) % 24;
    final newMinute = totalMin % 60;
    return TimeOfDay(hour: newHour, minute: newMinute);
  }

  /// Trừ phút
  TimeOfDay subtractMinutes(int minutes) {
    return addMinutes(-minutes);
  }

  /// Cộng thêm giờ
  TimeOfDay addHours(int hours) {
    return addMinutes(hours * 60);
  }

  /// Trừ giờ
  TimeOfDay subtractHours(int hours) {
    return addMinutes(-hours * 60);
  }

  /// Kiểm tra có trong khoảng thời gian không (bao gồm cả 2 đầu)
  bool isBetween(TimeOfDay start, TimeOfDay end) {
    // Xử lý trường hợp qua đêm (ví dụ: 22:00 - 06:00)
    if (start.isAfter(end)) {
      return !isAfter(end) || !isBefore(start);
    }
    
    return !isBefore(start) && !isAfter(end);
  }

  /// Tạo DateTime từ TimeOfDay với ngày cụ thể
  DateTime toDateTime(DateTime date) {
    return DateTime(date.year, date.month, date.day, hour, minute);
  }

  /// Copy với giá trị mới
  TimeOfDay copyWith({int? hour, int? minute}) {
    return TimeOfDay(
      hour: hour ?? this.hour,
      minute: minute ?? this.minute,
    );
  }

  @override
  String toString() => toTimeString();

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TimeOfDay && other.hour == hour && other.minute == minute;
  }

  @override
  int get hashCode => hour.hashCode ^ minute.hashCode;
}

// ============================================
// EXTENSION METHODS
// ============================================

extension TimeOfDayExtension on String {
  /// Chuyển String thành TimeOfDay
  TimeOfDay toTimeOfDay() => TimeOfDay.fromTimeString(this);
}

extension DateTimeExtension on DateTime {
  /// Chuyển DateTime thành TimeOfDay
  TimeOfDay toTimeOfDay() => TimeOfDay.fromDateTime(this);
}