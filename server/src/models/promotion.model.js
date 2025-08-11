class Promotion {
  constructor({
    promotion_id, hotel_id, code, name, description, discount_value,
    min_booking_price, valid_from, valid_until, usage_limit,
    used_count, status, created_by, created_at , promotion_type
  }) {
    this.promotionId = promotion_id;
    this.hotelId = hotel_id;
    this.code = code;
    this.name = name;
    this.description = description;
    this.discountValue = discount_value;
    this.minBookingPrice = min_booking_price;
    this.validFrom = valid_from;
    this.validUntil = valid_until;
    this.usageLimit = usage_limit;
    this.usedCount = used_count;
    this.status = status;
    this.createdBy = created_by;
    this.createdAt = created_at;
    this.promotionType = promotion_type;
    this.maxDiscountAmount = arguments[0].max_discount_amount;
  }

  toJSON() {
    return {
      promotionId: this.promotionId,
      hotelId: this.hotelId,
      code: this.code,
      name: this.name,
      description: this.description,
      discountValue: this.discountValue,
      minBookingPrice: this.minBookingPrice,
      validFrom: this.validFrom,
      validUntil: this.validUntil,
      usageLimit: this.usageLimit,
      usedCount: this.usedCount,
      status: this.status,
      promotionType: this.promotionType,
      maxDiscountAmount: this.maxDiscountAmount,
    };
  }
}

module.exports = Promotion;