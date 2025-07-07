class PromotionUsage {
    constructor({ usage_id, promotion_id, user_id, booking_id, discount_amount, original_amount, final_amount, used_at, ip_address, user_agent }) {
        this.usageId = usage_id;
        this.promotionId = promotion_id;
        this.userId = user_id;
        this.bookingId = booking_id;
        this.discountAmount = discount_amount;
        this.originalAmount = original_amount;
        this.finalAmount = final_amount;
        this.usedAt = used_at;
        this.ipAddress = ip_address;
        this.userAgent = user_agent;
    }

    toJSON() {
        return {
            usageId: this.usageId,
            promotionId: this.promotionId,
            userId: this.userId,
            bookingId: this.bookingId,
            discountAmount: this.discountAmount,
        };
    }
}

module.exports = PromotionUsage;
