// src/validators/hotelStaff.validator.js

const Joi = require('joi');

const addStaffWithAccountSchema = Joi.object({
    hotel_id: Joi.string().uuid().required(),
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required(),
    full_name: Joi.string().min(2).max(255).required(),
    job_position: Joi.string().min(3).max(100).required(),
    start_date: Joi.date().iso().required(),
    contact: Joi.string().max(500).allow('', null).optional(),
    hired_by: Joi.string().uuid().required(),
    phone_number: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(15).allow('', null).optional(),
    address: Joi.string().max(500).allow('', null).optional(),
});

const addExistingUserAsStaffSchema = Joi.object({
    hotel_id: Joi.string().uuid().required(),
    user_id: Joi.string().uuid().required(),
    job_position: Joi.string().min(3).max(100).required(),
    start_date: Joi.date().iso().required(),
    contact: Joi.string().max(500).allow('', null).optional(),
    hired_by: Joi.string().uuid().required(),
});

const updateStaffSchema = Joi.object({
    job_position: Joi.string().min(3).max(100).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'terminated').optional(),
    contact: Joi.string().max(500).allow('', null).optional(),
    end_date: Joi.date().iso().allow(null).optional(),
}).min(1);

const staffIdSchema = Joi.object({
    staffId: Joi.string().uuid().required(),
});

const hotelIdSchema = Joi.object({
    hotelId: Joi.string().uuid().required(),
});

const validateAddStaffWithAccount = (data) => {
    const { error, value } = addStaffWithAccountSchema.validate(data, { 
        abortEarly: false,
        stripUnknown: true 
    });
    
    if (error) {
        const errorMessages = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        return { isValid: false, errors: errorMessages };
    }
    
    return { isValid: true, value };
};

const validateAddExistingUserAsStaff = (data) => {
    const { error, value } = addExistingUserAsStaffSchema.validate(data, { 
        abortEarly: false,
        stripUnknown: true 
    });
    
    if (error) {
        const errorMessages = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        return { isValid: false, errors: errorMessages };
    }
    
    return { isValid: true, value };
};

const validateUpdateStaff = (data) => {
    const { error, value } = updateStaffSchema.validate(data, { 
        abortEarly: false,
        stripUnknown: true 
    });
    
    if (error) {
        const errorMessages = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        return { isValid: false, errors: errorMessages };
    }
    
    return { isValid: true, value };
};

const validateStaffId = (staffId) => {
    const { error, value } = staffIdSchema.validate({ staffId });
    
    if (error) {
        return { isValid: false, error: 'Invalid staff ID format' };
    }
    
    return { isValid: true, value: value.staffId };
};

const validateHotelId = (hotelId) => {
    const { error, value } = hotelIdSchema.validate({ hotelId });
    
    if (error) {
        return { isValid: false, error: 'Invalid hotel ID format' };
    }
    
    return { isValid: true, value: value.hotelId };
};

const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }
    
    if (!hasUpperCase) {
        errors.push('Mật khẩu phải có ít nhất 1 chữ cái viết hoa');
    }
    
    if (!hasLowerCase) {
        errors.push('Mật khẩu phải có ít nhất 1 chữ cái viết thường');
    }
    
    if (!hasNumber) {
        errors.push('Mật khẩu phải có ít nhất 1 chữ số');
    }
    
    if (!hasSpecialChar) {
        errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
        isValid: emailRegex.test(email),
        error: !emailRegex.test(email) ? 'Định dạng email không hợp lệ' : null
    };
};

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    const errors = [];
    
    if (username.length < 3) {
        errors.push('Username phải có ít nhất 3 ký tự');
    }
    
    if (username.length > 50) {
        errors.push('Username không được vượt quá 50 ký tự');
    }
    
    if (!usernameRegex.test(username)) {
        errors.push('Username chỉ được chứa chữ cái, số và dấu gạch dưới');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

module.exports = {
    // Schemas
    addStaffWithAccountSchema,
    addExistingUserAsStaffSchema,
    updateStaffSchema,
    staffIdSchema,
    hotelIdSchema,
    
    // Validation functions
    validateAddStaffWithAccount,
    validateAddExistingUserAsStaff,
    validateUpdateStaff,
    validateStaffId,
    validateHotelId,
    validatePasswordStrength,
    validateEmailFormat,
    validateUsername,
};