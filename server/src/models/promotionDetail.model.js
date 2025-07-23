// src/models/promotionDetail.model.js

class PromotionDetail {
constructor({
    detail_id,
    promotion_id,
    room_type_id,
    discount_type,
    discount_value,
    created_at
}) {
    this.detailId = detail_id;
    this.promotionId = promotion_id;
    this.roomTypeId = room_type_id;
    this.discountType = discount_type;
    this.discountValue = discount_value;
    this.createdAt = created_at;
}

toJSON() {
    return {
    detailId: this.detailId,
    promotionId: this.promotionId,
    roomTypeId: this.roomTypeId,
    discountType: this.discountType,
    discountValue: this.discountValue,
    createdAt: this.createdAt,
    };
}
}

module.exports = PromotionDetail;
