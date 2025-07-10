// src/api/v1/services/role.service.js

const roleRepository = require('../repositories/role.repository');
const { AppError } = require('../../../utils/errors');

class RoleService {
    /**
     * Tạo một vai trò mới.
     * @param {object} roleData - Dữ liệu của vai trò.
     * @returns {Promise<Role>}
     */
    async createRole(roleData) {
        const { role_name } = roleData;

        // Kiểm tra xem vai trò đã tồn tại chưa
        const existingRole = await roleRepository.findByName(role_name);
        if (existingRole) {
            throw new AppError('Role with this name already exists', 409); // 409 Conflict
        }

        return await roleRepository.create(roleData);
    }

    /**
     * Lấy tất cả các vai trò.
     * @returns {Promise<Role[]>}
     */
    async getAllRoles() {
        return await roleRepository.findAll();
    }

    /**
     * Lấy một vai trò bằng ID.
     * @param {number} roleId - ID của vai trò.
     * @returns {Promise<Role>}
     */
    async getRoleById(roleId) {
        const role = await roleRepository.findById(roleId);
        if (!role) {
            throw new AppError('Role not found', 404);
        }
        return role;
    }

    /**
     * Cập nhật một vai trò.
     * @param {number} roleId - ID của vai trò.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @returns {Promise<Role>}
     */
    async updateRole(roleId, updateData) {
        // Kiểm tra xem vai trò có tồn tại không
        const role = await roleRepository.findById(roleId);
        if (!role) {
            throw new AppError('Role not found', 404);
        }

        const updatedRole = await roleRepository.update(roleId, updateData);
        return updatedRole;
    }

    /**
     * Xóa một vai trò.
     * @param {number} roleId - ID của vai trò.
     * @returns {Promise<void>}
     */
    async deleteRole(roleId) {
        // Logic nghiệp vụ quan trọng: Ngăn chặn việc xóa các vai trò cốt lõi
        const coreRoleIds = [1, 2, 3]; // Giả sử ID của Admin, HotelOwner, Customer
        if (coreRoleIds.includes(parseInt(roleId, 10))) {
            throw new AppError('Cannot delete core system roles', 400);
        }

        const role = await roleRepository.findById(roleId);
        if (!role) {
            throw new AppError('Role not found', 404);
        }

        const isDeleted = await roleRepository.deleteById(roleId);
        if (!isDeleted) {
            throw new AppError('Failed to delete role', 500);
        }
    }
}

module.exports = new RoleService();
