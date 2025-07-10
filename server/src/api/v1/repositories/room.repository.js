const pool = require('../../../config/db');
const Room = require('../../../models/room.model');

class RoomRepository {
  async create(roomData) {
    const query = `
      INSERT INTO rooms (room_type_id, room_number, floor_number, status)
      VALUES ($1, $2, $3, $4)
      RETURNING room_id
    `;

    try {
      const result = await pool.query(query, [
        roomData.roomTypeId,
        roomData.roomNumber,
        roomData.floorNumber,
        roomData.status || 'available'
      ]);
      return await this.findById(result.rows[0].room_id);
    } catch (error) {
      throw new Error(`Error creating room: ${error.message}`);
    }
  }

  async findById(roomId) {
    const query = `
      SELECT room_id, room_type_id, room_number, floor_number, status, created_at
      FROM rooms
      WHERE room_id = $1
    `;

    try {
      const result = await pool.query(query, [roomId]);
      return result.rows.length > 0 ? new Room(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding room: ${error.message}`);
    }
  }

  async findAll() {
    const query = `
      SELECT room_id, room_type_id, room_number, floor_number, status, created_at
      FROM rooms
      ORDER BY room_number
    `;

    try {
      const result = await pool.query(query);
      return result.rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding rooms: ${error.message}`);
    }
  }

  async findByHotelId(hotelId) {
    const query = `
      SELECT r.room_id, r.room_type_id, r.room_number, r.floor_number, r.status, r.created_at
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE rt.hotel_id = $1
      ORDER BY r.room_number
    `;

    try {
      const result = await pool.query(query, [hotelId]);
      return result.rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding rooms by hotel: ${error.message}`);
    }
  }

  async findByRoomTypeId(roomTypeId) {
    const query = `
      SELECT room_id, room_type_id, room_number, floor_number, status, created_at
      FROM rooms
      WHERE room_type_id = $1
      ORDER BY room_number
    `;

    try {
      const result = await pool.query(query, [roomTypeId]);
      return result.rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding rooms by room type: ${error.message}`);
    }
  }

  async findAvailableRooms(hotelId, checkInDate, checkOutDate) {
    const query = `
      SELECT r.room_id, r.room_type_id, r.room_number, r.floor_number, r.status, r.created_at
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE rt.hotel_id = $1 
        AND r.status = 'available'
        AND r.room_id NOT IN (
          SELECT DISTINCT b.room_id
          FROM bookings b
          WHERE b.status IN ('confirmed', 'checked_in')
            AND NOT (
              b.check_out_date <= $2 OR 
              b.check_in_date >= $3
            )
        )
      ORDER BY r.room_number
    `;

    try {
      const result = await pool.query(query, [hotelId, checkInDate, checkOutDate]);
      return result.rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding available rooms: ${error.message}`);
    }
  }

  async findByStatus(status) {
    const query = `
      SELECT room_id, room_type_id, room_number, floor_number, status, created_at
      FROM rooms
      WHERE status = $1
      ORDER BY room_number
    `;

    try {
      const result = await pool.query(query, [status]);
      return result.rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding rooms by status: ${error.message}`);
    }
  }

  async update(roomId, updateData) {
    const fields = [];
    const values = [];
    let index = 1;

    if (updateData.roomTypeId) {
      fields.push(`room_type_id = $${index++}`);
      values.push(updateData.roomTypeId);
    }
    if (updateData.roomNumber) {
      fields.push(`room_number = $${index++}`);
      values.push(updateData.roomNumber);
    }
    if (updateData.floorNumber) {
      fields.push(`floor_number = $${index++}`);
      values.push(updateData.floorNumber);
    }
    if (updateData.status) {
      fields.push(`status = $${index++}`);
      values.push(updateData.status);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `UPDATE rooms SET ${fields.join(', ')} WHERE room_id = $${index}`;
    values.push(roomId);

    try {
      await pool.query(query, values);
      return await this.findById(roomId);
    } catch (error) {
      throw new Error(`Error updating room: ${error.message}`);
    }
  }

  async updateStatus(roomId, status) {
    const query = `UPDATE rooms SET status = $1 WHERE room_id = $2`;

    try {
      await pool.query(query, [status, roomId]);
      return await this.findById(roomId);
    } catch (error) {
      throw new Error(`Error updating room status: ${error.message}`);
    }
  }

  async delete(roomId) {
    const query = `DELETE FROM rooms WHERE room_id = $1`;

    try {
      const result = await pool.query(query, [roomId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Error deleting room: ${error.message}`);
    }
  }

  async exists(roomId) {
    const query = `SELECT 1 FROM rooms WHERE room_id = $1`;

    try {
      const result = await pool.query(query, [roomId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking room existence: ${error.message}`);
    }
  }

  async roomNumberExists(roomNumber, hotelId, excludeRoomId = null) {
    let query = `
      SELECT 1 FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_number = $1 AND rt.hotel_id = $2
    `;
    const params = [roomNumber, hotelId];

    if (excludeRoomId) {
      query += ` AND r.room_id != $3`;
      params.push(excludeRoomId);
    }

    try {
      const result = await pool.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking room number existence: ${error.message}`);
    }
  }

  async getRoomStatsByHotel(hotelId) {
    const query = `
      SELECT 
        r.status,
        COUNT(*) as count
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE rt.hotel_id = $1
      GROUP BY r.status
      ORDER BY r.status
    `;

    try {
      const result = await pool.query(query, [hotelId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting room statistics: ${error.message}`);
    }
  }

  async findByIdWithDetails(roomId) {
    const query = `
      SELECT 
        r.room_id, r.room_type_id, r.room_number, r.floor_number, r.status, r.created_at,
        rt.name as room_type_name, rt.price, rt.capacity, rt.description,
        h.name as hotel_name, h.hotel_id
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      JOIN hotels h ON rt.hotel_id = h.hotel_id
      WHERE r.room_id = $1
    `;

    try {
      const result = await pool.query(query, [roomId]);
      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const room = new Room(row);
      room.roomTypeDetails = {
        name: row.room_type_name,
        price: row.price,
        capacity: row.capacity,
        description: row.description
      };
      room.hotelDetails = {
        id: row.hotel_id,
        name: row.hotel_name
      };

      return room;
    } catch (error) {
      throw new Error(`Error finding room with details: ${error.message}`);
    }
  }
}

module.exports = RoomRepository;
