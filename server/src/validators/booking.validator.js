// src/validators/booking.validator.js

const Joi = require('joi');

// Schema cho một chi tiết phòng trong đơn đặt hàng
const roomDetailSchema = Joi.object({
    room_type_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(),
});

/**
 * Schema để kiểm tra dữ liệu khi tạo một đơn đặt phòng mới.
 */
const createBookingSchema = Joi.object({
    hotel_id: Joi.string().uuid().required(),
    check_in_date: Joi.date().iso().required(),
    check_out_date: Joi.date().iso().greater(Joi.ref('check_in_date')).required(),
    total_guests: Joi.number().integer().min(1).required(),
    special_requests: Joi.string().allow('').max(1000),
    payment_method: Joi.string().required(),
    //room_details: Joi.array().items(roomDetailSchema).min(1).required(),
});

/**
 * Schema để kiểm tra dữ liệu khi cập nhật trạng thái đơn đặt phòng.
 */
const updateStatusSchema = Joi.object({
    status: Joi.string().valid('confirmed', 'canceled', 'completed', 'no_show').required()
});

module.exports = {
    createBookingSchema,
    updateStatusSchema,
};
