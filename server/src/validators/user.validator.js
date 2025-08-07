/*
===================================================================
File: /src/validators/user.validator.js
Mục đích: Validation cho các thao tác quản lý người dùng (CRUD).
Cập nhật để khớp với user.model.js hiện tại
===================================================================
*/
const { AppError } = require('../utils/errors');

/**
 * Validate dữ liệu người dùng cơ bản
 * @param {Object} userData - Dữ liệu người dùng
 * @throws {AppError} Lỗi validation
 */
const validateUserData = async (userData) => {
    // Validate username (tùy chọn)
    if (userData.username && userData.username.trim().length < 3) {
        throw new AppError('Username phải có ít nhất 3 ký tự', 400);
    }
    
    if (userData.username && userData.username.trim().length > 50) {
        throw new AppError('Username không được quá 50 ký tự', 400);
    }
    
    // Validate email
    if (!userData.email) {
        throw new AppError('Email là bắt buộc', 400);
    }
    
    if (!isValidEmail(userData.email)) {
        throw new AppError('Email không đúng định dạng', 400);
    }
    
    // Validate fullName
    if (!userData.fullName) {
        throw new AppError('Họ tên là bắt buộc', 400);
    }
    
    if (userData.fullName.trim().length < 2) {
        throw new AppError('Họ tên phải có ít nhất 2 ký tự', 400);
    }
    
    if (userData.fullName.trim().length > 100) {
        throw new AppError('Họ tên không được quá 100 ký tự', 400);
    }
    
    // Validate password nếu có
    if (userData.password) {
        await validatePassword(userData.password);
    }
    
    // Validate roleId nếu có
    if (userData.roleId && !isValidRoleId(userData.roleId)) {
        throw new AppError('Role ID không hợp lệ', 400);
    }
};

/**
 * ✅ THÊM MỚI: Validate dữ liệu tạo người dùng mới
 * @param {Object} userData - Dữ liệu người dùng cần tạo
 * @throws {AppError} Lỗi validation
 */
const validateCreateUser = async (userData) => {
    // Validate các trường bắt buộc
    if (!userData.email) {
        throw new AppError('Email là bắt buộc', 400);
    }
    
    if (!userData.fullName) {
        throw new AppError('Họ tên là bắt buộc', 400);
    }
    
    if (!userData.password) {
        throw new AppError('Mật khẩu là bắt buộc', 400);
    }
    
    // Validate email format
    if (!isValidEmail(userData.email)) {
        throw new AppError('Email không đúng định dạng', 400);
    }
    
    // Validate fullName
    if (userData.fullName.trim().length < 2) {
        throw new AppError('Họ tên phải có ít nhất 2 ký tự', 400);
    }
    
    if (userData.fullName.trim().length > 100) {
        throw new AppError('Họ tên không được quá 100 ký tự', 400);
    }
    
    // Validate username nếu có
    if (userData.username) {
        if (userData.username.trim().length < 3) {
            throw new AppError('Username phải có ít nhất 3 ký tự', 400);
        }
        
        if (userData.username.trim().length > 50) {
            throw new AppError('Username không được quá 50 ký tự', 400);
        }
    }
    
    // Validate password
    await validatePassword(userData.password);
    
    // Validate roleId nếu có
    if (userData.roleId && !isValidRoleId(userData.roleId)) {
        throw new AppError('Role ID không hợp lệ', 400);
    }
    
    // ✅ SỬA: Validate phoneNumber nếu có (khớp với model)
    if (userData.phoneNumber && !isValidPhone(userData.phoneNumber)) {
        throw new AppError('Số điện thoại không đúng định dạng', 400);
    }
};

/**
 * Validate độ mạnh password
 * @param {string} password - Mật khẩu
 * @throws {AppError} Lỗi validation
 */
const validatePassword = async (password) => {
    if (!password) {
        throw new AppError('Mật khẩu là bắt buộc', 400);
    }
    
    if (password.length < 6) {
        throw new AppError('Mật khẩu phải có ít nhất 6 ký tự', 400);
    }
    
    if (password.length > 50) {
        throw new AppError('Mật khẩu không được quá 50 ký tự', 400);
    }
    
    // Validate password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
    if (!strongPasswordRegex.test(password)) {
        throw new AppError('Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số', 400);
    }
    
    // Kiểm tra password không chứa khoảng trắng
    if (/\s/.test(password)) {
        throw new AppError('Mật khẩu không được chứa khoảng trắng', 400);
    }
};

