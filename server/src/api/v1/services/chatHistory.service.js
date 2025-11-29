'use strict';
const { getDb } = require('../../../config/mongodb');
const COLL = 'chat_history';

function sanitize(obj, max = 200_000) {
  try {
    if (obj === undefined || obj === null) return {}; 
    const s = JSON.stringify(obj);
    if (s.length > max) return { truncated: true };
    return JSON.parse(s);
  } catch {
    return { invalid: true };
  }
}

async function saveTurn({ 
  userId, sessionId, messageText, messageRaw, replyPayload, nlu = {}, source, latencyMs, contextState = {}, meta = {} 
}) {
  const db = getDb();
  
  const doc = {
    user_id: userId || 'anonymous',
    session_id: sessionId,
    message: { text: String(messageText || ''), raw: sanitize(messageRaw) },
    reply: { text: replyPayload?.summary || '', payload: sanitize(replyPayload) },
    nlu: {
      city: nlu.city ?? null,
      intent: nlu.intent ?? null,
      top_n: nlu.top_n ?? null,
      filters: sanitize(nlu.filters || {})
    },
    context_state: {
      last_entity_name: contextState.entity_name || null,
      last_entity_type: contextState.entity_type || null,
      last_city: contextState.city || null,
    },
    source,
    latency_ms: Number.isFinite(latencyMs) ? Number(latencyMs) : null,
    meta: { ip: meta.ip || null, ua: meta.ua || null },
    created_at: new Date()
  };

  const ret = await db.collection(COLL).insertOne(doc);
  return ret.insertedId;
}

async function listSessions(userId, limit = 20) {
    const db = getDb();
    const pipeline = [
        { $match: { user_id: userId } },
        { $sort: { created_at: 1 } },
        {
            $group: {
                _id: "$session_id", 
                firstMessage: { $first: "$message.text" },
                lastUpdate: { $last: "$created_at" }, 
                turnCount: { $sum: 1 } 
            }
        },
        { $sort: { lastUpdate: -1 } },
        { $limit: limit }
    ];
    
    const sessions = await db.collection(COLL).aggregate(pipeline).toArray();

    return sessions.map(s => {
        const displayTitle = s.firstMessage && s.firstMessage.length > 0 
            ? s.firstMessage.substring(0, 60) + (s.firstMessage.length > 60 ? '...' : '') 
            : 'Cuộc hội thoại mới';

        return {
            session_id: s._id,
            id: s._id,
            _id: s._id,
            title: displayTitle,
            name: displayTitle,
            subject: displayTitle,
            turns: s.turnCount,
            count: s.turnCount,
            total: s.turnCount,
            updated_at: s.lastUpdate,
            createdAt: s.lastUpdate
        };
    });
}

async function listMessages({ userId, sessionId, page = 1, pageSize = 50 }) {
    const db = getDb();
    const skip = (Math.max(1, page) - 1) * Math.max(1, pageSize);
    
    // ✅ DEBUG
    console.log('[DEBUG listMessages] Query:', { userId, sessionId, page, pageSize });
    
    const query = { user_id: userId, session_id: sessionId };
    const cursor = db.collection(COLL)
        .find(query)
        .sort({ created_at: 1 }) 
        .skip(skip)
        .limit(Math.max(1, pageSize));

    const itemsRaw = await cursor.toArray();
    console.log('[DEBUG listMessages] Found:', itemsRaw.length, 'items');
    
    // ✅ If empty, show sample data
    if (itemsRaw.length === 0) {
        const sample = await db.collection(COLL).find({ user_id: userId }).limit(3).toArray();
        console.log('[DEBUG listMessages] Sample sessions for user:', sample.map(d => ({
            session_id: d.session_id,
            message: d.message?.text?.substring(0, 30)
        })));
    }
    
    const total = await db.collection(COLL).countDocuments(query);

    const items = itemsRaw.map(r => {
        const rawP = r.reply.payload || {};
        const cleanPayload = {
            ...rawP,
            summary: rawP.summary || r.reply.text || '',
            hotels: Array.isArray(rawP.hotels) ? rawP.hotels : [],
            promotions: Array.isArray(rawP.promotions) ? rawP.promotions : [],
            places: Array.isArray(rawP.places) ? rawP.places : [],
            dishes: Array.isArray(rawP.dishes) ? rawP.dishes : [],
            tips: Array.isArray(rawP.tips) ? rawP.tips : []
        };

        return {
            id: r._id,
            message: r.message.text,     
            reply: r.reply.text,         
            replyPayload: cleanPayload,
            timestamp: r.created_at,
            source: r.source,
            intent: r.nlu?.intent
        };
    });

    return { items, total, page, pageSize };
}

async function recentTurns({ userId, sessionId, limit = 5 }) {
  const db = getDb();
  return db.collection(COLL)
    .find({ user_id: userId, session_id: sessionId })
    .sort({ created_at: -1 })
    .limit(Math.max(1, limit))
    .project({ message: 1, reply: 1, nlu: 1, context_state: 1, created_at: 1 })
    .toArray();
}

module.exports = { saveTurn, recentTurns, listSessions, listMessages };