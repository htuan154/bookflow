const axios = require('axios');

// Địa chỉ của server AI Python (có thể override bằng biến môi trường)
const AI_MODEL_API_URL = process.env.AI_MODEL_API_URL || 'http://localhost:5000/check-comment';

class AiModerationService {
    async classifyComment(content) {
        try {
            const response = await axios.post(AI_MODEL_API_URL, { text: content });
            return response.data.classification;
        } catch (error) {
            console.error("Lỗi khi gọi đến AI Model:", error.message);
            return 'LỖI';
        }
    }
}

module.exports = new AiModerationService();