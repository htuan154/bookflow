class FoodRecommendation {
    constructor({ food_id, location_id, name, description, image_url, latitude, longitude, created_at }) {
        this.foodId = food_id;
        this.locationId = location_id;
        this.name = name;
        this.description = description;
        this.imageUrl = image_url;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = created_at;
    }

    toJSON() {
        return {
            foodId: this.foodId,
            locationId: this.locationId,
            name: this.name,
            description: this.description,
            imageUrl: this.imageUrl,
            latitude: this.latitude,
            longitude: this.longitude,
        };
    }
}

module.exports = FoodRecommendation;