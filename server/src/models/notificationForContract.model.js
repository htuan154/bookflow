class NotificationForContract {
  constructor({
    _id,
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
    // Giữ lại _id từ MongoDB
    this._id = _id;
    this.notificationId = notification_id;
    this.contractId = contract_id;
    this.hotelId = hotel_id;
    this.senderId = sender_id;
    this.receiverId = receiver_id;
    this.title = title;
    this.message = message;
    this.notificationType = notification_type;
    this.isRead = is_read;
    // Giữ lại created_at nguyên bản từ MongoDB
    this.created_at = created_at;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      _id: this._id,
      notificationId: this.notificationId,
      contractId: this.contractId,
      hotelId: this.hotelId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      title: this.title,
      message: this.message,
      notificationType: this.notificationType,
      isRead: this.isRead,
      created_at: this.created_at,
      createdAt: this.createdAt
    };
  }
}

module.exports = NotificationForContract;