/**
 * Validate dữ liệu cập nhật người dùng
 * @param {Object} userData - Dữ liệu cập nhật
 * @throws {AppError} Lỗi validation
 */
const validateUpdateUserData = async (userData) => {
    // Validate username nếu có
    if (userData.username !== undefined) {
        if (userData.username.trim().length < 3) {
            throw new AppError('Username phải có ít nhất 3 ký tự', 400);
        }

        if (userData.username.trim().length > 50) {
            throw new AppError('Username không được quá 50 ký tự', 400);
        }
    }

    // Validate email nếu có
    if (userData.email !== undefined && !isValidEmail(userData.email)) {
        throw new AppError('Email không đúng định dạng', 400);
    }

    // Validate fullName nếu có
    if (userData.fullName !== undefined) {
        if (userData.fullName.trim().length < 2) {
            throw new AppError('Họ tên phải có ít nhất 2 ký tự', 400);
        }

        if (userData.fullName.trim().length > 100) {
            throw new AppError('Họ tên không được quá 100 ký tự', 400);
        }
    }

    // ✅ SỬA: Validate phoneNumber nếu có (khớp với model)
    if (userData.phoneNumber !== undefined) {
        if (!isValidPhone(userData.phoneNumber)) {
            throw new AppError('Số điện thoại không đúng định dạng', 400);
        }
    }

    // ✅ SỬA: Validate address nếu có
    if (userData.address !== undefined) {
        if (userData.address.trim().length > 255) {
            throw new AppError('Địa chỉ không được quá 255 ký tự', 400);
        }
    }

    // ✅ SỬA: Validate isActive nếu có (khớp với model)
    if (userData.isActive !== undefined) {
        if (typeof userData.isActive !== 'boolean') {
            throw new AppError('Trạng thái người dùng phải là true hoặc false', 400);
        }
    }

    // Validate password nếu có
    if (userData.password) {
        await validatePassword(userData.password);
    }

    // Validate roleId nếu có
    if (userData.roleId !== undefined && !isValidRoleId(userData.roleId)) {
        throw new AppError('Role ID không hợp lệ', 400);
    }
};

// === HELPER FUNCTIONS ===

/**
 * Kiểm tra email có đúng định dạng không
 * @param {string} email - Email cần kiểm tra
 * @returns {boolean} True nếu hợp lệ
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
};

/**
 * ✅ THÊM MỚI: Kiểm tra số điện thoại có đúng định dạng không
 * @param {string} phone - Số điện thoại cần kiểm tra
 * @returns {boolean} True nếu hợp lệ
 */
const isValidPhone = (phone) => {
    // Regex cho số điện thoại Việt Nam
    const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Kiểm tra roleId có hợp lệ không
 * @param {number} roleId - Role ID cần kiểm tra
 * @returns {boolean} True nếu hợp lệ
 */
const isValidRoleId = (roleId) => {
    const validRoles = [1, 2, 3]; // 1: admin, 2: hotel_owner, 3: customer
    return validRoles.includes(parseInt(roleId));
};

/**
 * Validate ID (cho các param :id)
 * @param {string} id - ID cần validate
 * @throws {AppError} Lỗi validation
 */
const validateUserId = (id) => {
    if (!id) {
        throw new AppError('ID người dùng là bắt buộc', 400);
    }
    
    // Nếu sử dụng UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Nếu sử dụng số nguyên
    const integerRegex = /^\d+$/;
    
    if (!uuidRegex.test(id) && !integerRegex.test(id)) {
        throw new AppError('ID người dùng không đúng định dạng', 400);
    }
};

/**
 * Validate query filters cho getAllUsers
 * @param {Object} filters - Các bộ lọc
 * @throws {AppError} Lỗi validation
 */
const validateUserFilters = (filters) => {
    // Validate roleId
    if (filters.roleId && !isValidRoleId(filters.roleId)) {
        throw new AppError('Role ID trong filter không hợp lệ', 400);
    }
    
    // Validate search (không quá dài)
    if (filters.search && filters.search.length > 100) {
        throw new AppError('Từ khóa tìm kiếm không được quá 100 ký tự', 400);
    }
};

module.exports = {
    validateUserData,
    validateCreateUser, // ✅ THÊM MỚI
    validatePassword,
    validateUpdateUserData,
    validateUserId,
    validateUserFilters,
    // Helper functions có thể export để dùng ở nơi khác
    isValidEmail,
    isValidPhone, // ✅ THÊM MỚI
    isValidRoleId,
};