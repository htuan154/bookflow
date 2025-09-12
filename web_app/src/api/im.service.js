// src/api/im.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

// Lấy user hiện tại (tuỳ app lưu ở 'me' hay 'user')
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('me') || localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

// FE không dùng env → hardcode admin fallback
const ADMIN_FALLBACK = '76c26936-1c91-40bf-bfb4-89ddeeffbef7';

const imService = {
  /* Conversations */
  async createDM(payload) {
    const me = getCurrentUser();
    const body = {
      hotel_id: payload.hotel_id,
      owner_id: payload.owner_id || me.user_id,
      admin_id: payload.admin_id || ADMIN_FALLBACK,
    };
    // Fail sớm nếu thiếu trường để dễ debug
    if (!body.hotel_id || !body.owner_id || !body.admin_id) {
      console.error('[createDM] missing fields', body);
      throw new Error('Missing hotel_id/owner_id/admin_id');
    }
    const { data } = await axiosClient.post(API_ENDPOINTS.IM.CREATE_DM, body);
    return data;
  },

  async createGroup(payload) {
    const { data } = await axiosClient.post(API_ENDPOINTS.IM.CREATE_GROUP, payload);
    return data;
  },

  async listConversations(params) {
    const { data } = await axiosClient.get(API_ENDPOINTS.IM.LIST, { params });
    return data?.items ?? data ?? [];
  },

  /* Messages */
  async history(params) {
    const { data } = await axiosClient.get(API_ENDPOINTS.IM.HISTORY, { params });
    return data;
  },

  async sendText(body) {
    const { data } = await axiosClient.post(API_ENDPOINTS.IM.SEND_TEXT, {
      conversation_id: body.convId || body.conversation_id,
      text: body.text,
    });
    return data;
  },

  async sendFile(body) {
    const { data } = await axiosClient.post(API_ENDPOINTS.IM.SEND_FILE, {
      conversation_id: body.conversation_id,
      text: body.text || '',
      attachments: body.attachments || [],
    });
    return data;
  },

  async markRead(body) {
    const { data } = await axiosClient.post(API_ENDPOINTS.IM.MARK_READ, body);
    return data;
  },

  /* Upload (base64 -> GridFS) */
  async uploadBase64(body) {
    const { data } = await axiosClient.post(API_ENDPOINTS.IM.UPLOAD_BASE64, body);
    return data; // {gridfs_id, file_name, mime_type, size,...}
  },
};

export default imService;
