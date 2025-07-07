class Review {
  constructor({
    review_id,
    user_id,
    hotel_id,
    booking_id,
    rating,
    comment,
    cleanliness_rating,
    comfort_rating,
    service_rating,
    location_rating,
    value_rating,
    created_at,
  }) {
    this.reviewId = review_id;
    this.userId = user_id;
    this.hotelId = hotel_id;
    this.bookingId = booking_id;
    this.rating = rating;
    this.comment = comment;
    this.cleanlinessRating = cleanliness_rating;
    this.comfortRating = comfort_rating;
    this.serviceRating = service_rating;
    this.locationRating = location_rating;
    this.valueRating = value_rating;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      reviewId: this.reviewId,
      userId: this.userId,
      hotelId: this.hotelId,
      bookingId: this.bookingId,
      rating: this.rating,
      comment: this.comment,
      cleanlinessRating: this.cleanlinessRating,
      comfortRating: this.comfortRating,
      serviceRating: this.serviceRating,
      locationRating: this.locationRating,
      valueRating: this.valueRating,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Review;