class PromotionUsage {
    constructor({ usage_id, promotion_id, user_id, booking_id, used_at }) {
        this.usageId = usage_id;
        this.promotionId = promotion_id;
        this.userId = user_id;
        this.bookingId = booking_id;
        this.usedAt = used_at;
    }

    toJSON() {
        return {
            usageId: this.usageId,
            promotionId: this.promotionId,
            userId: this.userId,
            bookingId: this.bookingId,
            usedAt: this.usedAt,
        };
    }
}

module.exports = PromotionUsage;
