'use strict';

/**
 * AI Controller
 */

const { analyze, normalize } = require('../services/nlu.service');
const { saveTurn, recentTurns } = require('../services/chatHistory.service');

const {
  searchHotels,
  getHotelsByAnyAmenities,
  getHotelFull,
  getPromotionsValidToday,
  getPromotionsValidTodayByCity,
  getPromotionsByKeywordCityMonth,
  promoCheckApplicability,
  promoUsageStats,
  listHotelCities,
  suggestHandler, // Note: This self-reference might be wrong in your original code, usually controllers don't import themselves.
                  // I will assume you meant suggestHybrid/suggest from service.
  suggest,
  suggestHybrid,
  getTopHotels,
  getHotelsByAmenities,
  getPromotionsInMonth,
  getPromotionsInMonthByCity,
  getPromotionsByCity,
} = require('../services/chatbot.service');

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';

// ===== REQUEST DEDUPE MECHANISM =====
const recentRequests = new Map(); 
const REQUEST_DEDUPE_WINDOW_MS = 2000;

function makeRequestKey(userId, message) {
  const msgHash = normalize(String(message || '')).slice(0, 100);
  return `${userId || 'anon'}:${msgHash}`;
}

function checkDuplicateRequest(userId, message) {
  const key = makeRequestKey(userId, message);
  const now = Date.now();
  const recent = recentRequests.get(key);
  
  if (recent && (now - recent.timestamp) < REQUEST_DEDUPE_WINDOW_MS) {
    console.warn('[AI] Duplicate request detected:', { userId, message: message?.slice(0, 50) });
    return recent.payload; 
  }
  return null;
}

function cacheRequest(userId, message, payload) {
  const key = makeRequestKey(userId, message);
  recentRequests.set(key, { timestamp: Date.now(), payload });
  if (recentRequests.size > 500) {
    const cutoff = Date.now() - REQUEST_DEDUPE_WINDOW_MS;
    for (const [k, v] of recentRequests.entries()) {
      if (v.timestamp < cutoff) recentRequests.delete(k);
    }
  }
}

// =================================================================
// MAIN HANDLER
// =================================================================

async function mainSuggestHandler(req, res, next) {
  try {
    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ error: 'DB_NOT_READY' });

    const { message = '', filters = {}, top_n, session_id } = req.body || {};
    const msg = String(message || '').trim();
    if (!msg) return res.status(400).json({ error: 'message is required (string)' });

    const userId = req.user?.id || 'anonymous';
    const sessionId = req.headers['x-session-id'] || session_id || 'default';
    
    // Dedupe
    const cachedResponse = checkDuplicateRequest(userId, msg);
    if (cachedResponse) {
      console.log('[AI] Returning cached response (dedupe)');
      res.set('X-Dedupe', 'true');
      return res.json(cachedResponse);
    }

    console.log('[AI] Processing new request:', msg, `(User: ${userId})`);
    
    // NLU & History
    const nlu = analyze(msg);
    let history = [];
    try {
      history = await recentTurns({ userId, sessionId, limit: 5 });
    } catch (e) {
      console.warn('[AI] recentTurns failed:', e?.message || e);
    }
    
    console.log('[AI] NLU result:', { city: nlu.city, intent: nlu.intent, top_n: nlu.top_n, hist: history.length });
    const limit = Number(top_n || nlu.top_n || 10);

    const ctx = { use_llm: true, filters: typeof filters === 'object' ? filters : {}, history };
    if (Number.isFinite(limit) && limit > 0 && limit <= 20) ctx.top_n = limit;

    const t0 = process.hrtime.bigint();
    
    // --- GỌI SERVICE ---
    const payload = await suggestHybrid(db, { message: msg, context: { ...ctx, session_id: sessionId } });
    
    const nextContext = payload.next_context || {};

    console.log('[AI] suggestHybrid result:', { 
      source: payload.source, 
      hasHotels: payload.hotels?.length || 0,
      summary: payload.summary?.slice(0, 50) + '...',
      nextContext 
    });
    
    const t1 = process.hrtime.bigint();
    const latency = Number(t1 - t0) / 1e6;

    res.set('X-Source', payload.source || 'sql+nosql+llm');
    res.set('X-Latency-ms', (payload.latency_ms ?? latency).toFixed(1));

    cacheRequest(userId, msg, payload);

    // --- DEBUG HISTORY SAVING ---
    try {
      console.log(`[History] Saving turn... User: ${userId}, Session: ${sessionId}`);
      await saveTurn({
        userId,
        sessionId,
        messageText: msg,
        messageRaw: req.body,
        replyPayload: payload,
        nlu,
        source: payload.source || 'sql+nosql+llm',
        latencyMs: payload.latency_ms ?? latency,
        contextState: nextContext, 
        meta: { ip: req.ip, ua: req.headers['user-agent'] }
      });
      console.log('[History] Save OK.');
    } catch (err) {
      console.error('❌ [History] Save Failed:', err.message);
    }

    // Cleanup response
    delete payload.next_context;

    return res.json(payload);
  } catch (e) { next(e); }
}

