const pool = require('../../../config/db');
const RoomType = require('../../../models/roomType.model');
const RoomRepository = require('../repositories/room.repository');
const roomRepository = new RoomRepository();

class RoomTypeRepository {
  async create(roomTypeData) {
    const query = `
      INSERT INTO room_types (
        hotel_id, name, description, max_occupancy, base_price, number_of_rooms, bed_type, area_sqm
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      roomTypeData.hotelId,
      roomTypeData.name,
      roomTypeData.description,
      roomTypeData.maxOccupancy,
      roomTypeData.basePrice,
      roomTypeData.numberOfRooms,
      roomTypeData.bedType,
      roomTypeData.areaSqm
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating room type: ${error.message}`);
    }
  }

  async findAll() {
    const query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
      ORDER BY rt.created_at DESC
    `;

    try {
      const result = await pool.query(query);
      return result.rows.map(row => new RoomType(row));
    } catch (error) {
      throw new Error(`Error fetching room types: ${error.message}`);
    }
  }

  async findById(roomTypeId) {
    const query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
      WHERE rt.room_type_id = $1
    `;

    try {
      const result = await pool.query(query, [roomTypeId]);
      if (result.rows.length === 0) return null;
      return new RoomType(result.rows[0]);
    } catch (error) {
      throw new Error(`Error fetching room type: ${error.message}`);
    }
  }

  async findByHotelId(hotelId) {
  const query = `
    SELECT 
      rt.room_type_id,
      rt.hotel_id,
      rt.name,
      rt.description,
      rt.max_occupancy,
      rt.base_price,
      rt.number_of_rooms,
      rt.bed_type,
      rt.area_sqm,
      rt.created_at,
      h.name AS hotel_name
    FROM room_types rt
    LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
    WHERE rt.hotel_id = $1
    ORDER BY rt.created_at DESC
  `;

  try {
    const result = await pool.query(query, [hotelId]);
    console.log("Raw room type row:", result.rows[0]);

    console.log('DEBUG row:', result.rows[0]); // ← kiểm tra field tên
    return result.rows.map(row => new RoomType(row));
  } catch (error) {
    throw new Error(`Error fetching room types by hotel: ${error.message}`);
  }
}

  async update(roomTypeId, updateData) {
    const allowedFields = [
      'name', 'description', 'max_occupancy', 'base_price',
      'number_of_rooms', 'bed_type', 'area_sqm'
    ];
    const updateFields = [];
    const values = [];

    Object.keys(updateData).forEach((key, index) => {
      const dbField = this.camelToSnake(key);
      if (allowedFields.includes(dbField) && updateData[key] !== undefined) {
        updateFields.push(`${dbField} = $${values.length + 1}`);
        values.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(roomTypeId);
    const query = `
      UPDATE room_types 
      SET ${updateFields.join(', ')} 
      WHERE room_type_id = $${values.length}
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating room type: ${error.message}`);
    }
  }

  async delete(roomTypeId) {
    const query = 'DELETE FROM room_types WHERE room_type_id = $1';
    try {
      const result = await pool.query(query, [roomTypeId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Error deleting room type: ${error.message}`);
    }
  }

  async exists(roomTypeId) {
    const query = 'SELECT 1 FROM room_types WHERE room_type_id = $1';
    try {
      const result = await pool.query(query, [roomTypeId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Error checking room type existence: ${error.message}`);
    }
  }

  async findWithPagination(page = 1, limit = 10, hotelId = null) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM room_types rt';
    const values = [];
    let whereClause = '';

    if (hotelId) {
      whereClause = ' WHERE rt.hotel_id = $1';
      query += whereClause;
      countQuery += whereClause;
      values.push(hotelId);
    }

    query += ` ORDER BY rt.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    try {
      const result = await pool.query(query, values);
      const countResult = await pool.query(countQuery, hotelId ? [hotelId] : []);
      const total = parseInt(countResult.rows[0].total, 10);

      return {
        data: result.rows.map(row => new RoomType(row)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching room types with pagination: ${error.message}`);
    }
  }

  async search(searchTerm, hotelId = null) {
    let query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
      WHERE (rt.name ILIKE $1 OR rt.description ILIKE $2 OR rt.bed_type ILIKE $3)
    `;
    const values = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

    if (hotelId) {
      query += ` AND rt.hotel_id = $4`;
      values.push(hotelId);
    }

    query += ' ORDER BY rt.created_at DESC';

    try {
      const result = await pool.query(query, values);
      return result.rows.map(row => new RoomType(row));
    } catch (error) {
      throw new Error(`Error searching room types: ${error.message}`);
    }
  }

  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = new RoomTypeRepository();