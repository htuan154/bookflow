'use client';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import imService from '../api/im.service';
import { openIMStream } from '../api/im.stream';

const IMContext = createContext(null);

export function IMProvider({ children }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const stopRef = useRef(null);
  const pollingRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const stopStream = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Polling fallback: Fetch messages every 2 seconds
  const startPolling = useCallback((convId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    const fetchMessages = async () => {
      try {
        const data = await imService.getMessages({ conversation_id: convId, limit: 50 });
        const msgs = data?.messages || [];
        
        // Only update if there are new messages
        if (msgs.length > 0) {
          const latestId = msgs[msgs.length - 1]?._id;
          if (latestId !== lastMessageIdRef.current) {
            lastMessageIdRef.current = latestId;
            setMessages(msgs);
          }
        }
      } catch (err) {
        console.error('[Polling] Error fetching messages:', err);
      }
    };

    // Initial fetch
    fetchMessages();
    
    // Poll every 2 seconds
    pollingRef.current = setInterval(fetchMessages, 2000);
  }, []);

  const startStream = useCallback((convId) => {
    if (!convId) return;
    stopStream(); // đóng stream cũ
    setConversationId(convId);
    setMessages([]);
    lastMessageIdRef.current = null;
    
    // Try SSE first
    stopRef.current = openIMStream(convId, {
      onMessage: (evt) => {
        setMessages((prev) => [...prev, evt.message]);
        lastMessageIdRef.current = evt.message._id;
      },
      onPing: () => {},
      onError: (e) => {
        console.warn('[SSE] Error, falling back to polling:', e.message);
        // Start polling as fallback
        startPolling(convId);
      },
    });
    
    // Also start polling as safety net (Change Stream may not work)
    startPolling(convId);
  }, [stopStream, startPolling]);


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

  // tạo Group (Group B) — wrapper gọi service an toàn
  const createGroup = useCallback(async (payload) => {
    const conv = await imService.createGroup(payload);
    return conv;
  }, []);

  // dọn khi unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [stopStream]);

  const value = {
    conversationId,
    messages,
    startStream,
    stopStream,
    sendText,
    createDM,
    createGroup,
    // TODO: uploadBase64 + gửi file nếu cần (đã có imService.uploadBase64)
  };

  return <IMContext.Provider value={value}>{children}</IMContext.Provider>;
}

export function useIMContext() {
  const ctx = useContext(IMContext);
  if (!ctx) throw new Error('useIMContext must be used within IMProvider');
  return ctx;
}
