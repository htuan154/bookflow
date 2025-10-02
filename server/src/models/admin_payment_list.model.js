// src/models/admin_payment_list.model.js
class AdminPaymentListItem {
  constructor(row) {
    this.paymentId = row.payment_id;
    this.createdAt = row.created_at;
    this.paidAt = row.paid_at;
    this.bizDateVn = row.biz_date_vn; // date
    this.status = row.status;

    this.bookingId = row.booking_id;
    this.guestId = row.guest_id;
    this.bookingTotalPrice = row.booking_total_price;
    this.checkInDate = row.check_in_date;
    this.checkOutDate = row.check_out_date;

    this.hotelId = row.hotel_id;
    this.hotelName = row.hotel_name;
    this.hotelCity = row.hotel_city;

    this.grossAmount = row.gross_amount;
    this.pgFeeAmount = row.pg_fee_amount;
    this.adminFeeAmount = row.admin_fee_amount;
    this.hotelNetAmount = row.hotel_net_amount;
    this.txRef = row.tx_ref || null;
    this.note = row.note || null;
  }

  static fromDB(row) { return new AdminPaymentListItem(row); }
}

module.exports = AdminPaymentListItem;
