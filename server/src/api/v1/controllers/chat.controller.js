// src/api/v1/controllers/chat.controller.js

const ChatService = require('../services/chat.service');
const { successResponse } = require('../../../utils/response');

class ChatController {
    /**
     * Gửi một tin nhắn mới.
     * POST /api/v1/chats
     */
    async sendMessage(req, res, next) {
        try {
            const senderId = req.user.userId;
            const newMessage = await ChatService.sendMessage(req.body, senderId);
            successResponse(res, newMessage, 'Message sent successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy lịch sử trò chuyện của một đơn đặt phòng.
     * GET /api/v1/chats/booking/:bookingId
     */
    async getChatHistory(req, res, next) {
        try {
            const { bookingId } = req.params;
            const userId = req.user.userId;
            const history = await ChatService.getChatHistory(bookingId, userId);
            successResponse(res, history);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChatController();