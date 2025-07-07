class SeasonalPricing {
  constructor({ pricing_id, room_type_id, season_id, name, start_date, end_date, price_modifier }) {
    this.pricingId = pricing_id;
    this.roomTypeId = room_type_id;
    this.seasonId = season_id;
    this.name = name;
    this.startDate = start_date;
    this.endDate = end_date;
    this.priceModifier = price_modifier;
  }

  toJSON() {
    return {
      pricingId: this.pricingId,
      roomTypeId: this.roomTypeId,
      name: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      priceModifier: this.priceModifier,
    };
  }
}

module.exports = SeasonalPricing;