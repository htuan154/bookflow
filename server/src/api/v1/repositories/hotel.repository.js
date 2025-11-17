// src/api/v1/repositories/hotel.repository.js
const pool = require('../../../config/db');
const Hotel = require('../../../models/hotel.model');
const RoomTypeAvailability = require('../../../models/roomtypeavailability.model');

// --- CÁC HÀM CRUD CƠ BẢN ---

/**
 * Tạo mới một khách sạn
 * @param {Object} hotelData - Dữ liệu khách sạn
 * @param {string} ownerId - ID của chủ sở hữu
 * @returns {Promise<Hotel>}
 */
const create = async (hotelData, ownerId) => {
  const {
    name,
    description,
    address,
    city,
    starRating,
    phoneNumber,
    email,
    checkInTime,
    checkOutTime
  } = hotelData;

  // Đặt trạng thái mặc định là 'pending' cho khách sạn mới
  const status = 'draft';// sửa ngày 10/09 từ pending thành draft

  const query = `
    INSERT INTO hotels (
      owner_id, name, description, address, city, star_rating,
      phone_number, email, check_in_time, check_out_time, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) -- SỬA: Sử dụng $11 cho status
    RETURNING *;
  `;

  const values = [
    ownerId, name, description, address, city, starRating,
    phoneNumber, email, checkInTime, checkOutTime, status // SỬA: Thêm 'status' vào mảng values
  ];

  const result = await pool.query(query, values);
  return new Hotel(result.rows[0]);
};
/**
 * Tìm khách sạn theo ID
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<Hotel|null>}
 */
const findById = async (hotelId) => {
  const result = await pool.query('SELECT * FROM hotels WHERE hotel_id = $1', [hotelId]);
  if (!result.rows[0]) return null;
  return new Hotel(result.rows[0]);
};

/**
 * Tìm tất cả khách sạn với phân trang
 * @param {number} limit - Số lượng kết quả trên mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 * @returns {Promise<Array<Hotel>>}
 */
const findAll = async (limit = 10, offset = 0) => {
  const query = `
    SELECT * FROM hotels
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Cập nhật thông tin khách sạn có chỉnh sửa ngày 19/9
 * @param {string} hotelId - ID của khách sạn
 * @param {Object} hotelData - Dữ liệu cập nhật
 * @returns {Promise<Hotel|null>}
 */
const update = async (hotelId, hotelData) => {
  // Thêm cập nhật status nếu truyền lên
  const {
    name,
    description,
    address,
    city,
    starRating,
    phoneNumber,
    email,
    status
  } = hotelData;

  // Xây dựng câu lệnh động: nếu có status thì cập nhật luôn
  let setClause = `name = $2, description = $3, address = $4, city = $5, star_rating = $6, phone_number = $7, email = $8`;
  let values = [hotelId, name, description, address, city, starRating, phoneNumber, email];
  if (typeof status !== 'undefined') {
    setClause += ', status = $9';
    values.push(status);
  }
  const query = `
    UPDATE hotels
    SET ${setClause}
    WHERE hotel_id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, values);
  if (!result.rows[0]) return null;
  return new Hotel(result.rows[0]);
};

/**
 * Xóa khách sạn (soft delete)
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<Hotel|null>}
 */
