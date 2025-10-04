// ============================================
// ROOM ASSIGNMENT MODEL
// ============================================

import 'dart:convert';
import 'room_model.dart';
import 'user_model.dart';

class RoomAssignment {
  final String assignmentId;
  final String bookingDetailId;
  final String roomId;
  final DateTime assignedAt;
  final String? assignedBy;
  final String? notes;

  // Quan hệ với các model khác (optional)
  final Room? room;
  final User? assignedByUser;
  // final BookingDetail? bookingDetail; // Sẽ được thêm sau khi có booking_detail_model

  RoomAssignment({
    required this.assignmentId,
    required this.bookingDetailId,
    required this.roomId,
    required this.assignedAt,
    this.assignedBy,
    this.notes,
    this.room,
    this.assignedByUser,
    // this.bookingDetail,
  });

  // Factory constructor từ JSON
  factory RoomAssignment.fromJson(Map<String, dynamic> json) {
    return RoomAssignment(
      assignmentId: json['assignment_id'] as String,
      bookingDetailId: json['booking_detail_id'] as String,
      roomId: json['room_id'] as String,
      assignedAt: DateTime.parse(json['assigned_at'] as String),
      assignedBy: json['assigned_by'] as String?,
      notes: json['notes'] as String?,
      room: json['room'] != null ? Room.fromJson(json['room']) : null,
      assignedByUser: json['assigned_by_user'] != null 
          ? User.fromJson(json['assigned_by_user']) 
          : null,
      // bookingDetail: json['booking_detail'] != null ? BookingDetail.fromJson(json['booking_detail']) : null,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'assignment_id': assignmentId,
      'booking_detail_id': bookingDetailId,
      'room_id': roomId,
      'assigned_at': assignedAt.toIso8601String(),
      'assigned_by': assignedBy,
      'notes': notes,
      if (room != null) 'room': room!.toJson(),
      if (assignedByUser != null) 'assigned_by_user': assignedByUser!.toJson(),
      // if (bookingDetail != null) 'booking_detail': bookingDetail!.toJson(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory RoomAssignment.fromJsonString(String jsonString) {
    return RoomAssignment.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  RoomAssignment copyWith({
    String? assignmentId,
    String? bookingDetailId,
    String? roomId,
    DateTime? assignedAt,
    String? assignedBy,
    String? notes,
    Room? room,
    User? assignedByUser,
    // BookingDetail? bookingDetail,
  }) {
    return RoomAssignment(
      assignmentId: assignmentId ?? this.assignmentId,
      bookingDetailId: bookingDetailId ?? this.bookingDetailId,
      roomId: roomId ?? this.roomId,
      assignedAt: assignedAt ?? this.assignedAt,
      assignedBy: assignedBy ?? this.assignedBy,
      notes: notes ?? this.notes,
      room: room ?? this.room,
      assignedByUser: assignedByUser ?? this.assignedByUser,
      // bookingDetail: bookingDetail ?? this.bookingDetail,
    );
  }

  // Helper methods
  String get roomNumber => room?.roomNumber ?? 'Unknown';
  String get roomDisplayName => room?.displayName ?? 'Unknown Room';
  String get assignedByName => assignedByUser?.fullName ?? assignedByUser?.username ?? 'System';

  // Kiểm tra có ghi chú không
  bool get hasNotes => notes != null && notes!.isNotEmpty;

  // Kiểm tra có người assign không
  bool get hasAssignedBy => assignedBy != null;

  // Lấy thông tin tóm tắt assignment
  String get assignmentSummary {
    return 'Room $roomNumber assigned${hasAssignedBy ? ' by $assignedByName' : ''}';
  }

  // Tính thời gian đã assign (relative time)
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(assignedAt);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '${weeks}w ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '${months}mo ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '${years}y ago';
    }
  }

  // Format assigned date cho display
  String get formattedAssignedDate {
    return '${assignedAt.day}/${assignedAt.month}/${assignedAt.year} ${assignedAt.hour.toString().padLeft(2, '0')}:${assignedAt.minute.toString().padLeft(2, '0')}';
  }

  // Kiểm tra assignment có hôm nay không
  bool get isAssignedToday {
    final now = DateTime.now();
    return assignedAt.year == now.year &&
           assignedAt.month == now.month &&
           assignedAt.day == now.day;
  }

  // Lấy status của room được assign
  String? get roomStatus => room?.status;

  // Kiểm tra room có available không
  bool get isRoomAvailable => room?.isAvailable ?? false;

  @override
  String toString() {
    return 'RoomAssignment(assignmentId: $assignmentId, bookingDetailId: $bookingDetailId, roomNumber: $roomNumber, assignedBy: $assignedByName, assignedAt: $assignedAt)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is RoomAssignment && other.assignmentId == assignmentId;
  }

  @override
  int get hashCode => assignmentId.hashCode;
}

// ============================================
// HELPER CLASS FOR ROOM ASSIGNMENT SUMMARY
// ============================================
class RoomAssignmentSummary {
  final String bookingDetailId;
  final List<RoomAssignment> assignments;
  final DateTime? latestAssignment;
  final int totalRoomsAssigned;

  RoomAssignmentSummary({
    required this.bookingDetailId,
    required this.assignments,
    this.latestAssignment,
    required this.totalRoomsAssigned,
  });

  factory RoomAssignmentSummary.fromAssignments(
    String bookingDetailId,
    List<RoomAssignment> assignments,
  ) {
    final sortedAssignments = List<RoomAssignment>.from(assignments)
      ..sort((a, b) => b.assignedAt.compareTo(a.assignedAt));

    return RoomAssignmentSummary(
      bookingDetailId: bookingDetailId,
      assignments: sortedAssignments,
      latestAssignment: sortedAssignments.isNotEmpty 
          ? sortedAssignments.first.assignedAt 
          : null,
      totalRoomsAssigned: assignments.length,
    );
  }

  // Helper methods
  bool get hasAssignments => assignments.isNotEmpty;
  
  List<String> get roomNumbers => 
      assignments.map((assignment) => assignment.roomNumber).toList();

  List<String> get roomDisplayNames => 
      assignments.map((assignment) => assignment.roomDisplayName).toList();

  String get roomNumbersText => roomNumbers.join(', ');

  RoomAssignment? get latestAssignmentDetails => 
      assignments.isNotEmpty ? assignments.first : null;

  // Kiểm tra có assignment hôm nay không
  bool get hasAssignmentToday => 
      assignments.any((assignment) => assignment.isAssignedToday);

  // Lấy assignments theo ngày
  Map<DateTime, List<RoomAssignment>> get assignmentsByDate {
    final Map<DateTime, List<RoomAssignment>> result = {};
    
    for (final assignment in assignments) {
      final date = DateTime(
        assignment.assignedAt.year,
        assignment.assignedAt.month,
        assignment.assignedAt.day,
      );
      
      result[date] = result[date] ?? [];
      result[date]!.add(assignment);
    }
    
    return result;
  }

  // Lấy assignments theo người assign
  Map<String, List<RoomAssignment>> get assignmentsByAssigner {
    final Map<String, List<RoomAssignment>> result = {};
    
    for (final assignment in assignments) {
      final assigner = assignment.assignedByName;
      result[assigner] = result[assigner] ?? [];
      result[assigner]!.add(assignment);
    }
    
    return result;
  }

  @override
  String toString() {
    return 'RoomAssignmentSummary(bookingDetailId: $bookingDetailId, totalRooms: $totalRoomsAssigned, rooms: $roomNumbersText)';
  }
}