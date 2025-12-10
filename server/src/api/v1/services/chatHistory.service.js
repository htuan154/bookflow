'use strict';
const { getDb } = require('../../../config/mongodb');
const COLL = 'chat_history';

// Hàm để làm sạch và giới hạn kích thước của object trước khi lưu vào DB
// Cách làm
// - Nếu object là undefined hoặc null, trả về object rỗng
// - Chuyển object thành chuỗi JSON
// - Nếu độ dài chuỗi vượt quá giới hạn max (200,000 ký tự), trả về object { truncated: true }
// - Nếu không, phân tích chuỗi JSON trở lại object và trả về
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
  const db = getDb(); // Lấy kết nối MongoDB
  
  // Tạo document để lưu vào collection chat_history
  const doc = {
    user_id: userId || 'anonymous', // ID người dùng, nếu không có thì dùng 'anonymous'
    session_id: sessionId, // ID phiên chat
    message: { 
      text: String(messageText || ''), // Nội dung câu hỏi của user
      raw: sanitize(messageRaw) // Dữ liệu gốc của message, đã làm sạch
    }, 
    reply: { 
      text: replyPayload?.summary || '', // Tóm tắt trả lời (summary) từ AI/bot
      payload: sanitize(replyPayload) // Toàn bộ dữ liệu trả lời, đã làm sạch
    },
    nlu: {
      city: nlu.city ?? null, // Thành phố (nếu có)
      intent: nlu.intent ?? null, // Ý định (nếu có)
      top_n: nlu.top_n ?? null, // Số lượng top_n (nếu có)
      filters: sanitize(nlu.filters || {}) // Bộ lọc, đã làm sạch
    },
    context_state: {
      last_entity_name: contextState.entity_name || null, // Tên entity cuối cùng (nếu có)
      last_entity_type: contextState.entity_type || null, // Loại entity cuối cùng (nếu có)
      last_city: contextState.city || null, // Thành phố cuối cùng (nếu có)
    },
    source, // Nguồn trả lời (AI, rule, ...)
    latency_ms: Number.isFinite(latencyMs) ? Number(latencyMs) : null, // Thời gian xử lý (ms)
    meta: { 
      ip: meta.ip || null, // Địa chỉ IP của user (nếu có)
      ua: meta.ua || null // User-Agent của user (nếu có)
    },
    created_at: new Date() // Thời điểm lưu (ngày giờ hiện tại)
  };

  const ret = await db.collection(COLL).insertOne(doc); // Lưu document vào collection chat_history
  return ret.insertedId; // Trả về _id của document vừa tạo
}

async function listSessions(userId, limit = 20) {
    const db = getDb(); // Lấy kết nối MongoDB
    // Tạo pipeline cho aggregation
    const pipeline = [
        { $match: { user_id: userId } }, // Lọc theo user_id
        { $sort: { created_at: 1 } }, // Sắp xếp theo thời gian tạo (tăng dần)
        {
            $group: {
                _id: "$session_id", // Gom nhóm theo session_id
                firstMessage: { $first: "$message.text" }, // Lấy tin nhắn đầu tiên của session
                lastUpdate: { $last: "$created_at" }, // Lấy thời gian cập nhật cuối cùng
                turnCount: { $sum: 1 } // Đếm số lượt chat trong session
            }
        },
        { $sort: { lastUpdate: -1 } }, // Sắp xếp lại theo thời gian cập nhật cuối (giảm dần)
        { $limit: limit } // Giới hạn số lượng session trả về
    ];
    
    // Thực hiện aggregation và chuyển kết quả thành mảng
    const sessions = await db.collection(COLL).aggregate(pipeline).toArray(); 

    // Chuẩn hóa dữ liệu trả về cho client
    return sessions.map(s => {
        // Tạo tiêu đề hiển thị: lấy 60 ký tự đầu của tin nhắn đầu tiên, nếu dài thì thêm '...'
        const displayTitle = s.firstMessage && s.firstMessage.length > 0 
            ? s.firstMessage.substring(0, 60) + (s.firstMessage.length > 60 ? '...' : '') 
            : 'Cuộc hội thoại mới';

        return {
            session_id: s._id, // ID phiên chat
            id: s._id, // ID phiên chat (dùng cho UI)
            _id: s._id, // ID phiên chat (dùng cho UI)
            title: displayTitle, // Tiêu đề phiên chat
            name: displayTitle, // Tên phiên chat
            subject: displayTitle, // Chủ đề phiên chat
            turns: s.turnCount, // Số lượt chat trong phiên
            count: s.turnCount, // Số lượt chat trong phiên
            total: s.turnCount, // Số lượt chat trong phiên
            updated_at: s.lastUpdate, // Thời điểm cập nhật cuối cùng
            createdAt: s.lastUpdate // Thời điểm tạo (dùng cho UI)
        };
    });
}

