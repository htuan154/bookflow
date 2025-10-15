'use strict';

const { insertMessage, listMessages } = require('../repositories/message.repo');
const { updateLastMessage } = require('../repositories/conversation.repo');
const { isMember, setLastRead } = require('../repositories/participant.repo');

// ===== DEDUPE MECHANISM =====
// Cache tin nhắn gần đây để tránh duplicate (key: conversation_id + sender_id + text hash)
const recentMessages = new Map(); // key -> timestamp
const DEDUPE_WINDOW_MS = 3000; // 3 giây

function makeDedupeKey(conversation_id, sender_id, text) {
  const textHash = String(text || '').slice(0, 100); // chỉ lấy 100 ký tự đầu
  return `${conversation_id}:${sender_id}:${textHash}`;
}

function isDuplicate(conversation_id, sender_id, text) {
  const key = makeDedupeKey(conversation_id, sender_id, text);
  const now = Date.now();
  const lastSent = recentMessages.get(key);
  
  if (lastSent && (now - lastSent) < DEDUPE_WINDOW_MS) {
    console.warn('[DEDUPE] Duplicate message detected:', { conversation_id, sender_id, text: text?.slice(0, 50) });
    return true;
  }
  
  recentMessages.set(key, now);
  
  // Cleanup old entries (keep map size reasonable)
  if (recentMessages.size > 1000) {
    const cutoff = now - DEDUPE_WINDOW_MS;
    for (const [k, ts] of recentMessages.entries()) {
      if (ts < cutoff) recentMessages.delete(k);
    }
  }
  
  return false;
}

/** Kiểm tra ACL: user phải là participant của phòng */
async function _assertMember(conversation_id, user_id) {
  console.log('[isMember] Checking:', { conversation_id, user_id });
  const ok = await isMember({ conversation_id, user_id });
  if (!ok) {
    const e = new Error('FORBIDDEN: not a participant');
    e.status = 403;
    throw e;
  }
}

/** Gửi tin nhắn văn bản */
async function sendText({ conversation_id, user, text = '', links = [] }) {
  await _assertMember(conversation_id, user);
  
  // Check duplicate
  if (isDuplicate(conversation_id, user, text)) {
    console.warn('[sendText] Skipping duplicate message');
    // Return last message from this user (or throw error)
    throw new Error('DUPLICATE_MESSAGE: Message sent too quickly');
  }
  
  const msg = await insertMessage({
    conversation_id,
    sender_id: user,
    sender_role: user.role,
    kind: 'text',
    text,
    attachments: [],
    links
  });
  await updateLastMessage(conversation_id, {
    message_id: msg._id,
    text: msg.text,
    at: new Date()
  });
  return msg;
}

/** Gửi tin nhắn kèm file (metadata attachments đã có gridfs_id) */
async function sendFile({ conversation_id, user, text = '', attachments = [] }) {
  await _assertMember(conversation_id, user);
  const msg = await insertMessage({
    conversation_id,
    sender_id: user,
    sender_role: user.role,
    kind: 'file',
    text,
    attachments,
    links: []
  });
  await updateLastMessage(conversation_id, {
    message_id: msg._id,
    text: msg.text || (attachments[0]?.file_name || 'file'),
    at: new Date()
  });
  return msg;
}

/** Lấy lịch sử tin nhắn (seek pagination) */
async function history({ conversation_id, limit = 20, cursor }) {
  return listMessages({ conversation_id, limit, cursor });
}

/** Đánh dấu đã đọc */
async function markRead({ conversation_id, user_id, last_read_message_id }) {
  await _assertMember(conversation_id, user_id);
  await setLastRead({ conversation_id, user_id, last_read_message_id });
  return { ok: true };
}

module.exports = {
  sendText,
  sendFile,
  history,
  markRead,
};
