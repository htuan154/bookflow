/*
===================================================================
File: /src/api/v1/controllers/user.controller.js
Mục đích: Tầng controller cho luồng quản lý người dùng (CRUD).
===================================================================
*/
const userService = require('../services/user.service');

const getAllUsers = async (req, res, next) => {
    try {
        // Lấy bộ lọc từ query string, ví dụ: /api/users?roleId=2
        const filters = req.query;
        const users = await userService.getAllUsers(filters);
        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        next(error);
    }
};

const getUser = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        console.log('Controller received req.body:', req.body);
        const newUser = await userService.createUser(req.body);
        console.log('Controller returning user:', newUser);
        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công.',
            data: newUser,
        });
    } catch (error) {
        console.error('Controller error:', error);
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Cập nhật người dùng thành công.',
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        await userService.deleteUser(req.params.id);
        res.status(204).send(); // 204 No Content
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
};
