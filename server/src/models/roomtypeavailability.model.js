class RoomTypeAvailability {
  constructor({
    hotel_id,
    room_type_id,
    room_type_name,
    number_of_rooms,
    total_rooms_booked,
    available_rooms,
    max_occupancy
  }) {
    this.hotelId = hotel_id;
    this.roomTypeId = room_type_id;
    this.roomTypeName = room_type_name;
    this.numberOfRooms = number_of_rooms;
    this.totalRoomsBooked = total_rooms_booked;
    this.availableRooms = available_rooms;
    this.maxOccupancy = max_occupancy;
  }

  toJSON() {
    return {
      hotelId: this.hotelId,
      roomTypeId: this.roomTypeId,
      roomTypeName: this.roomTypeName,
      numberOfRooms: this.numberOfRooms,
      totalRoomsBooked: this.totalRoomsBooked,
      availableRooms: this.availableRooms,
      maxOccupancy: this.maxOccupancy,
    };
  }
}

module.exports = RoomTypeAvailability;