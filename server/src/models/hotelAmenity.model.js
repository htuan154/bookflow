class HotelAmenity {
    constructor({ hotel_id, amenity_id }) {
        this.hotelId = hotel_id;
        this.amenityId = amenity_id;
    }

    toJSON() {
        return {
            hotelId: this.hotelId,
            amenityId: this.amenityId,
        };
    }
}

module.exports = HotelAmenity;