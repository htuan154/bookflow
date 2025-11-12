// server/src/api/v1/controllers/bookingNightlyPrice.controller.js
const BookingNightlyPriceService = require('../services/bookingNightlyPrice.service');

module.exports = {
  async getByBookingId(req, res) {
    try {
      const { bookingId } = req.params;
      const prices = await BookingNightlyPriceService.getByBookingId(bookingId);
      res.json({ success: true, data: prices.map(p => p.toJSON()) });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const price = await BookingNightlyPriceService.create(req.body);
      res.json({ success: true, data: price.toJSON() });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
