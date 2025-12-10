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

const getHotelOwners = async (req, res, next) => {
    try {
        // Lấy page, limit từ query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await userService.getHotelOwners({ page, limit });
        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const uploadProfileImage = async (req, res, next) => {
    try {
        const userId = req.params.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file ảnh'
            });
        }

        // Get image path relative to server
        const imagePath = `/uploads/profiles/${req.file.filename}`;
        
        // Update user profile picture URL using dedicated method
        const updatedUser = await userService.updateProfilePicture(userId, imagePath);

        res.status(200).json({
            success: true,
            message: 'Cập nhật ảnh đại diện thành công',
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

const updateUserStatus = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { isActive } = req.body;
        
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive phải là giá trị boolean'
            });
        }

        const updatedUser = await userService.updateUserStatus(userId, isActive);

        res.status(200).json({
            success: true,
            message: `Cập nhật trạng thái người dùng thành công: ${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'}`,
            data: updatedUser
        });
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
    getHotelOwners,
    uploadProfileImage,
    updateUserStatus
};
