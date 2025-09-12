'use strict';

const { insertMessage, listMessages } = require('../repositories/message.repo');
const { updateLastMessage } = require('../repositories/conversation.repo');
const { isMember, setLastRead } = require('../repositories/participant.repo');

/** Kiểm tra ACL: user phải là participant của phòng */
async function _assertMember(conversation_id, user_id) {
  const ok = await isMember({ conversation_id, user_id });
  if (!ok) {
    const e = new Error('FORBIDDEN: not a participant');
    e.status = 403;
    throw e;
  }
}

/** Gửi tin nhắn văn bản */
async function sendText({ conversation_id, user, text = '', links = [] }) {
  await _assertMember(conversation_id, user.user_id);
  const msg = await insertMessage({
    conversation_id,
    sender_id: user.user_id,
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
  await _assertMember(conversation_id, user.user_id);
  const msg = await insertMessage({
    conversation_id,
    sender_id: user.user_id,
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
