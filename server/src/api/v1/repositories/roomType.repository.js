const db = require('../../../config/db');
const RoomType = require('../../../models/roomType.model');

class RoomTypeRepository {
  // Tạo room type mới
  async create(roomTypeData) {
    const query = `
      INSERT INTO room_types (hotel_id, name, description, max_occupancy, base_price, number_of_rooms, bed_type, area_sqm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
      const [result] = await db.execute(query, values);
      return await this.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error creating room type: ${error.message}`);
    }
  }

  // Lấy tất cả room types
  async findAll() {
    const query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
      ORDER BY rt.created_at DESC
    `;

    try {
      const [rows] = await db.execute(query);
      return rows.map(row => new RoomType(row));
    } catch (error) {
      throw new Error(`Error fetching room types: ${error.message}`);
    }
  }

  // Lấy room type theo ID
  async findById(roomTypeId) {
    const query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
      WHERE rt.room_type_id = ?
    `;

    try {
      const [rows] = await db.execute(query, [roomTypeId]);
      if (rows.length === 0) {
        return null;
      }
      return new RoomType(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching room type: ${error.message}`);
    }
  }

  // Lấy room types theo hotel ID
  async findByHotelId(hotelId) {
    const query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
      WHERE rt.hotel_id = ?
      ORDER BY rt.created_at DESC
    `;

    try {
      const [rows] = await db.execute(query, [hotelId]);
      return rows.map(row => new RoomType(row));
    } catch (error) {
      throw new Error(`Error fetching room types by hotel: ${error.message}`);
    }
  }

  // Cập nhật room type
  async update(roomTypeId, updateData) {
    const allowedFields = ['name', 'description', 'max_occupancy', 'base_price', 'number_of_rooms', 'bed_type', 'area_sqm'];
    const updateFields = [];
    const values = [];

    // Chỉ update những field được phép và có giá trị
    Object.keys(updateData).forEach(key => {
      const dbField = this.camelToSnake(key);
      if (allowedFields.includes(dbField) && updateData[key] !== undefined) {
        updateFields.push(`${dbField} = ?`);
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
      WHERE room_type_id = ?
    `;

    try {
      const [result] = await db.execute(query, values);
      if (result.affectedRows === 0) {
        return null;
      }
      return await this.findById(roomTypeId);
    } catch (error) {
      throw new Error(`Error updating room type: ${error.message}`);
    }
  }

  // Xóa room type
  async delete(roomTypeId) {
    const query = 'DELETE FROM room_types WHERE room_type_id = ?';

    try {
      const [result] = await db.execute(query, [roomTypeId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting room type: ${error.message}`);
    }
  }

  // Kiểm tra room type có tồn tại không
  async exists(roomTypeId) {
    const query = 'SELECT 1 FROM room_types WHERE room_type_id = ?';
    
    try {
      const [rows] = await db.execute(query, [roomTypeId]);
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking room type existence: ${error.message}`);
    }
  }

  // Lấy room types với phân trang
  async findWithPagination(page = 1, limit = 10, hotelId = null) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM room_types rt';
    let values = [];

    if (hotelId) {
      query += ' WHERE rt.hotel_id = ?';
      countQuery += ' WHERE rt.hotel_id = ?';
      values.push(hotelId);
    }

    query += ' ORDER BY rt.created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    try {
      const [rows] = await db.execute(query, values);
      const [countRows] = await db.execute(countQuery, hotelId ? [hotelId] : []);
      
      return {
        data: rows.map(row => new RoomType(row)),
        pagination: {
          page,
          limit,
          total: countRows[0].total,
          totalPages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching room types with pagination: ${error.message}`);
    }
  }

  // Tìm kiếm room types
  async search(searchTerm, hotelId = null) {
    let query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.hotel_id
      WHERE (rt.name LIKE ? OR rt.description LIKE ? OR rt.bed_type LIKE ?)
    `;
    
    let values = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

    if (hotelId) {
      query += ' AND rt.hotel_id = ?';
      values.push(hotelId);
    }

    query += ' ORDER BY rt.created_at DESC';

    try {
      const [rows] = await db.execute(query, values);
      return rows.map(row => new RoomType(row));
    } catch (error) {
      throw new Error(`Error searching room types: ${error.message}`);
    }
  }

  // Helper method: chuyển đổi camelCase sang snake_case
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = new RoomTypeRepository();