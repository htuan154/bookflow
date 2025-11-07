class BookingDiscount {
  constructor({
    booking_discount_id, booking_id, promotion_id,
    gross_amount_snapshot, discount_type, discount_value,
    discount_applied, final_amount, created_at
  }) {
    this.bookingDiscountId = booking_discount_id;
    this.bookingId = booking_id;
    this.promotionId = promotion_id;
    this.grossAmountSnapshot = gross_amount_snapshot;
    this.discountType = discount_type;
    this.discountValue = discount_value;
    this.discountApplied = discount_applied;
    this.finalAmount = final_amount;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      bookingDiscountId: this.bookingDiscountId,
      bookingId: this.bookingId,
      promotionId: this.promotionId,
      grossAmountSnapshot: this.grossAmountSnapshot,
      discountType: this.discountType,
      discountValue: this.discountValue,
      discountApplied: this.discountApplied,
      finalAmount: this.finalAmount,
      createdAt: this.createdAt
    };
  }
}

module.exports = BookingDiscount;
