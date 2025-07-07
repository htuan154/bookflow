class Hotel {
  constructor({
    hotel_id,
    owner_id,
    name,
    description,
    address,
    city,
    star_rating,
    phone_number,
    email,
    check_in_time,
    check_out_time,
    status,
    average_rating,
    total_reviews,
    created_at,
  }) {
    this.hotelId = hotel_id;
    this.ownerId = owner_id;
    this.name = name;
    this.description = description;
    this.address = address;
    this.city = city;
    this.starRating = star_rating;
    this.phoneNumber = phone_number;
    this.email = email;
    this.checkInTime = check_in_time;
    this.checkOutTime = check_out_time;
    this.status = status;
    this.averageRating = average_rating;
    this.totalReviews = total_reviews;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      hotelId: this.hotelId,
      ownerId: this.ownerId,
      name: this.name,
      description: this.description,
      address: this.address,
      city: this.city,
      starRating: this.starRating,
      phoneNumber: this.phoneNumber,
      email: this.email,
      checkInTime: this.checkInTime,
      checkOutTime: this.checkOutTime,
      status: this.status,
      averageRating: this.averageRating,
      totalReviews: this.totalReviews,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Hotel;