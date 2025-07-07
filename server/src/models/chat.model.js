class Chat {
  constructor({ message_id, booking_id, sender_id, status, message_content, created_at, last_message_at, is_read }) {
    this.messageId = message_id;
    this.bookingId = booking_id;
    this.senderId = sender_id;
    this.status = status;
    this.messageContent = message_content;
    this.createdAt = created_at;
    this.lastMessageAt = last_message_at;
    this.isRead = is_read;
  }

  toJSON() {
    return {
      messageId: this.messageId,
      bookingId: this.bookingId,
      senderId: this.senderId,
      messageContent: this.messageContent,
      createdAt: this.createdAt,
      isRead: this.isRead,
    };
  }
}

module.exports = Chat;