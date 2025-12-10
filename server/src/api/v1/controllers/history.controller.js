'use strict';
const H = require('../services/chatHistory.service');

// Lấy danh sách các phiên chat (sessions) của người dùng
exports.listSessionsHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
        console.warn('[History] listSessions called without userId');
        return res.json({ success: true, data: [] });
    }

    console.log(`[History] Fetching sessions for User: ${userId}`);
    const sessions = await H.listSessions(userId);
    
    console.log(`[History] Found ${sessions.length} sessions.`);
    res.json({ success: true, data: sessions });
  } catch (e) { 
    console.error('[History] Error listing sessions:', e);
    next(e); 
  }
};

// Lấy danh sách các tin nhắn trong một phiên chat (session) cụ thể của người dùng
exports.listMessagesHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.query;
    const finalSessionId = session_id || req.headers['x-session-id'];

    if (!userId || !finalSessionId) {
        return res.status(400).json({ error: 'Missing userId or sessionId' });
    }

    console.log(`[History] Fetching messages for Session: ${finalSessionId}`);

    // ✅ FIX: Truyền params dưới dạng object
    const result = await H.listMessages({ 
      userId, 
      sessionId: finalSessionId,
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.page_size) || 50
    });
    
    res.json({ success: true, ...result });
  } catch (e) { 
    console.error('[History] Error listing messages:', e);
    next(e); 
  }
};