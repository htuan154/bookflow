class BookingNightlyPrice {
  constructor({
    price_id, booking_id, booking_detail_id, room_type_id,
    stay_date, quantity, base_rate, season_pricing_id, season_multiplier,
    gross_nightly_price, gross_nightly_total, created_at
  }) {
    this.priceId = price_id;
    this.bookingId = booking_id;
    this.bookingDetailId = booking_detail_id;
    this.roomTypeId = room_type_id;
    this.stayDate = stay_date;
    this.quantity = quantity;
    this.baseRate = base_rate;
    this.seasonPricingId = season_pricing_id;
    this.seasonMultiplier = season_multiplier;
    this.grossNightlyPrice = gross_nightly_price;
    this.grossNightlyTotal = gross_nightly_total;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      priceId: this.priceId,
      bookingId: this.bookingId,
      bookingDetailId: this.bookingDetailId,
      roomTypeId: this.roomTypeId,
      stayDate: this.stayDate,
      quantity: this.quantity,
      baseRate: this.baseRate,
      seasonPricingId: this.seasonPricingId,
      seasonMultiplier: this.seasonMultiplier,
      grossNightlyPrice: this.grossNightlyPrice,
      grossNightlyTotal: this.grossNightlyTotal,
      createdAt: this.createdAt
    };
  }
}

module.exports = BookingNightlyPrice;