const softDelete = async (hotelId) => {
  const query = `
    UPDATE hotels
    SET status = 'rejected'
    WHERE hotel_id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [hotelId]);
  if (!result.rows[0]) return null;
  return new Hotel(result.rows[0]);
};

/**
 * Xóa khách sạn vĩnh viễn (hard delete)
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<boolean>}
 */
const hardDelete = async (hotelId) => {
  const query = 'DELETE FROM hotels WHERE hotel_id = $1';
  const result = await pool.query(query, [hotelId]);
  return result.rowCount > 0;
};

// --- CÁC HÀM MỚI CHO VIỆC XÉT DUYỆT ---

/**
 * Tìm các khách sạn theo một trạng thái cụ thể
 * @param {string} status - Trạng thái cần tìm (ví dụ: 'pending', 'approved', 'rejected')
 * @returns {Promise<Array<Hotel>>}
 */
const findByStatus = async (status) => {
  const query = 'SELECT * FROM hotels WHERE status = $1 ORDER BY created_at ASC';
  const result = await pool.query(query, [status]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Cập nhật trạng thái của một khách sạn
 * @param {string} hotelId - ID của khách sạn
 * @param {string} newStatus - Trạng thái mới ('approved', 'rejected', 'pending')
 * @returns {Promise<Hotel|null>}
 */
const updateStatus = async (hotelId, newStatus) => {
  const query = 'UPDATE hotels SET status = $1 WHERE hotel_id = $2 RETURNING *';
  const result = await pool.query(query, [newStatus, hotelId]);
  if (!result.rows[0]) return null;
  return new Hotel(result.rows[0]);
};

// --- CÁC HÀM TÌM KIẾM VÀ LỌC ---

/**
 * Tìm khách sạn theo chủ sở hữu
 * @param {string} ownerId - ID của chủ sở hữu
 * @returns {Promise<Array<Hotel>>}
 */
const findByOwner = async (ownerId) => {
  const query = 'SELECT * FROM hotels WHERE owner_id = $1 ORDER BY created_at DESC';
  const result = await pool.query(query, [ownerId]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Tìm khách sạn theo thành phố
 * @param {string} city - Tên thành phố
 * @returns {Promise<Array<Hotel>>}
 */
const findByCity = async (city) => {
  const query = 'SELECT * FROM hotels WHERE LOWER(city) = LOWER($1) AND status = \'approved\' ORDER BY star_rating DESC';
  const result = await pool.query(query, [city]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Tìm kiếm khách sạn theo tên
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @returns {Promise<Array<Hotel>>}
 */
const searchByName = async (searchTerm) => {
  const query = `
    SELECT * FROM hotels
    WHERE LOWER(name) LIKE LOWER($1) AND status = 'approved'
    ORDER BY name ASC
  `;
  const result = await pool.query(query, [`%${searchTerm}%`]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Tìm khách sạn theo rating
 * @param {number} minRating - Rating tối thiểu
 * @param {number} maxRating - Rating tối đa
 * @returns {Promise<Array<Hotel>>}
 */
const findByRating = async (minRating, maxRating) => {
  const query = `
    SELECT * FROM hotels
    WHERE star_rating >= $1 AND star_rating <= $2 AND status = 'approved'
    ORDER BY star_rating DESC
  `;
  const result = await pool.query(query, [minRating, maxRating]);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Đếm tổng số khách sạn theo trạng thái
 * @param {string} status - Trạng thái cần đếm
 * @returns {Promise<number>}
 */
const countByStatus = async (status) => {
  const query = 'SELECT COUNT(*) as total FROM hotels WHERE status = $1';
  const result = await pool.query(query, [status]);
  return parseInt(result.rows[0].total);
};

/**
 * Tìm kiếm khách sạn với nhiều bộ lọc
 * @param {Object} filters - Các bộ lọc
 * @param {number} limit - Số lượng kết quả
 * @param {number} offset - Vị trí bắt đầu
 * @returns {Promise<Array<Hotel>>}
 */
const findWithFilters = async (filters = {}, limit = 10, offset = 0) => {
  let query = 'SELECT * FROM hotels WHERE 1=1';
  let values = [];
  let paramIndex = 1;

  // Thêm các điều kiện lọc
  if (filters.city) {
    query += ` AND LOWER(city) = LOWER($${paramIndex})`;
    values.push(filters.city);
    paramIndex++;
  }

  if (filters.status) {
    query += ` AND status = $${paramIndex}`;
    values.push(filters.status);
    paramIndex++;
  }

  if (filters.minRating) {
    query += ` AND star_rating >= $${paramIndex}`;
    values.push(filters.minRating);
    paramIndex++;
  }

  if (filters.maxRating) {
    query += ` AND star_rating <= $${paramIndex}`;
    values.push(filters.maxRating);
    paramIndex++;
  }

  if (filters.searchTerm) {
    query += ` AND (LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(description) LIKE LOWER($${paramIndex}))`;
    values.push(`%${filters.searchTerm}%`);
    paramIndex++;
  }

  // Thêm sắp xếp và phân trang
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows.map(row => new Hotel(row));
};

/**
 * Kiểm tra khách sạn có tồn tại hay không
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<boolean>}
 */
const exists = async (hotelId) => {
  const query = 'SELECT 1 FROM hotels WHERE hotel_id = $1';
  const result = await pool.query(query, [hotelId]);
  return result.rows.length > 0;
};

/**
 * Tìm khách sạn theo thành phố và phường/xã
 * @param {string} city - Tên thành phố/tỉnh (ví dụ: "Hà Nội", "Đà Nẵng")
 * @param {string} ward - Tên phường/xã để tìm kiếm trong address (ví dụ: "Phường Cửa Nam", "Phường Hoàn Kiếm")
 * @param {number} limit - Số lượng kết quả (mặc định: 10)
 * @param {number} offset - Vị trí bắt đầu (mặc định: 0)
 * @returns {Promise<Array<Hotel>>}
 */
const findByCityAndWard = async (city, ward, limit = 10, offset = 0) => {
  const query = `
    SELECT * FROM hotels 
    WHERE LOWER(city) = LOWER($1) 
      AND LOWER(address) LIKE LOWER($2) 
      AND status = 'approved'
    ORDER BY star_rating DESC, created_at DESC
    LIMIT $3 OFFSET $4
  `;
  
  // Thêm ký tự % để tìm kiếm LIKE
  const wardPattern = `%${ward}%`;
  
  const values = [city, wardPattern, limit, offset];
  const result = await pool.query(query, values);
  
  return result.rows.map(row => new Hotel(row));
};

/**
 * Đếm số lượng khách sạn theo thành phố và phường/xã
 * @param {string} city - Tên thành phố/tỉnh
 * @param {string} ward - Tên phường/xã
 * @returns {Promise<number>}
 */
const countByCityAndWard = async (city, ward) => {
  const query = `
    SELECT COUNT(*) as total 
    FROM hotels 
    WHERE LOWER(city) = LOWER($1) 
      AND LOWER(address) LIKE LOWER($2) 
      AND status = 'approved'
  `;
  
  const wardPattern = `%${ward}%`;
  const values = [city, wardPattern];
  const result = await pool.query(query, values);
  
  return parseInt(result.rows[0].total);
};
//thêm vào ngày 28/8 lấy tất cả khách sạn đã duyệt để thêm vào trang hợp đồng
/**
 * Tìm khách sạn theo chủ sở hữu và trạng thái (tùy chọn)
 * @param {string} ownerId - ID chủ sở hữu
 * @param {string|null} status - Trạng thái (ví dụ: 'approved') hoặc null để bỏ lọc
 * @returns {Promise<Array<Hotel>>}
 */
const findByOwnerAndStatus = async (ownerId, status = null) => {
  let query = 'SELECT * FROM hotels WHERE owner_id = $1';
  const values = [ownerId];

  if (status) {
    query += ' AND status = $2';
    
    values.push(status);
  }

  query += ' ORDER BY name ASC';
  
  const result = await pool.query(query, values);
    
  return result.rows.map(row => new Hotel(row));
};


// /**
//  * Tìm kiếm phòng có sẵn theo thành phố và khoảng thời gian
//  * @param {string} city - Tên thành phố
//  * @param {string} checkInDate - Ngày nhận phòng (YYYY-MM-DD)
//  * @param {string} checkOutDate - Ngày trả phòng (YYYY-MM-DD)
//  * @param {string} [ward] - Tên phường/xã (optional)
//  * @returns {Promise<Array<RoomTypeAvailability>>}
//  */
// const findAvailableRoomsByCity = async (city, checkInDate, checkOutDate, ward = null) => {
//   let query = `
//     SELECT
//         h.hotel_id,
//         rt.room_type_id,
//         rt.name AS room_type_name,
//         rt.number_of_rooms,
//         rt.max_occupancy,
//         COALESCE(SUM(bd.quantity), 0) AS total_rooms_booked,
//         (rt.number_of_rooms - COALESCE(SUM(bd.quantity), 0)) AS available_rooms
//     FROM room_types rt
//     JOIN hotels h ON rt.hotel_id = h.hotel_id
//     LEFT JOIN bookings b
//       ON b.hotel_id = h.hotel_id
//      AND b.booking_status IN ('pending','confirmed')
//      AND b.check_in_date < $2    -- vào trước khi kết thúc đêm
//      AND b.check_out_date > $1   -- rời sau khi đêm bắt đầu
//     LEFT JOIN booking_details bd
//       ON bd.booking_id = b.booking_id
//      AND bd.room_type_id = rt.room_type_id
//     WHERE h.city = $3
//       AND h.status = 'active'
//   `;

//   // Giá trị truyền vào truy vấn
//   let values = [checkInDate, checkOutDate, city];

//   // Nếu có ward (phường/xã), thêm điều kiện vào truy vấn
//   if (ward && ward.trim() !== '') {
//     query += ` AND LOWER(h.address) LIKE LOWER($4)`;
//     values.push(`%${ward}%`);
//   }

//   query += `
//     GROUP BY h.hotel_id, rt.room_type_id, rt.name, rt.number_of_rooms, rt.max_occupancy
//     HAVING COALESCE(SUM(bd.quantity), 0) <= rt.number_of_rooms
//   `;

//   const result = await pool.query(query, values);
//   return result.rows.map(row => new RoomTypeAvailability(row));
// };

/**
 * Tìm phòng theo thành phố + khoảng đêm [checkIn -> checkOut)
 * - Dựa trên phòng vật lý trong bảng rooms (status='available')
 * - Vẫn hiển thị room type hết phòng (available_rooms = 0)
 */
const findAvailableRoomsByCity = async (city, checkInDate, checkOutDate, ward = null) => {
  // $1=checkInDate, $2=checkOutDate, $3=city, ($4=ward nếu có)
  let query = `
    WITH rooms_avail AS (
      SELECT
        rt.hotel_id,
        rt.room_type_id,
        COUNT(*)::int AS total_physical_available
      FROM room_types rt
      JOIN rooms r
        ON r.room_type_id = rt.room_type_id
        AND r.status IN ('available','occupied','cleaning')
      GROUP BY rt.hotel_id, rt.room_type_id
    ),
    booked AS (
      SELECT
        b.hotel_id,
        bd.room_type_id,
        COALESCE(SUM(bd.quantity), 0)::int AS total_booked
      FROM bookings b
      JOIN booking_details bd
        ON bd.booking_id = b.booking_id
      WHERE b.booking_status IN ('pending','confirmed')
        AND b.check_in_date  < $2::date   -- overlap [checkIn -> checkOut)
        AND b.check_out_date > $1::date
      GROUP BY b.hotel_id, bd.room_type_id
    )
    SELECT
      h.hotel_id,
      rt.room_type_id,
      rt.name AS room_type_name,
      COALESCE(ra.total_physical_available, 0) AS number_of_rooms,       -- số phòng vật lý đang 'available'
      rt.max_occupancy,
      COALESCE(bk.total_booked, 0) AS total_rooms_booked,
      GREATEST(COALESCE(ra.total_physical_available,0) - COALESCE(bk.total_booked,0), 0) AS available_rooms
    FROM room_types rt
    JOIN hotels h
      ON rt.hotel_id = h.hotel_id
    LEFT JOIN rooms_avail ra
      ON ra.hotel_id = h.hotel_id
     AND ra.room_type_id = rt.room_type_id
    LEFT JOIN booked bk
      ON bk.hotel_id = h.hotel_id
     AND bk.room_type_id = rt.room_type_id
    WHERE h.city = $3
      AND h.status = 'active'
  `;

  const values = [checkInDate, checkOutDate, city];

  if (ward && ward.trim() !== '') {
    query += ` AND LOWER(h.address) LIKE LOWER($4)`;
    values.push(`%${ward}%`);
  }

  query += `
    ORDER BY h.hotel_id, rt.room_type_id
  `;

  const result = await pool.query(query, values);
  return result.rows.map(row => new RoomTypeAvailability(row));
};

const findAvailableRoomsByHotelId = async (hotelId, checkInDate, checkOutDate) => {
  const query = `
    WITH rooms_avail AS (
      SELECT
        rt.hotel_id,
        rt.room_type_id,
        COUNT(*)::int AS total_physical_available
      FROM room_types rt
      JOIN rooms r
        ON r.room_type_id = rt.room_type_id
       AND r.status IN ('available','occupied','cleaning')
      GROUP BY rt.hotel_id, rt.room_type_id
    ),
    booked AS (
      SELECT
        b.hotel_id,
        bd.room_type_id,
        COALESCE(SUM(bd.quantity), 0)::int AS total_booked
      FROM bookings b
      JOIN booking_details bd
        ON bd.booking_id = b.booking_id
      WHERE b.booking_status IN ('pending','confirmed')
        AND b.check_in_date  < $2
        AND b.check_out_date > $1
        AND b.hotel_id = $3
      GROUP BY b.hotel_id, bd.room_type_id
    )
    SELECT
      h.hotel_id,
      rt.room_type_id,
      rt.name AS room_type_name,
      COALESCE(ra.total_physical_available, 0) AS number_of_rooms,
      rt.max_occupancy,
      COALESCE(bk.total_booked, 0) AS total_rooms_booked,
      GREATEST(COALESCE(ra.total_physical_available,0) - COALESCE(bk.total_booked,0), 0) AS available_rooms
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.hotel_id
    LEFT JOIN rooms_avail ra ON ra.hotel_id = h.hotel_id AND ra.room_type_id = rt.room_type_id
    LEFT JOIN booked bk ON bk.hotel_id = h.hotel_id AND bk.room_type_id = rt.room_type_id
    WHERE h.hotel_id = $3
      AND h.status = 'active'
    ORDER BY h.hotel_id, rt.room_type_id;
  `;
  const values = [checkInDate, checkOutDate, hotelId];
  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Lấy khách sạn của chủ sở hữu với status 'active' hoặc 'approved'
 * @param {string} ownerId
 * @returns {Promise<Array<Hotel>>}
 */
const findActiveOrApprovedByOwner = async (ownerId) => {
  const query = `
    SELECT * FROM hotels
    WHERE owner_id = $1
      AND status IN ('active', 'approved')
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [ownerId]);
  return result.rows.map(row => new Hotel(row));
};

module.exports = {
  // CRUD cơ bản
  create,
  findById,
  findAll,
  update,
  softDelete,
  hardDelete,
  findByCityAndWard,
  countByCityAndWard,
  // Quản lý trạng thái
  findByStatus,
  updateStatus,
  // Tìm kiếm và lọc
  findByOwner,
  findByCity,
  searchByName,
  findByRating,
  findWithFilters,
  findAvailableRoomsByCity,
  findAvailableRoomsByHotelId,
  findByOwnerAndStatus,
  // Tiện ích
  countByStatus,
  exists,
  findActiveOrApprovedByOwner
};
