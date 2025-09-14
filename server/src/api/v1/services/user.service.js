/*
===================================================================
File: /src/api/v1/services/user.service.js
Mục đích: Tầng service cho các thao tác quản lý người dùng (CRUD).
===================================================================
*/
const userRepository = require('../repositories/user.repository');
const { AppError } = require('../../../utils/errors');

const bcrypt = require('bcrypt');
const createUser = async (userData) => {
    const { username, email, password, fullName, roleId = 3, phoneNumber, address } = userData;
    // Kiểm tra trùng email hoặc username
    const existingUser = await userRepository.findByEmailOrUsername(email, username);
    if (existingUser) {
        throw new AppError('Username hoặc email đã tồn tại', 409);
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    // Tạo user mới
    const newUser = await userRepository.create({
        username,
        email,
        passwordHash,
        fullName,
        roleId,
        phoneNumber,
        address
    });
    return newUser.toJSON();
};

const getAllUsers = async (filters) => {
    const users = await userRepository.findAll(filters);
    return users.map(user => user.toJSON()); // Không trả về password hash
};

const getUserById = async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw new AppError('Không tìm thấy người dùng với ID này', 404);
    }
    return user.toJSON();
};

const updateUser = async (userId, userData) => {
    const updatedUser = await userRepository.update(userId, userData);
    if (!updatedUser) {
        throw new AppError('Không tìm thấy người dùng để cập nhật', 404);
    }
    return updatedUser.toJSON();
};

const deleteUser = async (userId) => {
    const success = await userRepository.remove(userId);
    if (!success) {
        throw new AppError('Không tìm thấy người dùng để xóa', 404);
    }
    return true;
};

// === BỔ SUNG CÁC METHODS CHO QUẢN LÝ KHÁCH HÀNG ===

/**
 * Lấy danh sách chủ khách sạn (hotel owners) có phân trang
 * @param {Object} options - { page, limit }
 * @returns {Object} { data, pagination }
 */
const getHotelOwners = async ({ page = 1, limit = 10 } = {}) => {
    const { data, total } = await userRepository.findHotelOwners({ page, limit });
    return {
        data: data.map(user => user.toJSON()),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Lấy người dùng theo role_id
 * @param {number} roleId - ID của role
 * @param {Object} filters - Bộ lọc khác
 * @returns {Array} Danh sách users theo role
 */
const getUsersByRole = async (roleId, filters = {}) => {
    const roleFilters = {
        ...filters,
        role_id: roleId
    };
    
    const users = await userRepository.findAll(roleFilters);
    return users.map(user => user.toJSON());
};

/**
 * Lấy thống kê khách hàng theo role
 * @returns {Object} Thống kê customers
 */
const getCustomerStatistics = async () => {
    const stats = await userRepository.getStatisticsByRole();
    return stats;
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    // Bổ sung methods mới
    getHotelOwners,
    getUsersByRole,
    getCustomerStatistics,
};