class Room {
  constructor({ room_id, room_type_id, room_number, floor_number, status, created_at }) {
    this.roomId = room_id;
    this.roomTypeId = room_type_id;
    this.roomNumber = room_number;
    this.floorNumber = floor_number;
    this.status = status;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      roomId: this.roomId,
      roomTypeId: this.roomTypeId,
      roomNumber: this.roomNumber,
      floorNumber: this.floorNumber,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Room;