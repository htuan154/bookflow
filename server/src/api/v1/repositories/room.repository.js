const db = require('../../../config/db');
const Room = require('../../../models/room.model');

class RoomRepository {
  // Create a new room
  async create(roomData) {
    const query = `
      INSERT INTO rooms (room_type_id, room_number, floor_number, status)
      VALUES (?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.execute(query, [
        roomData.roomTypeId,
        roomData.roomNumber,
        roomData.floorNumber,
        roomData.status || 'available'
      ]);
      
      return await this.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error creating room: ${error.message}`);
    }
  }

  // Find room by ID
  async findById(roomId) {
    const query = `
      SELECT room_id, room_type_id, room_number, floor_number, status, created_at
      FROM rooms
      WHERE room_id = ?
    `;
    
    try {
      const [rows] = await db.execute(query, [roomId]);
      return rows.length > 0 ? new Room(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding room: ${error.message}`);
    }
  }

  // Find all rooms
  async findAll() {
    const query = `
      SELECT room_id, room_type_id, room_number, floor_number, status, created_at
      FROM rooms
      ORDER BY room_number
    `;
    
    try {
      const [rows] = await db.execute(query);
      return rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding rooms: ${error.message}`);
    }
  }

  // Find rooms by hotel ID
  async findByHotelId(hotelId) {
    const query = `
      SELECT r.room_id, r.room_type_id, r.room_number, r.floor_number, r.status, r.created_at
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE rt.hotel_id = ?
      ORDER BY r.room_number
    `;
    
    try {
      const [rows] = await db.execute(query, [hotelId]);
      return rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding rooms by hotel: ${error.message}`);
    }
  }

  // Find rooms by room type ID
  async findByRoomTypeId(roomTypeId) {
    const query = `
      SELECT room_id, room_type_id, room_number, floor_number, status, created_at
      FROM rooms
      WHERE room_type_id = ?
      ORDER BY room_number
    `;
    
    try {
      const [rows] = await db.execute(query, [roomTypeId]);
      return rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding rooms by room type: ${error.message}`);
    }
  }

  // Find available rooms by hotel and date range
  async findAvailableRooms(hotelId, checkInDate, checkOutDate) {
    const query = `
      SELECT r.room_id, r.room_type_id, r.room_number, r.floor_number, r.status, r.created_at
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE rt.hotel_id = ? 
        AND r.status = 'available'
        AND r.room_id NOT IN (
          SELECT DISTINCT b.room_id
          FROM bookings b
          WHERE b.status IN ('confirmed', 'checked_in')
            AND NOT (
              b.check_out_date <= ? OR 
              b.check_in_date >= ?
            )
        )
      ORDER BY r.room_number
    `;
    
    try {
      const [rows] = await db.execute(query, [hotelId, checkInDate, checkOutDate]);
      return rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding available rooms: ${error.message}`);
    }
  }

  // Find rooms by status
  async findByStatus(status) {
    const query = `
      SELECT room_id, room_type_id, room_number, floor_number, status, created_at
      FROM rooms
      WHERE status = ?
      ORDER BY room_number
    `;
    
    try {
      const [rows] = await db.execute(query, [status]);
      return rows.map(row => new Room(row));
    } catch (error) {
      throw new Error(`Error finding rooms by status: ${error.message}`);
    }
  }

  // Update room
  async update(roomId, updateData) {
    const fields = [];
    const values = [];
    
    if (updateData.roomTypeId) {
      fields.push('room_type_id = ?');
      values.push(updateData.roomTypeId);
    }
    if (updateData.roomNumber) {
      fields.push('room_number = ?');
      values.push(updateData.roomNumber);
    }
    if (updateData.floorNumber) {
      fields.push('floor_number = ?');
      values.push(updateData.floorNumber);
    }
    if (updateData.status) {
      fields.push('status = ?');
      values.push(updateData.status);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE rooms SET ${fields.join(', ')} WHERE room_id = ?`;
    values.push(roomId);
    
    try {
      await db.execute(query, values);
      return await this.findById(roomId);
    } catch (error) {
      throw new Error(`Error updating room: ${error.message}`);
    }
  }

  // Update room status
  async updateStatus(roomId, status) {
    const query = 'UPDATE rooms SET status = ? WHERE room_id = ?';
    
    try {
      await db.execute(query, [status, roomId]);
      return await this.findById(roomId);
    } catch (error) {
      throw new Error(`Error updating room status: ${error.message}`);
    }
  }

  // Delete room
  async delete(roomId) {
    const query = 'DELETE FROM rooms WHERE room_id = ?';
    
    try {
      const [result] = await db.execute(query, [roomId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting room: ${error.message}`);
    }
  }

  // Check if room exists
  async exists(roomId) {
    const query = 'SELECT 1 FROM rooms WHERE room_id = ?';
    
    try {
      const [rows] = await db.execute(query, [roomId]);
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking room existence: ${error.message}`);
    }
  }

  // Check if room number exists in hotel
  async roomNumberExists(roomNumber, hotelId, excludeRoomId = null) {
    let query = `
      SELECT 1 FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_number = ? AND rt.hotel_id = ?
    `;
    const params = [roomNumber, hotelId];
    
    if (excludeRoomId) {
      query += ' AND r.room_id != ?';
      params.push(excludeRoomId);
    }
    
    try {
      const [rows] = await db.execute(query, params);
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking room number existence: ${error.message}`);
    }
  }

  // Get room statistics by hotel
  async getRoomStatsByHotel(hotelId) {
    const query = `
      SELECT 
        r.status,
        COUNT(*) as count
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE rt.hotel_id = ?
      GROUP BY r.status
      ORDER BY r.status
    `;
    
    try {
      const [rows] = await db.execute(query, [hotelId]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting room statistics: ${error.message}`);
    }
  }

  // Get room with related information (separate method for detailed view)
  async findByIdWithDetails(roomId) {
    const query = `
      SELECT 
        r.room_id, r.room_type_id, r.room_number, r.floor_number, r.status, r.created_at,
        rt.name as room_type_name, rt.price, rt.capacity, rt.description,
        h.name as hotel_name, h.hotel_id
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      JOIN hotels h ON rt.hotel_id = h.hotel_id
      WHERE r.room_id = ?
    `;
    
    try {
      const [rows] = await db.execute(query, [roomId]);
      if (rows.length === 0) return null;
      
      const roomData = rows[0];
      const room = new Room(roomData);
      
      // Add additional details as separate properties
      room.roomTypeDetails = {
        name: roomData.room_type_name,
        price: roomData.price,
        capacity: roomData.capacity,
        description: roomData.description
      };
      
      room.hotelDetails = {
        id: roomData.hotel_id,
        name: roomData.hotel_name
      };
      
      return room;
    } catch (error) {
      throw new Error(`Error finding room with details: ${error.message}`);
    }
  }
}

module.exports = RoomRepository;