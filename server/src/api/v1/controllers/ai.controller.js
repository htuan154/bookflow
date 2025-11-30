'use strict';

/**
 * AI Controller v3.2 [FIXED DEBUGGING]
 * - Đã bật `next_context` để Client/Log thấy được trạng thái bộ nhớ của Bot.
 * - Giữ nguyên logic chống spam và lưu history.
 */

const { saveTurn, recentTurns } = require('../services/chatHistory.service');
const { 
  suggestHybrid, 
  getTopHotels,
  searchHotels,
  getPromotionsValidToday,
  getPromotionsValidTodayByCity,
  getPromotionsByKeywordCityMonth,
  promoCheckApplicability,
  promoUsageStats,
  listHotelCities,
  getHotelsByAmenities,
  getHotelsByAnyAmenities,
  getHotelFull,
  getPromotionsInMonth,
  getPromotionsInMonthByCity,
  getPromotionsByCity
} = require('../services/chatbot.service');

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';

// ==============================================================================
// 1. DEDUPE & CACHE MECHANISM
// ==============================================================================
const recentRequests = new Map(); 
const REQUEST_DEDUPE_WINDOW_MS = 2000;

function checkDuplicateRequest(userId, message) {
  const key = `${userId}:${String(message).trim()}`;
  const now = Date.now();
  const recent = recentRequests.get(key);
  
  if (recent && (now - recent.timestamp) < REQUEST_DEDUPE_WINDOW_MS) {
    return recent.payload; 
  }
  return null;
}

function cacheRequest(userId, message, payload) {
  const key = `${userId}:${String(message).trim()}`;
  recentRequests.set(key, { timestamp: Date.now(), payload });
  
  if (recentRequests.size > 500) {
      const now = Date.now();
      for (const [k, v] of recentRequests.entries()) {
          if (now - v.timestamp > REQUEST_DEDUPE_WINDOW_MS) recentRequests.delete(k);
      }
  }
}

// ==============================================================================
// 2. MAIN HANDLER
// ==============================================================================

async function mainSuggestHandler(req, res, next) {
  try {
    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ error: 'DB_NOT_READY' });

    const { message = '', filters = {}, top_n, session_id } = req.body || {};
    const msg = String(message || '').trim();
    if (!msg) return res.status(400).json({ error: 'message is required' });

    const userId = req.user?.id || 'anonymous';
    const sessionId = req.headers['x-session-id'] || session_id || 'default';
    
    // A. Dedupe Check
    const cachedResponse = checkDuplicateRequest(userId, msg);
    if (cachedResponse) {
       console.log(`[AI] Dedupe hit: ${msg}`);
       res.set('X-Dedupe', 'true');
       return res.json(cachedResponse);
    }

    // B. Lấy Context (History)
    let history = [];
    try {
      history = await recentTurns({ userId, sessionId, limit: 5 });
    } catch (e) {
      console.warn('[AI] Warning: Cannot fetch history', e.message);
    }
    
    const ctx = { 
        use_llm: true, 
        filters: typeof filters === 'object' ? filters : {}, 
        history, 
        session_id: sessionId 
    };
    if (top_n) ctx.top_n = Number(top_n);

    // C. Gọi Service
    console.log(`[AI] Processing: "${msg}" (User: ${userId})`);
    const payload = await suggestHybrid(db, { message: msg, context: ctx });
    
    // D. Xử lý kết quả an toàn
    const safePayload = payload || { 
        summary: "Hệ thống đang bận, vui lòng thử lại sau.", 
        source: "system-error" 
    };
    
    const nextContext = safePayload.next_context || {}; 
    const source = safePayload.source || 'unknown';
    const latency = safePayload.latency_ms || 0;

    // E. Lưu History (Async)
    saveTurn({
        userId, sessionId, messageText: msg, messageRaw: req.body,
        replyPayload: safePayload,
        source: source,
        latencyMs: latency,
        contextState: nextContext 
    }).catch(e => console.error('❌ History Save Error:', e.message));

    // F. Phản hồi Client
    const responsePayload = { ...safePayload };
    
    // 🔥 QUAN TRỌNG: KHÔNG XÓA DÒNG NÀY ĐỂ CLIENT THẤY ĐƯỢC CONTEXT
    // delete responsePayload.next_context; 
    
    cacheRequest(userId, msg, responsePayload);
    return res.json(responsePayload);

  } catch (e) { 
      console.error('[AI Controller] Critical Error:', e);
      return res.status(500).json({ 
          success: false, 
          status: 'error', 
          message: 'Internal Server Error',
          error: process.env.NODE_ENV === 'development' ? e.message : undefined
      });
  }
}

