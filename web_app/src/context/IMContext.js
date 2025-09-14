'use client';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import imService from '../api/im.service';
import { openIMStream } from '../api/im.stream';

const IMContext = createContext(null);

export function IMProvider({ children }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const stopRef = useRef(null);

  const stopStream = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
  }, []);

  const startStream = useCallback((convId) => {
    if (!convId) return;
    stopStream(); // đóng stream cũ
    setConversationId(convId);
    setMessages([]);
    stopRef.current = openIMStream(convId, {
      onMessage: (evt) => setMessages((prev) => [...prev, evt.message]),
      onPing: () => {},
      onError: (e) => console.error('SSE error', e),
    });
  }, [stopStream]);


  // gửi text (SSE sẽ tự đẩy message.new về, không cần push tay)
  const sendText = useCallback(async ({ convId, text }) => {
    const id = convId || conversationId;
    if (!id) throw new Error('No conversation selected');
    await imService.sendText({ conversation_id: id, text });
  }, [conversationId]);

  // tạo/lấy DM (trả conv để bạn startStream bên ngoài)
  const createDM = useCallback(async ({ hotel_id, admin_id, owner_id }) => {
    const conv = await imService.createDM({ hotel_id, admin_id, owner_id });
    return conv;
  }, []);

  // dọn khi unmount
  useEffect(() => () => stopStream(), [stopStream]);

  const value = {
    conversationId,
    messages,
    startStream,
    stopStream,
    sendText,
    createDM,
    // TODO: uploadBase64 + gửi file nếu cần (đã có imService.uploadBase64)
  };

  return <IMContext.Provider value={value}>{children}</IMContext.Provider>;
}

export function useIMContext() {
  const ctx = useContext(IMContext);
  if (!ctx) throw new Error('useIMContext must be used within IMProvider');
  return ctx;
}
