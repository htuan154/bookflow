class ReviewImage {
    constructor({ image_id, review_id, image_url, uploaded_at }) {
        this.imageId = image_id;
        this.reviewId = review_id;
        this.imageUrl = image_url;
        this.uploadedAt = uploaded_at;
    }

    toJSON() {
        return {
            imageId: this.imageId,
            reviewId: this.reviewId,
            imageUrl: this.imageUrl,
        };
    }
}

module.exports = ReviewImage;