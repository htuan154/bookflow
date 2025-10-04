// src/models/admin_payouts_overview.model.js
class AdminPayoutOverviewItem {
  constructor(row) {
    this.payoutId = row.payout_id;
    this.createdAt = row.created_at;
    this.scheduledAt = row.scheduled_at;
    this.coverDate = row.cover_date;
    this.status = row.status;

    this.hotelId = row.hotel_id;
    this.hotelName = row.hotel_name;
    this.hotelCity = row.hotel_city;

    this.totalNetAmount = row.total_net_amount;
    this.note = row.note || null;
  }

  static fromDB(row) { return new AdminPayoutOverviewItem(row); }
}

module.exports = AdminPayoutOverviewItem;
