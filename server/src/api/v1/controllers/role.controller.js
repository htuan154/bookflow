// src/api/v1/controllers/role.controller.js

const RoleService = require('../services/role.service');
const { successResponse } = require('../../../utils/response');

class RoleController {
    /**
     * Lấy tất cả các vai trò.
     * GET /api/v1/roles
     */
    async getAllRoles(req, res, next) {
        try {
            const roles = await RoleService.getAllRoles();
            successResponse(res, roles, 'Lấy danh sách vai trò thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy một vai trò bằng ID.
     * GET /api/v1/roles/:id
     */
    async getRoleById(req, res, next) {
        try {
            const { id } = req.params;
            const role = await RoleService.getRoleById(id);
            successResponse(res, role);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo một vai trò mới.
     * POST /api/v1/roles
     */
    async createRole(req, res, next) {
        try {
            const newRole = await RoleService.createRole(req.body);
            successResponse(res, newRole, 'Tạo vai trò mới thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật một vai trò.
     * PUT /api/v1/roles/:id
     */
    async updateRole(req, res, next) {
        try {
            const { id } = req.params;
            const updatedRole = await RoleService.updateRole(id, req.body);
            successResponse(res, updatedRole, 'Cập nhật vai trò thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một vai trò.
     * DELETE /api/v1/roles/:id
     */
    async deleteRole(req, res, next) {
        try {
            const { id } = req.params;
            await RoleService.deleteRole(id);
            successResponse(res, null, 'Xóa vai trò thành công');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoleController();
