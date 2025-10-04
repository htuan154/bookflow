// src/models/hotel_owner_payment_list.model.js
class HotelOwnerPaymentListItem {
  constructor(row) {
    this.paymentId = row.payment_id;
    this.createdAt = row.created_at;
    this.paidAt = row.paid_at;
    this.bizDateVn = row.biz_date_vn; // date (Asia/Ho_Chi_Minh)
    this.status = row.status;

    this.bookingId = row.booking_id;
    this.guestId = row.guest_id;      // từ bookings.user_id
    this.checkInDate = row.check_in_date;
    this.checkOutDate = row.check_out_date;

    this.hotelId = row.hotel_id;
    this.hotelName = row.hotel_name;
    this.hotelCity = row.hotel_city;

    this.baseAmount = row.base_amount;
    this.surchargeAmount = row.surcharge_amount || 0;
    this.discountAmount = row.discount_amount || 0;
    this.finalAmount = row.final_amount;
    this.pgFeeAmount = row.pg_fee_amount || 0;
    this.adminFeeAmount = row.admin_fee_amount || 0;
    this.hotelNetAmount = row.hotel_net_amount;
    this.txRef = row.tx_ref || null;
  }

  static fromDB(row) {
    return new HotelOwnerPaymentListItem(row);
  }
}

module.exports = HotelOwnerPaymentListItem;
