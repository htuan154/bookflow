class RoomType {
  constructor({
    room_type_id,
    hotel_id,
    name,
    description,
    max_occupancy,
    base_price,
    number_of_rooms,
    bed_type,
    area_sqm,
    created_at,
  }) {
    this.roomTypeId = room_type_id;
    this.hotelId = hotel_id;
    this.name = name;
    this.description = description;
    this.maxOccupancy = max_occupancy;
    this.basePrice = base_price;
    this.numberOfRooms = number_of_rooms;
    this.bedType = bed_type;
    this.areaSqm = area_sqm;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      roomTypeId: this.roomTypeId,
      hotelId: this.hotelId,
      name: this.name,
      description: this.description,
      maxOccupancy: this.maxOccupancy,
      basePrice: this.basePrice,
      numberOfRooms: this.numberOfRooms,
      bedType: this.bedType,
      areaSqm: this.areaSqm,
      createdAt: this.createdAt,
    };
  }
}

module.exports = RoomType;