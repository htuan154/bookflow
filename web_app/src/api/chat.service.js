// src/api/chat.service.js
import axiosClient from '../config/axiosClient';
import { CHAT_API_ENDPOINTS } from '../config/apiEndpoints';

const chatService = {
  async getChatHistory(bookingId) {
    try {
      const { data } = await axiosClient.get(CHAT_API_ENDPOINTS.GET_CHAT_HISTORY(bookingId));
      return data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  async sendMessage(messageData) {
    try {
      const { data } = await axiosClient.post(CHAT_API_ENDPOINTS.SEND_MESSAGE, messageData);
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};

export default chatService;