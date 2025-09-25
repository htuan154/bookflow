class NotificationForContract {
  constructor({
    notification_id,
    contract_id,
    hotel_id,
    sender_id,
    receiver_id,
    title,
    message,
    notification_type,
    is_read = false,
    created_at
  }) {
    this.notificationId = notification_id;
    this.contractId = contract_id;
    this.hotelId = hotel_id;
    this.senderId = sender_id;
    this.receiverId = receiver_id;
    this.title = title;
    this.message = message;
    this.notificationType = notification_type;
    this.isRead = is_read;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      notificationId: this.notificationId,
      contractId: this.contractId,
      hotelId: this.hotelId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      title: this.title,
      message: this.message,
      notificationType: this.notificationType,
      isRead: this.isRead,
      createdAt: this.createdAt
    };
  }
}

module.exports = NotificationForContract;