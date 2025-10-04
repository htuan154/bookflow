import { useState } from 'react';
import chatService from '../api/chat.service';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy lịch sử chat theo bookingId
  const fetchMessages = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.getChatHistory(bookingId);
      setMessages(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setError(err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Gửi tin nhắn mới
  const sendMessage = async (bookingId, messageContent, senderId) => {
    try {
      const messageData = {
        booking_id: bookingId,
        message_content: messageContent,
        sender_id: senderId,
      };
      await chatService.sendMessage(messageData);
      // Optionally, fetch messages again to update UI
      await fetchMessages(bookingId);
    } catch (err) {
      setError(err);
    }
  };

  return {
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
    setMessages,
  };
}
