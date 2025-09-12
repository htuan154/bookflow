// src/api/im.stream.js
import { API_ENDPOINTS } from '../config/apiEndpoints';

export function openIMStream(conversationId, { onMessage, onPing, onError } = {}) {
  const controller = new AbortController();
  const token = localStorage.getItem('token') || '';
  const url = API_ENDPOINTS.IM.STREAM(conversationId);

  // Fetch SSE với header Authorization
  fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok) throw new Error(`SSE HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Tách theo 2 xuống dòng liên tiếp
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        // Parse event: lines "event: ..." + "data: ..."
        let event = 'message';
        let data = '';
        raw.split('\n').forEach((line) => {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:'))  data += line.slice(5).trim();
        });

        if (event === 'ping') {
          onPing && onPing();
        } else if (event === 'message.new') {
          try {
            const payload = JSON.parse(data);
            onMessage && onMessage(payload);
          } catch (e) {
            console.warn('SSE parse error:', e);
          }
        }
      }
    }
  }).catch((err) => {
    onError && onError(err);
  });

  // API đóng stream
  return () => controller.abort();
}
