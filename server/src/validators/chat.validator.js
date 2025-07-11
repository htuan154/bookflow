// src/validators/chat.validator.js

const Joi = require('joi');

const sendMessageSchema = Joi.object({
    booking_id: Joi.string().uuid().required(),
    message_content: Joi.string().min(1).max(2000).required(),
});

module.exports = {
    sendMessageSchema,
};