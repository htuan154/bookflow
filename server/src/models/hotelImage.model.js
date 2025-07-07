class HotelImage {
    constructor({ image_id, hotel_id, image_url, caption, is_thumbnail, order_index, uploaded_at }) {
        this.imageId = image_id;
        this.hotelId = hotel_id;
        this.imageUrl = image_url;
        this.caption = caption;
        this.isThumbnail = is_thumbnail;
        this.orderIndex = order_index;
        this.uploadedAt = uploaded_at;
    }

    toJSON() {
        return {
            imageId: this.imageId,
            hotelId: this.hotelId,
            imageUrl: this.imageUrl,
            caption: this.caption,
            isThumbnail: this.isThumbnail,
        };
    }
}

module.exports = HotelImage;