// =================================================================
// SQL ENDPOINTS (Giữ nguyên)
// =================================================================

async function topHotelsHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    const limit = Number(req.query.limit || 10);
    if (!city) return res.status(400).json({ error: 'city is required' });

    const t0 = process.hrtime.bigint();
    const data = await getTopHotels(city, limit, { llm: USE_LLM, context: { top_n: limit, filters: { city } } });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:top');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, limit, data });
  } catch (e) { next(e); }
}

async function hotelsByAmenitiesHandler(req, res, next) {
  try {
    const { city = '', amenities = [], limit = 10 } = req.body || {};
    if (!city || !Array.isArray(amenities) || amenities.length === 0)
      return res.status(400).json({ error: 'city and amenities[] are required' });

    const t0 = process.hrtime.bigint();
    const data = await getHotelsByAmenities(String(city), amenities, Number(limit), {
      llm: USE_LLM, context: { top_n: limit, filters: { city, amenities } }
    });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:amenities');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, amenities, limit, data });
  } catch (e) { next(e); }
}

async function promotionsByMonthHandler(req, res, next) {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const limit = Number(req.query.limit || 20);
    if (!year || !month) return res.status(400).json({ error: 'year and month are required' });

    const t0 = process.hrtime.bigint();
    const data = await getPromotionsInMonth(year, month, limit, {
      llm: USE_LLM, context: { top_n: limit, filters: { year, month } }
    });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:promo-all');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, year, month, limit, data });
  } catch (e) { next(e); }
}

async function promotionsByMonthCityHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const limit = Number(req.query.limit || 20);
    if (!city || !year || !month) return res.status(400).json({ error: 'city, year and month are required' });

    const t0 = process.hrtime.bigint();
    const data = await getPromotionsInMonthByCity(city, year, month, limit, {
      llm: USE_LLM, context: { top_n: limit, filters: { city, year, month } }
    });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:promo-city');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, year, month, limit, data });
  } catch (e) { next(e); }
}

async function promotionsByCityHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    if (!city) return res.status(400).json({ error: 'city is required' });

    const t0 = process.hrtime.bigint();
    const data = await getPromotionsByCity(city, { llm: USE_LLM, context: { filters: { city } } });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:promo-city-anytime');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, data });
  } catch (e) { next(e); }
}

async function searchHotelsHandler(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    const city = String(req.query.city || '').trim();
    const limit = Number(req.query.limit || 10);

    const t0 = process.hrtime.bigint();
    const data = await searchHotels(q, city, limit, {
      llm: USE_LLM, context: { top_n: limit, filters: { city, q } }
    });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:search');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, q, city, limit, data });
  } catch (e) { next(e); }
}

