// src/validators/roomAssignment.validator.js

const Joi = require('joi');

/**
 * Schema để kiểm tra dữ liệu khi gán một phòng mới cho khách.
 */
const assignRoomSchema = Joi.object({
    booking_detail_id: Joi.string().uuid().required().messages({
        'string.guid': '"booking_detail_id" phải là một UUID hợp lệ.',
        'any.required': '"booking_detail_id" là bắt buộc.',
    }),
    room_id: Joi.string().uuid().required().messages({
        'string.guid': '"room_id" phải là một UUID hợp lệ.',
        'any.required': '"room_id" là bắt buộc.',
    }),
    notes: Joi.string().allow('').max(500), // Ghi chú (tùy chọn), tối đa 500 ký tự
});

module.exports = {
    assignRoomSchema,
};
