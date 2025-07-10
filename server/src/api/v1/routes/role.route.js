// src/api/v1/routes/role.route.js

const express = require('express');
const RoleController = require('../controllers/role.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createRoleSchema, updateRoleSchema } = require('../../../validators/role.validator');

const router = express.Router();
const roleController = new RoleController();

// Áp dụng middleware 'protect' và 'isAdmin' cho tất cả các route quản lý vai trò.
// Điều này đảm bảo chỉ có Admin đã đăng nhập mới có thể truy cập.
router.use(protect, isAdmin);

// GET /api/v1/roles -> Lấy tất cả các vai trò
router.get('/', roleController.getAllRoles);

// POST /api/v1/roles -> Tạo một vai trò mới
router.post('/', validate(createRoleSchema), roleController.createRole);

// GET /api/v1/roles/:id -> Lấy một vai trò theo ID
router.get('/:id', roleController.getRoleById);

// PUT /api/v1/roles/:id -> Cập nhật một vai trò
router.put('/:id', validate(updateRoleSchema), roleController.updateRole);

// DELETE /api/v1/roles/:id -> Xóa một vai trò
router.delete('/:id', roleController.deleteRole);

module.exports = router;
