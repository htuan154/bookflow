class BookingDetail {
  constructor({ detail_id, booking_id, room_type_id, quantity, unit_price, subtotal, guests_per_room }) {
    this.detailId = detail_id;
    this.bookingId = booking_id;
    this.roomTypeId = room_type_id;
    this.quantity = quantity;
    this.unitPrice = unit_price;
    this.subtotal = subtotal;
    this.guestsPerRoom = guests_per_room;
  }

  toJSON() {
    return {
      detailId: this.detailId,
      bookingId: this.bookingId,
      roomTypeId: this.roomTypeId,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      subtotal: this.subtotal,
      guestsPerRoom: this.guestsPerRoom,
    };
  }
}

module.exports = BookingDetail;