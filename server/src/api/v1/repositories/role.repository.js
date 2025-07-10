// src/api/v1/repositories/role.repository.js

const pool = require('../../../config/db');
const Role = require('../../../models/role.model');

/**
 * Tạo một vai trò mới.
 * @param {object} roleData - Dữ liệu của vai trò (role_name, role_description).
 * @returns {Promise<Role>} - Trả về instance của Role vừa được tạo.
 */
const create = async (roleData) => {
    const { role_name, role_description } = roleData;
    const query = `
        INSERT INTO roles (role_name, role_description)
        VALUES ($1, $2)
        RETURNING *;
    `;
    const result = await pool.query(query, [role_name, role_description]);
    return new Role(result.rows[0]);
};

/**
 * Tìm tất cả các vai trò.
 * @returns {Promise<Role[]>} - Mảng các đối tượng Role.
 */
const findAll = async () => {
    const result = await pool.query('SELECT * FROM roles ORDER BY role_id ASC');
    return result.rows.map(row => new Role(row));
};

/**
 * Tìm một vai trò bằng ID.
 * @param {number} roleId - ID của vai trò.
 * @returns {Promise<Role|null>} - Trả về một instance của Role hoặc null.
 */
const findById = async (roleId) => {
    const result = await pool.query('SELECT * FROM roles WHERE role_id = $1', [roleId]);
    if (!result.rows[0]) {
        return null;
    }
    return new Role(result.rows[0]);
};

/**
 * Tìm một vai trò bằng tên.
 * @param {string} roleName - Tên của vai trò.
 * @returns {Promise<Role|null>}
 */
const findByName = async (roleName) => {
    const result = await pool.query('SELECT * FROM roles WHERE role_name = $1', [roleName]);
    if (!result.rows[0]) {
        return null;
    }
    return new Role(result.rows[0]);
};

/**
 * Cập nhật một vai trò.
 * @param {number} roleId - ID của vai trò cần cập nhật.
 * @param {object} updateData - Dữ liệu mới (role_description, is_active).
 * @returns {Promise<Role|null>}
 */
const update = async (roleId, updateData) => {
    const { role_description, is_active } = updateData;
    const query = `
        UPDATE roles
        SET role_description = $1, is_active = $2
        WHERE role_id = $3
        RETURNING *;
    `;
    const values = [role_description, is_active, roleId];
    const result = await pool.query(query, values);
    if (!result.rows[0]) {
        return null;
    }
    return new Role(result.rows[0]);
};

/**
 * Xóa một vai trò.
 * @param {number} roleId - ID của vai trò cần xóa.
 * @returns {Promise<boolean>} - Trả về true nếu xóa thành công.
 */
const deleteById = async (roleId) => {
    const result = await pool.query('DELETE FROM roles WHERE role_id = $1', [roleId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    findAll,
    findById,
    findByName,
    update,
    deleteById,
};
