// src/validators/role.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi tạo một vai trò mới.
 */
const createRoleSchema = Joi.object({
    role_name: Joi.string().min(3).max(50).required().messages({
        'string.base': `"Tên vai trò" phải là một chuỗi ký tự`,
        'string.empty': `"Tên vai trò" không được để trống`,
        'string.min': `"Tên vai trò" phải có ít nhất {#limit} ký tự`,
        'any.required': `"Tên vai trò" là trường bắt buộc`
    }),
    role_description: Joi.string().allow('').max(255),
});

/**
 * Schema để kiểm tra dữ liệu khi cập nhật một vai trò.
 */
const updateRoleSchema = Joi.object({
    role_description: Joi.string().allow('').max(255),
    is_active: Joi.boolean()
});

module.exports = {
    createRoleSchema,
    updateRoleSchema,
};
