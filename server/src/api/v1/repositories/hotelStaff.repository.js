// src/api/v1/repositories/hotelStaff.repository.js

const pool = require('../../../config/db');
const HotelStaff = require('../../../models/hotelStaff.model');
const userRepository = require('./user.repository');
const bcrypt = require('bcrypt');

/**
 * Thêm một nhân viên mới vào một khách sạn và tự động tạo user.
 * @param {object} staffData - Dữ liệu của nhân viên.
 * @param {string} staffData.hotel_id - ID của khách sạn
 * @param {string} staffData.username - Username cho tài khoản
 * @param {string} staffData.email - Email của nhân viên
 * @param {string} staffData.password - Mật khẩu cho tài khoản
 * @param {string} staffData.full_name - Họ tên đầy đủ
 * @param {string} staffData.job_position - Vị trí công việc
 * @param {string} staffData.start_date - Ngày bắt đầu làm việc
 * @param {string} [staffData.contact] - Thông tin liên lạc
 * @param {string} staffData.hired_by - ID người tuyển dụng
 * @param {string} [staffData.phone_number] - Số điện thoại
 * @param {string} [staffData.address] - Địa chỉ
 * @returns {Promise<{user: User, staff: HotelStaff}>}
 */
const addStaff = async (staffData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { 
            hotel_id, 
            username, 
            email, 
            password,
            full_name,
            job_position, 
            start_date, 
            contact, 
            hired_by,
            phone_number,
            address
        } = staffData;

        // Kiểm tra xem email hoặc username đã tồn tại chưa
        const existingUser = await userRepository.findByEmailOrUsername(email, username);
        if (existingUser) {
            throw new Error('Email hoặc username đã tồn tại');
        }

        // Hash mật khẩu
        const passwordHash = await bcrypt.hash(password, 12);

        // Tạo user mới với role_id = 3 (hotel staff)
        const userData = {
            username,
            email,
            passwordHash,
            fullName: full_name,
            roleId: 3, // Giả sử role_id = 3 là hotel staff
            phoneNumber: phone_number || null,
            address: address || null
        };

        const newUser = await userRepository.create(userData);

        // Tạo hotel staff với user_id vừa tạo
        const staffQuery = `
            INSERT INTO hotel_staff (hotel_id, user_id, job_position, start_date, contact, hired_by, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
            RETURNING *;
        `;
        const staffValues = [hotel_id, newUser.userId, job_position, start_date, contact, hired_by];
        const staffResult = await client.query(staffQuery, staffValues);
        
        const newStaff = new HotelStaff(staffResult.rows[0]);

        await client.query('COMMIT');
        
        return {
            user: newUser,
            staff: newStaff
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Thêm nhân viên từ user đã tồn tại.
 * @param {object} staffData - Dữ liệu của nhân viên.
 * @param {string} staffData.hotel_id - ID của khách sạn
 * @param {string} staffData.user_id - ID của user đã tồn tại
 * @param {string} staffData.job_position - Vị trí công việc
 * @param {string} staffData.start_date - Ngày bắt đầu làm việc
 * @param {string} [staffData.contact] - Thông tin liên lạc
 * @param {string} staffData.hired_by - ID người tuyển dụng
 * @returns {Promise<HotelStaff>}
 */
const addExistingUserAsStaff = async (staffData) => {
    const { hotel_id, user_id, job_position, start_date, contact, hired_by } = staffData;
    
    // Kiểm tra user có tồn tại không
    const existingUser = await userRepository.findById(user_id);
    if (!existingUser) {
        throw new Error('User không tồn tại');
    }

    const query = `
        INSERT INTO hotel_staff (hotel_id, user_id, job_position, start_date, contact, hired_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING *;
    `;
    const values = [hotel_id, user_id, job_position, start_date, contact, hired_by];
    const result = await pool.query(query, values);
    return new HotelStaff(result.rows[0]);
};

/**
 * Tìm tất cả nhân viên của một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @returns {Promise<HotelStaff[]>}
 */
const findByHotelId = async (hotelId) => {
    const query = 'SELECT * FROM hotel_staff WHERE hotel_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [hotelId]);
    return result.rows.map(row => new HotelStaff(row));
};

/**
 * Tìm một nhân viên bằng ID với thông tin user.
 * @param {string} staffId - UUID của nhân viên.
 * @returns {Promise<object|null>}
 */
const findById = async (staffId) => {
    const query = `
        SELECT 
            hs.*,
            u.username,
            u.email,
            u.full_name,
            u.phone_number,
            u.address
        FROM hotel_staff hs
        JOIN users u ON hs.user_id = u.user_id
        WHERE hs.staff_id = $1
    `;
    const result = await pool.query(query, [staffId]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
        staff: new HotelStaff({
            staff_id: row.staff_id,
            hotel_id: row.hotel_id,
            user_id: row.user_id,
            job_position: row.job_position,
            start_date: row.start_date,
            end_date: row.end_date,
            status: row.status,
            contact: row.contact,
            hired_by: row.hired_by,
            created_at: row.created_at
        }),
        user: {
            username: row.username,
            email: row.email,
            full_name: row.full_name,
            phone_number: row.phone_number,
            address: row.address
        }
    };
};

/**
 * Cập nhật thông tin của một nhân viên.
 * @param {string} staffId - ID của nhân viên cần cập nhật.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<HotelStaff|null>}
 */
const updateStaff = async (staffId, updateData) => {
    const { job_position, status, contact, end_date } = updateData;
    const query = `
        UPDATE hotel_staff
        SET job_position = $1, status = $2, contact = $3, end_date = $4
        WHERE staff_id = $5
        RETURNING *;
    `;
    const values = [job_position, status, contact, end_date, staffId];
    const result = await pool.query(query, values);
    return result.rows[0] ? new HotelStaff(result.rows[0]) : null;
};

/**
 * Xóa (sa thải) một nhân viên khỏi khách sạn.
 * Chỉ xóa record trong hotel_staff, không xóa user.
 * @param {string} staffId - ID của nhân viên.
 * @returns {Promise<boolean>}
 */
const removeStaff = async (staffId) => {
    const result = await pool.query('DELETE FROM hotel_staff WHERE staff_id = $1', [staffId]);
    return result.rowCount > 0;
};

/**
 * Xóa nhân viên và user liên quan (sử dụng cẩn thận).
 * @param {string} staffId - ID của nhân viên.
 * @returns {Promise<boolean>}
 */
const removeStaffAndUser = async (staffId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Lấy thông tin staff để có user_id
        const staffResult = await client.query('SELECT user_id FROM hotel_staff WHERE staff_id = $1', [staffId]);
        if (staffResult.rows.length === 0) {
            throw new Error('Staff không tồn tại');
        }
        
        const userId = staffResult.rows[0].user_id;
        
        // Xóa staff trước
        await client.query('DELETE FROM hotel_staff WHERE staff_id = $1', [staffId]);
        
        // Xóa user
        await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
        
        await client.query('COMMIT');
        return true;
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Tìm staff theo user_id và hotel_id.
 * @param {string} userId - ID của user
 * @param {string} hotelId - ID của khách sạn
 * @returns {Promise<HotelStaff|null>}
 */
const findByUserIdAndHotelId = async (userId, hotelId) => {
    const query = `
        SELECT * FROM hotel_staff 
        WHERE user_id = $1 AND hotel_id = $2 AND status = 'active'
        LIMIT 1
    `;
    const result = await pool.query(query, [userId, hotelId]);
    return result.rows.length > 0 ? new HotelStaff(result.rows[0]) : null;
};

module.exports = {
    addStaff,
    addExistingUserAsStaff,
    findByHotelId,
    findById,
    updateStaff,
    removeStaff,
    removeStaffAndUser,
    findByUserIdAndHotelId
};