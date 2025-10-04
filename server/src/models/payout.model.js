// src/models/payout.model.js
class Payout {
  constructor({
    payout_id,
    hotel_id,
    cover_date,
    scheduled_at,
    total_net_amount,
    status,
    note,
    created_at,
  }) {
    this.payoutId = payout_id;
    this.hotelId = hotel_id;
    this.coverDate = cover_date; // DATE
    this.scheduledAt = scheduled_at;
    this.totalNetAmount = total_net_amount;
    this.status = status;
    this.note = note || null;
    this.createdAt = created_at;
  }

  static fromDB(row) { return new Payout(row); }

  toJSON() {
    return {
      payoutId: this.payoutId,
      hotelId: this.hotelId,
      coverDate: this.coverDate,
      scheduledAt: this.scheduledAt,
      totalNetAmount: this.totalNetAmount,
      status: this.status,
      note: this.note,
      createdAt: this.createdAt,
    };
  }

  toDBObject() {
    return {
      payout_id: this.payoutId,
      hotel_id: this.hotelId,
      cover_date: this.coverDate,
      scheduled_at: this.scheduledAt,
      total_net_amount: this.totalNetAmount,
      status: this.status,
      note: this.note,
      created_at: this.createdAt,
    };
  }
}

module.exports = Payout;
