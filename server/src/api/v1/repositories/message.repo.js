'use strict';

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../im/bootstrap');
function oid(id) { return (id instanceof ObjectId) ? id : new ObjectId(String(id)); }

/** Ghi message (text/file) */
async function insertMessage({
  conversation_id, sender_id, sender_role,
  kind = 'text', text = '', attachments = [], links = []
}) {
  const db = getDb();
  const doc = {
    conversation_id: oid(conversation_id),
    sender_id,
    kind,
    text,
    attachments,
    links,
    created_at: new Date()
  };
  const r = await db.collection('messages').insertOne(doc);
  return { _id: r.insertedId, ...doc };
}

/** Phân trang dạng seek theo _id (cursor lùi) */
async function listMessages({ conversation_id, limit = 20, cursor }) {
  const db = getDb();
  const q = { conversation_id: oid(conversation_id) };
  if (cursor) q._id = { $lt: oid(cursor) }; // lấy các message cũ hơn cursor
  const rows = await db.collection('messages')
    .find(q).sort({ _id: -1 }).limit(Math.min(limit, 100)).toArray();
  const nextCursor = rows.length ? rows[rows.length - 1]._id : null;
  return { items: rows, nextCursor };
}

module.exports = {
  insertMessage,
  listMessages,
};