async function hotelsByAnyAmenitiesHandler(req, res, next) {
  try {
    const { city = '', amenities = [], limit = 10 } = req.body || {};
    if (!city || !Array.isArray(amenities) || amenities.length === 0)
      return res.status(400).json({ error: 'city and amenities[] are required' });

    const t0 = process.hrtime.bigint();
    const data = await getHotelsByAnyAmenities(String(city), amenities, Number(limit), {
      llm: USE_LLM, context: { top_n: limit, filters: { city, amenities } }
    });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:any-amenities');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, amenities, limit, data });
  } catch (e) { next(e); }
}

async function hotelFullHandler(req, res, next) {
  try {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const t0 = process.hrtime.bigint();
    const data = await getHotelFull(id, { llm: USE_LLM, context: { filters: { id } } });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:hotel-full');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, id, data });
  } catch (e) { next(e); }
}

async function promotionsTodayHandler(req, res, next) {
  try {
    const t0 = process.hrtime.bigint();
    const data = await getPromotionsValidToday(50, { llm: USE_LLM });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:promo-today');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}

async function promotionsTodayByCityHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    if (!city) return res.status(400).json({ error: 'city is required' });

    const t0 = process.hrtime.bigint();
    const data = await getPromotionsValidTodayByCity(city, 50, { llm: USE_LLM, context: { filters: { city } } });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:promo-today-city');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, data });
  } catch (e) { next(e); }
}

async function promotionsByKeywordCityMonthHandler(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    const city = String(req.query.city || '').trim();
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const limit = Number(req.query.limit || 20);

    const t0 = process.hrtime.bigint();
    const data = await getPromotionsByKeywordCityMonth(q, city, year, month, limit, {
      llm: USE_LLM, context: { top_n: limit, filters: { q, city, year, month } }
    });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:promo-search');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, q, city, year, month, limit, data });
  } catch (e) { next(e); }
}

async function promoCheckHandler(req, res, next) {
  try {
    const { promotion_id = '', code = '', booking_date, city, user_id, amount } = req.query || {};
    const promoId = promotion_id || code; 
    if (!promoId) return res.status(400).json({ error: 'promotion_id or code is required' });

    const t0 = process.hrtime.bigint();
    const data = await promoCheckApplicability(
      promoId,
      user_id,
      Number(amount) || 0,
      booking_date ? String(booking_date) : undefined,
      { llm: USE_LLM, context: { filters: { city }, user_id, amount, booking_date } }
    );
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:promo-check');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, promotion_id: promoId, booking_date, city, data });
  } catch (e) { next(e); }
}

async function promoStatsHandler(req, res, next) {
  try {
    const promotionId = String(req.query.promotion_id || '').trim();
    if (!promotionId) return res.status(400).json({ error: 'promotion_id is required' });

    const t0 = process.hrtime.bigint();
    const data = await promoUsageStats(promotionId, { llm: USE_LLM });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:promo-stats');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, promotion_id: promotionId, data });
  } catch (e) { next(e); }
}

async function hotelCitiesHandler(req, res, next) {
  try {
    const t0 = process.hrtime.bigint();
    const data = await listHotelCities({ llm: USE_LLM });
    const t1 = process.hrtime.bigint();
    res.set('X-Source', USE_LLM ? 'sql+llm' : 'sql:hotel-cities');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}

module.exports = {
  suggestHandler: mainSuggestHandler, // Export logic chính

  topHotelsHandler,
  hotelsByAmenitiesHandler,
  searchHotelsHandler,
  hotelsByAnyAmenitiesHandler,
  hotelFullHandler,
  hotelCitiesHandler,
  promotionsByMonthHandler,
  promotionsByMonthCityHandler,
  promotionsByCityHandler,
  promotionsTodayHandler,
  promotionsTodayByCityHandler,
  promotionsByKeywordCityMonthHandler,
  promoCheckHandler,
  promoStatsHandler,
};