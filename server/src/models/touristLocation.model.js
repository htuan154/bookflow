class TouristLocation {
  constructor({ location_id, name, description, city, image_url, created_by, created_at }) {
    this.locationId = location_id;
    this.name = name;
    this.description = description;
    this.city = city;
    this.imageUrl = image_url;
    this.createdBy = created_by;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      locationId: this.locationId,
      name: this.name,
      description: this.description,
      city: this.city,
      imageUrl: this.imageUrl,
    };
  }
}

module.exports = TouristLocation;