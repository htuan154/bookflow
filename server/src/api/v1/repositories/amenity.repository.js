// src/api/v1/repositories/amenity.repository.js

const pool = require('../../../config/db');
const Amenity = require('../../../models/amenity.model');

/**
 * Tạo một tiện nghi mới.
 * @param {object} amenityData - Dữ liệu của tiện nghi (name, description, icon_url).
 * @returns {Promise<Amenity>} - Trả về instance của Amenity vừa được tạo.
 */
const create = async (amenityData) => {
    const { name, description, icon_url } = amenityData;
    const query = `
        INSERT INTO amenities (name, description, icon_url)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const result = await pool.query(query, [name, description, icon_url]);
    return new Amenity(result.rows[0]);
};

/**
 * Tìm tất cả các tiện nghi.
 * @returns {Promise<Amenity[]>} - Mảng các đối tượng Amenity.
 */
const findAll = async () => {
    const result = await pool.query('SELECT * FROM amenities ORDER BY name ASC');
    return result.rows.map(row => new Amenity(row));
};

const findByName = async (name) => {
    const query = `
        SELECT * FROM amenities
        WHERE name = $1
        LIMIT 1;
    `;
    const result = await pool.query(query, [name]);

    // Nếu tìm thấy, trả về một đối tượng Amenity, nếu không thì trả về null
    if (result.rows.length > 0) {
        return new Amenity(result.rows[0]);
    }

    return null;
};


/**
 * Tìm một tiện nghi bằng ID.
 * @param {string} amenityId - UUID của tiện nghi.
 * @returns {Promise<Amenity|null>} - Trả về một instance của Amenity hoặc null.
 */
const findById = async (amenityId) => {
    const result = await pool.query('SELECT * FROM amenities WHERE amenity_id = $1', [amenityId]);
    if (!result.rows[0]) {
        return null;
    }
    return new Amenity(result.rows[0]);
};

/**
 * Cập nhật một tiện nghi.
 * @param {string} amenityId - ID của tiện nghi cần cập nhật.
 * @param {object} updateData - Dữ liệu mới (name, description, icon_url).
 * @returns {Promise<Amenity|null>}
 */
const update = async (amenityId, updateData) => {
    const { name, description, icon_url } = updateData;
    const query = `
        UPDATE amenities
        SET name = $1, description = $2, icon_url = $3
        WHERE amenity_id = $4
        RETURNING *;
    `;
    const values = [name, description, icon_url, amenityId];
    const result = await pool.query(query, values);
    if (!result.rows[0]) {
        return null;
    }
    return new Amenity(result.rows[0]);
};

/**
 * Xóa một tiện nghi.
 * @param {string} amenityId - ID của tiện nghi cần xóa.
 * @returns {Promise<boolean>} - Trả về true nếu xóa thành công.
 */
const deleteById = async (amenityId) => {
    // Lưu ý: Cần xử lý logic ở service để đảm bảo không xóa tiện nghi đang được sử dụng bởi các khách sạn.
    const result = await pool.query('DELETE FROM amenities WHERE amenity_id = $1', [amenityId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    deleteById,
    findByName,
};
