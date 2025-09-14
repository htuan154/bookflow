'use strict';
const { getDb } = require('../../../config/mongodb'); // file mongodb.js của bạn đã có

const COLL = 'chat_history';

function sanitize(obj, max = 200_000) { // chống ghi document quá lớn
  try {
    const s = JSON.stringify(obj);
    if (s.length > max) return { truncated: true };
    return obj;
  } catch {
    return { invalid: true };
  }
}

async function saveTurn({
  userId,
  sessionId,
  messageText,
  messageRaw,
  replyPayload,
  nlu = {},
  source,
  latencyMs,
  meta = {},
}) {
  const db = getDb();
  const doc = {
    user_id: userId || 'anonymous',
    session_id: sessionId,
    message: {
      text: String(messageText || ''),
      raw: sanitize(messageRaw)
    },
    reply: {
      text: replyPayload?.summary || null,      // nếu có
      payload: sanitize(replyPayload)
    },
    nlu: {
      city: nlu.city ?? null,
      intent: nlu.intent ?? null,
      top_n: nlu.top_n ?? null,
      filters: sanitize(nlu.filters || {})
    },
    source,
    latency_ms: Number.isFinite(latencyMs) ? Number(latencyMs) : null,
    meta: {
      ip: meta.ip || null,
      ua: meta.ua || null,
    },
    created_at: new Date()
  };
  const ret = await db.collection(COLL).insertOne(doc);
  return ret.insertedId;
}

async function listSessions(userId, limit = 20) {
  const db = getDb();
  const pipeline = [
    { $match: { user_id: userId } },
    { $sort: { created_at: -1 } },
    { $group: {
        _id: '$session_id',
        first_at: { $last: '$created_at' },
        last_at: { $first: '$created_at' },
        turns: { $sum: 1 },
        last_question: { $first: '$message.text' },
        last_source: { $first: '$source' }
    }},
    { $sort: { last_at: -1 } },
    { $limit: limit }
  ];
  return db.collection(COLL).aggregate(pipeline).toArray();
}

async function listMessages({ userId, sessionId, page = 1, pageSize = 20 }) {
  const db = getDb();
  const skip = (Math.max(1, page) - 1) * Math.max(1, pageSize);
  const cursor = db.collection(COLL)
    .find({ user_id: userId, session_id: sessionId })
    .sort({ created_at: 1 })
    .skip(skip)
    .limit(Math.max(1, pageSize));
  const items = await cursor.toArray();
  const total = await db.collection(COLL).countDocuments({ user_id: userId, session_id: sessionId });
  return { items, total, page, pageSize };
}

module.exports = { saveTurn, listSessions, listMessages };
