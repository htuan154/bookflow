// src/models/admin_daily_revenue_by_hotel.model.js
class AdminDailyRevenueByHotelItem {
  constructor(row) {
    this.bizDateVn = row.biz_date_vn; // date
    this.hotelId = row.hotel_id;
    this.hotelName = row.hotel_name;
    this.hotelCity = row.hotel_city;
    this.bookingsCount = Number(row.bookings_count || 0);
    this.grossSum = row.gross_sum;
    this.pgFeeSum = row.pg_fee_sum;
    this.adminFeeSum = row.admin_fee_sum;
    this.hotelNetSum = row.hotel_net_sum;
  }

  static fromDB(row) { return new AdminDailyRevenueByHotelItem(row); }
}

module.exports = AdminDailyRevenueByHotelItem;
