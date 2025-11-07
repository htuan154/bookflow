const BookingDiscountService = require('../services/bookingDiscount.service');

module.exports = {
  async getByBookingId(req, res) {
    try {
      const { bookingId } = req.params;
      const discounts = await BookingDiscountService.getByBookingId(bookingId);
      res.json({ success: true, data: discounts.map(d => d.toJSON()) });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const discount = await BookingDiscountService.create(req.body);
      res.json({ success: true, data: discount.toJSON() });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
