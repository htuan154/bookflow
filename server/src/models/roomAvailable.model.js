// src/models/roomAvailable.model.js

class RoomAvailable {
    constructor({ room_id, room_number }) {
        this.room_id = room_id;
        this.room_number = room_number;
    }
}

module.exports = RoomAvailable;