async function listMessages({ userId, sessionId, page = 1, pageSize = 50 }) {
    const db = getDb(); // Lấy kết nối MongoDB
    const skip = (Math.max(1, page) - 1) * Math.max(1, pageSize); // Tính số lượng bản ghi cần bỏ qua (phân trang)
    
    // In ra thông tin truy vấn
    console.log('[DEBUG listMessages] Query:', { userId, sessionId, page, pageSize });
    
    const query = { user_id: userId, session_id: sessionId }; // Tạo query lọc theo user và session
    const cursor = db.collection(COLL)
        .find(query) // Lấy các bản ghi theo user/session
        .sort({ created_at: 1 }) // Sắp xếp theo thời gian tạo (tăng dần)
        .skip(skip) // Bỏ qua các bản ghi đầu (phân trang)
        .limit(Math.max(1, pageSize)); // Giới hạn số bản ghi trả về

    const itemsRaw = await cursor.toArray(); // Lấy toàn bộ kết quả thành mảng
    console.log('[DEBUG listMessages] Found:', itemsRaw.length, 'items'); // In ra số lượng bản ghi tìm được
    
    // Nếu không có tin nhắn nào, lấy 3 mẫu bất kỳ của user để debug
    if (itemsRaw.length === 0) {
        const sample = await db.collection(COLL).find({ user_id: userId }).limit(3).toArray();
        console.log('[DEBUG listMessages] Sample sessions for user:', sample.map(d => ({
            session_id: d.session_id,
            message: d.message?.text?.substring(0, 30)
        })));
    }
    
    // Đếm tổng số bản ghi phù hợp với query
    const total = await db.collection(COLL).countDocuments(query);

    // Chuẩn hóa dữ liệu trả về cho client
    const items = itemsRaw.map(r => {
        const rawP = r.reply.payload || {}; // Lấy payload trả lời (nếu có)
        const cleanPayload = {
            ...rawP,
            summary: rawP.summary || r.reply.text || '', // Đảm bảo luôn có summary
            hotels: Array.isArray(rawP.hotels) ? rawP.hotels : [], // Đảm bảo luôn là mảng
            promotions: Array.isArray(rawP.promotions) ? rawP.promotions : [],
            places: Array.isArray(rawP.places) ? rawP.places : [],
            dishes: Array.isArray(rawP.dishes) ? rawP.dishes : [],
            tips: Array.isArray(rawP.tips) ? rawP.tips : []
        };

        return {
            id: r._id, // ID bản ghi
            message: r.message.text, // Nội dung câu hỏi 
            reply: r.reply.text, // Nội dung trả lời(tóm tắt)        
            replyPayload: cleanPayload, // Payload trả lời đã chuẩn hóa
            timestamp: r.created_at, // Thời điểm tạo
            source: r.source, // Nguồn trả lời
            intent: r.nlu?.intent // Ý định (nếu có)
        };
    });

    // Trả về object gồm danh sách tin nhắn, tổng số, trang hiện tại, pageSize
    return { items, total, page, pageSize };
}

// Hàm lấy các lượt chat gần nhất của một user trong một session
// Cách làm:
// - Lấy kết nối MongoDB
// - Truy vấn collection chat_history theo user_id và session_id
// - Sắp xếp theo thời gian tạo mới nhất (giảm dần)
// - Giới hạn số lượng bản ghi trả về (mặc định 5)
// - Chỉ lấy các trường cần thiết: message, reply, nlu, context_state, created_at
// - Chuyển kết quả thành mảng và trả về
async function recentTurns({ userId, sessionId, limit = 5 }) {
  const db = getDb(); // Lấy kết nối MongoDB
  return db.collection(COLL)
    .find({ user_id: userId, session_id: sessionId }) // Lọc theo user_id và session_id
    .sort({ created_at: -1 }) // Sắp xếp theo created_at giảm dần
    .limit(Math.max(1, limit)) // Giới hạn số bản ghi trả về
    .project({ message: 1, reply: 1, nlu: 1, context_state: 1, created_at: 1 }) // Chỉ lấy các trường cần thiết
    .toArray(); // Chuyển kết quả thành mảng
}

module.exports = { saveTurn, recentTurns, listSessions, listMessages };