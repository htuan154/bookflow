// src/api/v1/repositories/hotelAmenity.repository.js

const pool = require('../../../config/db');
const Amenity = require('../../../models/amenity.model');

/**
 * Thêm một tiện nghi vào cho một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @param {string} amenityId - ID của tiện nghi.
 * @returns {Promise<void>}
 */
const addAmenityToHotel = async (hotelId, amenityId) => {
    const query = `
        INSERT INTO hotel_amenities (hotel_id, amenity_id)
        VALUES ($1, $2)
        ON CONFLICT (hotel_id, amenity_id) DO NOTHING; -- Tránh lỗi nếu đã tồn tại
    `;
    await pool.query(query, [hotelId, amenityId]);
};

/**
 * Xóa một tiện nghi khỏi một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @param {string} amenityId - ID của tiện nghi.
 * @returns {Promise<boolean>}
 */
const removeAmenityFromHotel = async (hotelId, amenityId) => {
    const query = 'DELETE FROM hotel_amenities WHERE hotel_id = $1 AND amenity_id = $2';
    const result = await pool.query(query, [hotelId, amenityId]);
    return result.rowCount > 0;
};

/**
 * Lấy tất cả các tiện nghi của một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @returns {Promise<Amenity[]>}
 */
const findAmenitiesByHotelId = async (hotelId) => {
    const query = `
        SELECT a.* FROM amenities a
        JOIN hotel_amenities ha ON a.amenity_id = ha.amenity_id
        WHERE ha.hotel_id = $1;
    `;
    const result = await pool.query(query, [hotelId]);
    return result.rows.map(row => new Amenity(row));
};

module.exports = {
    addAmenityToHotel,
    removeAmenityFromHotel,
    findAmenitiesByHotelId,
};