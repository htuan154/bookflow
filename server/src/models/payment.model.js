// src/models/payment.model.js
class Payment {
  constructor({
    payment_id,
    booking_id,
    hotel_id,
    base_amount,
    surcharge_amount,
    discount_amount,
    final_amount,
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
    this.baseAmount = base_amount;
    this.surchargeAmount = surcharge_amount || 0;
    this.discountAmount = discount_amount || 0;
    this.finalAmount = final_amount;
    this.pgFeeAmount = pg_fee_amount || 0;
    this.adminFeeAmount = admin_fee_amount || 0;
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
      baseAmount: this.baseAmount,
      surchargeAmount: this.surchargeAmount,
      discountAmount: this.discountAmount,
      finalAmount: this.finalAmount,
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
      base_amount: this.baseAmount,
      surcharge_amount: this.surchargeAmount,
      discount_amount: this.discountAmount,
      final_amount: this.finalAmount,
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
