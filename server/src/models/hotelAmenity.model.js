class HotelAmenity {
    constructor({ hotel_id, amenity_id, name, description, icon_url }) {
        this.hotelId = hotel_id;
        this.amenityId = amenity_id;
        this.name = name;
        this.description = description;
        this.iconUrl = icon_url;
    }

    toJSON() {
        return {
            hotelId: this.hotelId,
            amenityId: this.amenityId,
            name: this.name,
            description: this.description,
            iconUrl: this.iconUrl,
        };
    }
}

module.exports = HotelAmenity;