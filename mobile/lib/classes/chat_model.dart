// ============================================
// CHAT MODEL
// ============================================

import 'booking_model.dart';
import 'user_model.dart';

class Chat {
  final String messageId;
  final String bookingId;
  final String senderId;
  final ChatStatus status;
  final String messageContent;
  final DateTime createdAt;
  final DateTime lastMessageAt;
  final bool isRead;

  // Quan hệ với các model khác
  final Booking? booking;
  final User? sender;

  const Chat({
    required this.messageId,
    required this.bookingId,
    required this.senderId,
    this.status = ChatStatus.active,
    required this.messageContent,
    required this.createdAt,
    required this.lastMessageAt,
    this.isRead = false,
    this.booking,
    this.sender,
  });

  factory Chat.fromJson(Map<String, dynamic> json) {
    return Chat(
      messageId: json['message_id'] as String,
      bookingId: json['booking_id'] as String,
      senderId: json['sender_id'] as String,
      status: ChatStatus.fromString(json['status'] as String? ?? 'active'),
      messageContent: json['message_content'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      lastMessageAt: DateTime.parse(json['last_message_at'] as String),
      isRead: json['is_read'] as bool? ?? false,
      booking: json['booking'] != null ? Booking.fromJson(json['booking']) : null,
      sender: json['sender'] != null ? User.fromJson(json['sender']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'message_id': messageId,
      'booking_id': bookingId,
      'sender_id': senderId,
      'status': status.value,
      'message_content': messageContent,
      'created_at': createdAt.toIso8601String(),
      'last_message_at': lastMessageAt.toIso8601String(),
      'is_read': isRead,
      if (booking != null) 'booking': booking!.toJson(),
      if (sender != null) 'sender': sender!.toJson(),
    };
  }

  Chat copyWith({
    String? messageId,
    String? bookingId,
    String? senderId,
    ChatStatus? status,
    String? messageContent,
    DateTime? createdAt,
    DateTime? lastMessageAt,
    bool? isRead,
    Booking? booking,
    User? sender,
  }) {
    return Chat(
      messageId: messageId ?? this.messageId,
      bookingId: bookingId ?? this.bookingId,
      senderId: senderId ?? this.senderId,
      status: status ?? this.status,
      messageContent: messageContent ?? this.messageContent,
      createdAt: createdAt ?? this.createdAt,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      isRead: isRead ?? this.isRead,
      booking: booking ?? this.booking,
      sender: sender ?? this.sender,
    );
  }

  /// Đánh dấu tin nhắn đã đọc
  Chat markAsRead() {
    return copyWith(isRead: true);
  }

  /// Đánh dấu tin nhắn chưa đọc
  Chat markAsUnread() {
    return copyWith(isRead: false);
  }

  /// Cập nhật trạng thái chat
  Chat updateStatus(ChatStatus newStatus) {
    return copyWith(status: newStatus);
  }

  /// Kiểm tra tin nhắn có dài không (>500 ký tự)
  bool get isLongMessage => messageContent.length > 500;

  /// Lấy nội dung tin nhắn ngắn gọn (tối đa 100 ký tự)
  String get shortContent {
    if (messageContent.length <= 100) return messageContent;
    return '${messageContent.substring(0, 97)}...';
  }

  /// Kiểm tra tin nhắn có được gửi trong 24h qua không
  bool get isRecent {
    final now = DateTime.now();
    final difference = now.difference(createdAt);
    return difference.inHours < 24;
  }

  /// Lấy thời gian tương đối (vd: "2 giờ trước")
  String get relativeTime {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

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

  /// Lấy tên người gửi
  String get senderName {
    return sender?.fullName ?? 'Người dùng';
  }

  /// Kiểm tra chat có đang hoạt động không
  bool get isActive => status == ChatStatus.active;

  /// Kiểm tra chat có bị đóng không
  bool get isClosed => status == ChatStatus.closed;

  /// Kiểm tra chat có bị lưu trữ không
  bool get isArchived => status == ChatStatus.archived;

  @override
  String toString() {
    return 'Chat(messageId: $messageId, senderId: $senderId, status: $status, isRead: $isRead, shortContent: $shortContent)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Chat && other.messageId == messageId;
  }

  @override
  int get hashCode => messageId.hashCode;
}

enum ChatStatus {
  active('active'),
  closed('closed'),
  archived('archived');

  const ChatStatus(this.value);
  final String value;

  static ChatStatus fromString(String value) {
    return ChatStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => ChatStatus.active,
    );
  }

  @override
  String toString() => value;
}