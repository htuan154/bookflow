class TouristLocationNearest {
  constructor({ location_id, name, description, city, image_url, latitude, longitude, created_by, created_at, distance_km }) {
    this.locationId = location_id;
    this.name = name;
    this.description = description;
    this.city = city;
    this.imageUrl = image_url;
    this.latitude = latitude;
    this.longitude = longitude;
    this.createdBy = created_by;
    this.createdAt = created_at;
    this.distanceKm = distance_km;
  }

  toJSON() {
    return {
      locationId: this.locationId,
      name: this.name,
      description: this.description,
      city: this.city,
      imageUrl: this.imageUrl,
      latitude: this.latitude,
      longitude: this.longitude,
      distanceKm: this.distanceKm,
    };
  }
}

module.exports = TouristLocationNearest;