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
      bookingId,
      promotionId,
      grossAmountSnapshot,
      discountType,
      discountValue,
      discountApplied
    } = data;
    const res = await pool.query(
      `INSERT INTO ${TABLE} (
        booking_id, promotion_id, gross_amount_snapshot, discount_type, discount_value, discount_applied
      ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [bookingId, promotionId, grossAmountSnapshot, discountType, discountValue, discountApplied]
    );
    return new BookingDiscount(res.rows[0]);
  }
};
