/*
===================================================================
File: /src/api/v1/routes/user.route.js
Mục đích: Định tuyến các endpoint cho việc quản lý người dùng (CRUD).
Chỉ admin mới có quyền truy cập.
===================================================================
*/
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Áp dụng middleware xác thực và phân quyền cho tất cả các route bên dưới
router.use(authenticate);
router.use(authorize(['admin', 'user', 'hotel_owner', 'hotel_staff']));

// Route lấy danh sách hotel owners
router.get('/hotel-owners', userController.getHotelOwners);

router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

// Upload profile image
router.post('/:id/profile-image', upload.single('profileImage'), userController.uploadProfileImage);

// Update user status
router.patch('/:id/status', userController.updateUserStatus);

module.exports = router;