// ==============================================================================
// 3. SQL HANDLERS
// ==============================================================================

async function topHotelsHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    const limit = Number(req.query.limit || 10);
    if (!city) return res.status(400).json({ error: 'city is required' });

    const data = await getTopHotels(city, limit, { llm: USE_LLM });
    return res.json({ success: true, city, limit, data });
  } catch (e) { next(e); }
}

async function searchHotelsHandler(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    const city = String(req.query.city || '').trim();
    const limit = Number(req.query.limit || 10);

    const data = await searchHotels(q, city, limit, { llm: USE_LLM });
    return res.json({ success: true, q, city, limit, data });
  } catch (e) { next(e); }
}

async function promotionsTodayHandler(req, res, next) {
  try {
    const data = await getPromotionsValidToday(50, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}

async function promotionsTodayByCityHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    if (!city) return res.status(400).json({ error: 'city is required' });
    const data = await getPromotionsValidTodayByCity(city, 50, { llm: USE_LLM });
    return res.json({ success: true, city, data });
  } catch (e) { next(e); }
}

async function hotelsByAmenitiesHandler(req, res, next) {
  try {
    const { city, amenities, limit } = req.body;
    const data = await getHotelsByAmenities(city, amenities, limit, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function hotelsByAnyAmenitiesHandler(req, res, next) {
  try {
    const { city, amenities, limit } = req.body;
    const data = await getHotelsByAnyAmenities(city, amenities, limit, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function hotelFullHandler(req, res, next) {
  try {
    const data = await getHotelFull(req.query.id, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function promotionsByMonthHandler(req, res, next) {
  try {
    const { year, month, limit } = req.query;
    const data = await getPromotionsInMonth(year, month, limit, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function promotionsByMonthCityHandler(req, res, next) {
  try {
    const { city, year, month, limit } = req.query;
    const data = await getPromotionsInMonthByCity(city, year, month, limit, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function promotionsByCityHandler(req, res, next) {
  try {
    const data = await getPromotionsByCity(req.query.city, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function promotionsByKeywordCityMonthHandler(req, res, next) {
  try {
    const { q, city, year, month, limit } = req.query;
    const data = await getPromotionsByKeywordCityMonth(q, city, year, month, limit, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function promoCheckHandler(req, res, next) {
  try {
    const { code, user_id, amount } = req.query;
    const data = await promoCheckApplicability(code, user_id, amount, undefined, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function promoStatsHandler(req, res, next) {
  try {
    const data = await promoUsageStats(req.query.promotion_id, { llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}
async function hotelCitiesHandler(req, res, next) {
  try {
    const data = await listHotelCities({ llm: USE_LLM });
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}

module.exports = {
  suggestHandler: mainSuggestHandler,
  topHotelsHandler,
  searchHotelsHandler,
  promotionsTodayHandler,
  promotionsTodayByCityHandler,
  hotelsByAmenitiesHandler,
  hotelsByAnyAmenitiesHandler,
  hotelFullHandler,
  promotionsByMonthHandler,
  promotionsByMonthCityHandler,
  promotionsByCityHandler,
  promotionsByKeywordCityMonthHandler,
  promoCheckHandler,
  promoStatsHandler,
  hotelCitiesHandler
};