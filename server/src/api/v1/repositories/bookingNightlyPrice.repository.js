const pool = require('../../../config/db');
const BookingNightlyPrice = require('../../../models/bookingNightlyPrice.model');

const TABLE = 'booking_nightly_prices';

module.exports = {
  async findByBookingId(bookingId) {
    const res = await pool.query(
      `SELECT * FROM ${TABLE} WHERE booking_id = $1 ORDER BY stay_date ASC`,
      [bookingId]
    );
    return res.rows.map(row => new BookingNightlyPrice(row));
  },

  async create(data) {
    console.log('📥 BookingNightlyPrice.repository.create - Input data:', data);
    
    const {
      booking_id,
      booking_detail_id,
      room_type_id,
      stay_date,
      quantity,
      base_rate,
      season_pricing_id,
      season_multiplier
    } = data;

    console.log('📊 Parsed values:', {
      booking_id,
      booking_detail_id,
      room_type_id,
      stay_date,
      quantity,
      base_rate,
      season_pricing_id,
      season_multiplier
    });

    const res = await pool.query(
      `INSERT INTO ${TABLE} (
        booking_id, booking_detail_id, room_type_id, stay_date, quantity, base_rate, season_pricing_id, season_multiplier
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [booking_id, booking_detail_id, room_type_id, stay_date, quantity, base_rate, season_pricing_id, season_multiplier]
    );
    
    console.log('✅ Created nightly price:', res.rows[0]);
    
    return new BookingNightlyPrice(res.rows[0]);
  }
};
