// src/models/admin_daily_revenue_by_hotel.model.js
class AdminDailyRevenueByHotelItem {
  constructor(row) {
    this.bizDateVn = row.biz_date_vn; // date
    this.hotelId = row.hotel_id;
    this.hotelName = row.hotel_name;
    this.hotelCity = row.hotel_city;
    this.bookingsCount = Number(row.bookings_count || 0);
    // Map database columns to model properties
    this.finalSum = parseFloat(row.final_sum || 0);
    this.pgFeeSum = parseFloat(row.pg_fee_sum || 0);
    this.adminFeeSum = parseFloat(row.admin_fee_sum || 0);
    this.hotelNetSum = parseFloat(row.hotel_net_sum || 0);
    // Payout existence flag
    this.exists_in_payouts = row.exists_in_payouts || false;
  }

  static fromDB(row) { return new AdminDailyRevenueByHotelItem(row); }
}

module.exports = AdminDailyRevenueByHotelItem;
