class Booking {
  constructor({
    booking_id,
    user_id,
    hotel_id,
    check_in_date,
    check_out_date,
    nights,
    actual_check_in_date,
    actual_check_out_date,
    total_guests,
    total_price,
    booking_status,
    payment_status,
    payment_method,
    promotion_id,
    special_requests,
    booked_at,
    last_updated_at,
  }) {
    this.bookingId = booking_id;
    this.userId = user_id;
    this.hotelId = hotel_id;
    this.checkInDate = check_in_date;
    this.checkOutDate = check_out_date;
    this.nights = nights;
    this.actualCheckInDate = actual_check_in_date;
    this.actualCheckOutDate = actual_check_out_date;
    this.totalGuests = total_guests;
    this.totalPrice = total_price;
    this.bookingStatus = booking_status;
    this.paymentStatus = payment_status;
    this.paymentMethod = payment_method;
    this.promotionId = promotion_id;
    this.specialRequests = special_requests;
    this.bookedAt = booked_at;
    this.lastUpdatedAt = last_updated_at;
  }

  // Helper to format date to YYYY-MM-DD only (no timezone conversion)
  _formatDateOnly(date) {
    if (!date) return null;
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Already in YYYY-MM-DD format
      return date;
    }
    // If it's a Date object or ISO string, extract date part only
    const dateObj = date instanceof Date ? date : new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toJSON() {
    return {
      bookingId: this.bookingId,
      userId: this.userId,
      hotelId: this.hotelId,
      checkInDate: this._formatDateOnly(this.checkInDate),
      checkOutDate: this._formatDateOnly(this.checkOutDate),
      nights: this.nights,
      actualCheckInDate: this._formatDateOnly(this.actualCheckInDate),
      actualCheckOutDate: this._formatDateOnly(this.actualCheckOutDate),
      totalGuests: this.totalGuests,
      totalPrice: this.totalPrice,
      bookingStatus: this.bookingStatus,
      paymentStatus: this.paymentStatus,
      paymentMethod: this.paymentMethod,
      promotionId: this.promotionId,
      specialRequests: this.specialRequests,
      bookedAt: this.bookedAt,
      lastUpdatedAt: this.lastUpdatedAt,
    };
  }
}

module.exports = Booking;