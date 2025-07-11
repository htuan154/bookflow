// src/api/v1/routes/chat.route.js

const express = require('express');
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { sendMessageSchema } = require('../../../validators/chat.validator');

const router = express.Router();


// --- Áp dụng middleware xác thực cho tất cả các route ---
router.use(authenticate);

// POST /api/v1/chats -> Gửi một tin nhắn mới
router.post(
    '/',
    validate(sendMessageSchema),
    chatController.sendMessage
);

// GET /api/v1/chats/booking/:bookingId -> Lấy lịch sử trò chuyện
router.get(
    '/booking/:bookingId',
    chatController.getChatHistory
);

module.exports = router;
