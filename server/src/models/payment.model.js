// src/models/payment.model.js
class Payment {
  constructor({
    payment_id,
    booking_id,
    hotel_id,
    gross_amount,
    pg_fee_amount,
    admin_fee_amount,
    hotel_net_amount,
    status,
    tx_ref,
    paid_at,
    note,
    created_at,
  }) {
    this.paymentId = payment_id;
    this.bookingId = booking_id;
    this.hotelId = hotel_id;
    this.grossAmount = gross_amount;
    this.pgFeeAmount = pg_fee_amount;
    this.adminFeeAmount = admin_fee_amount;
    this.hotelNetAmount = hotel_net_amount;
    this.status = status;
    this.txRef = tx_ref || null;
    this.paidAt = paid_at || null;
    this.note = note || null;
    this.createdAt = created_at;
  }

  static fromDB(row) { return new Payment(row); }

  toJSON() {
    return {
      paymentId: this.paymentId,
      bookingId: this.bookingId,
      hotelId: this.hotelId,
      grossAmount: this.grossAmount,
      pgFeeAmount: this.pgFeeAmount,
      adminFeeAmount: this.adminFeeAmount,
      hotelNetAmount: this.hotelNetAmount,
      status: this.status,
      txRef: this.txRef,
      paidAt: this.paidAt,
      note: this.note,
      createdAt: this.createdAt,
    };
  }

  toDBObject() {
    return {
      payment_id: this.paymentId,
      booking_id: this.bookingId,
      hotel_id: this.hotelId,
      gross_amount: this.grossAmount,
      pg_fee_amount: this.pgFeeAmount,
      admin_fee_amount: this.adminFeeAmount,
      hotel_net_amount: this.hotelNetAmount,
      status: this.status,
      tx_ref: this.txRef,
      paid_at: this.paidAt,
      note: this.note,
      created_at: this.createdAt,
    };
  }
}

module.exports = Payment;
