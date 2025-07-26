/*
===================================================================
File: /src/api/v1/services/user.service.js
Mục đích: Tầng service cho các thao tác quản lý người dùng (CRUD).
===================================================================
*/
const userRepository = require('../repositories/user.repository');
const { AppError } = require('../../../utils/errors');

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

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
