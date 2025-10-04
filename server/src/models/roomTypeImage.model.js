class RoomTypeImage {
    constructor({ image_id, room_type_id, image_url, caption, is_thumbnail, uploaded_at }) {
        this.imageId = image_id;
        this.roomTypeId = room_type_id;
        this.imageUrl = image_url;
        this.caption = caption;
        this.isThumbnail = is_thumbnail;
        this.uploadedAt = uploaded_at;
    }

    toJSON() {
        return {
            imageId: this.imageId,
            roomTypeId: this.roomTypeId,
            imageUrl: this.imageUrl,
            caption: this.caption,
            isThumbnail: this.isThumbnail,
            uploadedAt: this.uploadedAt, // Thêm trường này để FE nhận được ngày tải lên
        };
    }
}

module.exports = RoomTypeImage;