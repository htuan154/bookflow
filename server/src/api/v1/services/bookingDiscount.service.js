const BookingDiscountRepo = require('../repositories/bookingDiscount.repository');

module.exports = {
  async getByBookingId(bookingId) {
    return await BookingDiscountRepo.findByBookingId(bookingId);
  },

  async create(data) {
    return await BookingDiscountRepo.create(data);
  }
};
