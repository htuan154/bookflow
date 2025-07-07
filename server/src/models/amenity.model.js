class Amenity {
  constructor({ amenity_id, name, description, icon_url }) {
    this.amenityId = amenity_id;
    this.name = name;
    this.description = description;
    this.iconUrl = icon_url;
  }

  toJSON() {
    return {
      amenityId: this.amenityId,
      name: this.name,
      description: this.description,
      iconUrl: this.iconUrl,
    };
  }
}

module.exports = Amenity;