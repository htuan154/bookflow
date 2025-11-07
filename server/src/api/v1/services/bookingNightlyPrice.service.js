const BookingNightlyPriceRepo = require('../repositories/bookingNightlyPrice.repository');

module.exports = {
  async getByBookingId(bookingId) {
    return await BookingNightlyPriceRepo.findByBookingId(bookingId);
  },

  async create(data) {
    return await BookingNightlyPriceRepo.create(data);
  }
};
