class HotelStaff {
  constructor({
    staff_id, hotel_id, user_id, job_position, start_date,
    end_date, status, contact, hired_by, created_at
  }) {
    this.staffId = staff_id;
    this.hotelId = hotel_id;
    this.userId = user_id;
    this.jobPosition = job_position;
    this.startDate = start_date;
    this.endDate = end_date;
    this.status = status;
    this.contact = contact;
    this.hiredBy = hired_by;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      staffId: this.staffId,
      hotelId: this.hotelId,
      userId: this.userId,
      jobPosition: this.jobPosition,
      status: this.status,
    };
  }
}

module.exports = HotelStaff;