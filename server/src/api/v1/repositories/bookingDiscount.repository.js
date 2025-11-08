const pool = require('../../../config/db');
const BookingDiscount = require('../../../models/bookingDiscount.model');

const TABLE = 'booking_discounts';

module.exports = {
  async findByBookingId(bookingId) {
    const res = await pool.query(
      `SELECT * FROM ${TABLE} WHERE booking_id = $1 ORDER BY created_at DESC`,
      [bookingId]
    );
    return res.rows.map(row => new BookingDiscount(row));
  },

  async create(data) {
    const {
      booking_id,
      bookingId,
      promotion_id,
      promotionId,
      gross_amount_snapshot,
      grossAmountSnapshot,
      discount_type,
      discountType,
      discount_value,
      discountValue,
      discount_applied,
      discountApplied
    } = data;
    
    // Support both snake_case and camelCase
    const finalBookingId = booking_id || bookingId;
    const finalPromotionId = promotion_id || promotionId;
    const finalGrossAmount = gross_amount_snapshot || grossAmountSnapshot;
    const finalDiscountType = discount_type || discountType;
    const finalDiscountValue = discount_value || discountValue;
    const finalDiscountApplied = discount_applied || discountApplied;
    
    const res = await pool.query(
      `INSERT INTO ${TABLE} (
        booking_id, promotion_id, gross_amount_snapshot, discount_type, discount_value, discount_applied
      ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [finalBookingId, finalPromotionId, finalGrossAmount, finalDiscountType, finalDiscountValue, finalDiscountApplied]
    );
    return new BookingDiscount(res.rows[0]);
  }
};
