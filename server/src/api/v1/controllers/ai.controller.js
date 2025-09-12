'use strict';

const { analyze, normalize } = require('../services/nlu.service');
const { saveTurn } = require('../services/chatHistory.service');
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
  // NoSQL/LLM fallback
  suggest,

  // Supabase RPC wrappers (trả về data trực tiếp)
  getTopHotels,
  getHotelsByAmenities,
  getPromotionsInMonth,
  getPromotionsInMonthByCity,
  getPromotionsByCity,
} = require('../services/chatbot.service');

/** POST /api/v1/ai/suggest
 *  - Tự detect intent.
 *  - Nếu là "khách sạn/khuyến mãi" => gọi SQL (Supabase RPC).
 *  - Ngược lại => fallback NoSQL/LLM hiện có.
 */
// async function suggestHandler(req, res, next) {
//   try {
//     const db = req.app.locals.db;
//     if (!db) return res.status(503).json({ error: 'DB_NOT_READY' });

//     const { message = '', filters = {}, top_n, use_llm } = req.body || {};
//     const msg = String(message || '').trim();
//     if (!msg) return res.status(400).json({ error: 'message is required (string)' });

//     // NLU
//     const nlu = analyze(msg);
//     const msgNorm = normalize(msg); // không dấu, lower, clean
//     const city = (filters && filters.city) || nlu.city || null;
//     const limit = Number(top_n || nlu.top_n || 10);

//     // ===== HOTEL (SQL) =======================================================
//     const isHotel = /(khach\s*san|^ks\b|hotel)/i.test(msgNorm);
//     if (isHotel && city) {
//       // tiện nghi cơ bản từ câu
//       const amenities = [];
//       if (/(ho boi|pool)/i.test(msgNorm)) amenities.push('pool');
//       if (/(wifi|wi-?fi)/i.test(msgNorm)) amenities.push('wifi');
//       if (/(bu?a?\s*sang|bua sang|breakfast)/i.test(msgNorm)) amenities.push('breakfast');
//       if (/spa/i.test(msgNorm)) amenities.push('spa');
//       if (/gym/i.test(msgNorm)) amenities.push('gym');

//       const t0 = process.hrtime.bigint();
//       let data;
//       if (amenities.length) {
//         data = await getHotelsByAmenities(city, amenities, limit);
//         const t1 = process.hrtime.bigint();
//         res.set('X-Source', 'sql:amenities');
//         res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
//         return res.json({ city, limit, amenities, hotels: data, source: 'sql:amenities' });
//       } else {
//         data = await getTopHotels(city, limit);
//         const t1 = process.hrtime.bigint();
//         res.set('X-Source', 'sql:top');
//         res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
//         return res.json({ city, limit, hotels: data, source: 'sql:top' });
//       }
//     }

//     // ===== PROMOTION (SQL) ===================================================
//     const isPromo = /(khuyen\s*mai|voucher|ma\s*giam|promo)/i.test(msgNorm);
//     if (isPromo) {
//       // bắt tháng/năm đơn giản
//       const m = msgNorm.match(/thang\s*(\d{1,2})/i);
//       const y = msgNorm.match(/\b(20\d{2})\b/);
//       const now = new Date();
//       const month = m ? Number(m[1]) : now.getMonth() + 1;
//       const year  = y ? Number(y[1]) : now.getFullYear();

//       const t0 = process.hrtime.bigint();
//       let data;
//       if (city) {
//         data = await getPromotionsInMonthByCity(city, year, month, 20);
//         const t1 = process.hrtime.bigint();
//         res.set('X-Source', 'sql:promo-city');
//         res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
//         return res.json({ city, year, month, promotions: data, source: 'sql:promo-city' });
//       } else {
//         data = await getPromotionsInMonth(year, month, 20);
//         const t1 = process.hrtime.bigint();
//         res.set('X-Source', 'sql:promo-all');
//         res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
//         return res.json({ city: null, year, month, promotions: data, source: 'sql:promo-all' });
//       }
//     }

//     // ===== FALLBACK: NoSQL/LLM ===============================================
//     const ctx = { filters: typeof filters === 'object' ? filters : {} };
//     if (Number.isFinite(top_n) && top_n > 0 && top_n <= 20) ctx.top_n = top_n;
//     if (typeof use_llm === 'boolean') ctx.use_llm = use_llm;

//     const t0 = process.hrtime.bigint();
//     const data = await suggest(db, { message: msg, context: ctx });
//     const t1 = process.hrtime.bigint();
//     res.set('X-Source', 'nosql+llm');
//     res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
//     return res.json(data);
//   } catch (err) {
//     next(err);
//   }
// }

// ====================== HANDLERS SQL (test qua HTTP) =========================

/** GET /api/v1/ai/hotels/top?city=...&limit=... */
async function topHotelsHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    const limit = Number(req.query.limit || 10);
    if (!city) return res.status(400).json({ error: 'city is required' });

    const t0 = process.hrtime.bigint();
    const data = await getTopHotels(city, limit);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:top');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data, city, limit });
  } catch (e) { next(e); }
}

/** POST /api/v1/ai/hotels/by-amenities { city, amenities:[], limit } */
async function hotelsByAmenitiesHandler(req, res, next) {
  try {
    const { city, amenities = [], limit = 10 } = req.body || {};
    if (!city || !Array.isArray(amenities) || amenities.length === 0) {
      return res.status(400).json({ error: 'city and amenities[] are required' });
    }
    const t0 = process.hrtime.bigint();
    const data = await getHotelsByAmenities(String(city).trim(), amenities, Number(limit));
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:amenities');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data, city, amenities, limit });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/promotions/by-month?year=YYYY&month=M&limit=20 */
async function promotionsByMonthHandler(req, res, next) {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const limit = Number(req.query.limit || 20);
    if (!year || !month) return res.status(400).json({ error: 'year and month are required' });

    const t0 = process.hrtime.bigint();
    const data = await getPromotionsInMonth(year, month, limit);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:promo-all');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data, year, month, limit });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/promotions/by-month-city?city=...&year=YYYY&month=M&limit=20 */
async function promotionsByMonthCityHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const limit = Number(req.query.limit || 20);
    if (!city || !year || !month) {
      return res.status(400).json({ error: 'city, year and month are required' });
    }
    const t0 = process.hrtime.bigint();
    const data = await getPromotionsInMonthByCity(city, year, month, limit);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:promo-city');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data, city, year, month, limit });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/promotions/by-city?city=... */
async function promotionsByCityHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    if (!city) return res.status(400).json({ error: 'city is required' });

    const t0 = process.hrtime.bigint();
    const data = await getPromotionsByCity(city);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:promo-city-anytime');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data, city });
  } catch (e) { next(e); }
}
async function suggestHandler(req, res, next) {
  try {
    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ error: 'DB_NOT_READY' });

    const { message = '', filters = {}, top_n, use_llm, session_id } = req.body || {};
    const msg = String(message || '').trim();
    if (!msg) return res.status(400).json({ error: 'message is required (string)' });

    // Debug auth info
    console.log('🔍 Auth Debug:');
    console.log('  - req.user:', req.user);
    console.log('  - req.headers.authorization:', req.headers.authorization?.slice(0, 30) + '...');
    console.log('  - req.headers["x-session-id"]:', req.headers['x-session-id']);

    const nlu = analyze(msg);
    const msgNorm = normalize(msg);
    const city = (filters && filters.city) || nlu.city || null;
    const limit = Number(top_n || nlu.top_n || 10);

    // Lấy user ID từ middleware auth
    const userId = req.user?.id || req.user?.user_id || req.user?._id || 'anonymous';
    console.log('👤 Final userId:', userId);
    
    const sessionId = req.headers['x-session-id'] || session_id || null;
    const meta = { ip: req.ip, ua: req.headers['user-agent'] };

    // ===== HOTEL (SQL)
    const isHotel = /(khach\s*san|^ks\b|hotel)/i.test(msgNorm);
    if (isHotel && city) {
      const amenities = [];
      if (/(ho boi|pool)/i.test(msgNorm)) amenities.push('pool');
      if (/(wifi|wi-?fi)/i.test(msgNorm)) amenities.push('wifi');
      if (/(bu?a?\s*sang|bua sang|breakfast)/i.test(msgNorm)) amenities.push('breakfast');
      if (/spa/i.test(msgNorm)) amenities.push('spa');
      if (/gym/i.test(msgNorm)) amenities.push('gym');

      const t0 = process.hrtime.bigint();
      let data, result, source;
      if (amenities.length) {
        data = await getHotelsByAmenities(city, amenities, limit);
        source = 'sql:amenities';
        result = { city, limit, amenities, hotels: data, source };
      } else {
        data = await getTopHotels(city, limit);
        source = 'sql:top';
        result = { city, limit, hotels: data, source };
      }
      const t1 = process.hrtime.bigint();
      const latency = Number(t1 - t0) / 1e6;
      res.set('X-Source', source);
      res.set('X-Latency-ms', latency.toFixed(1));

      // LƯU LỊCH SỬ
      saveTurn({
        userId, sessionId,
        messageText: msg, messageRaw: req.body,
        replyPayload: result,
        nlu: { ...nlu, intent: 'hotel' },
        source, latencyMs: latency, meta
      }).catch(() => {});

      return res.json(result);
    }

    // ===== PROMOTION (SQL)
    const isPromo = /(khuyen\s*mai|voucher|ma\s*giam|promo)/i.test(msgNorm);
    if (isPromo) {
      const m = msgNorm.match(/thang\s*(\d{1,2})/i);
      const y = msgNorm.match(/\b(20\d{2})\b/);
      const now = new Date();
      const month = m ? Number(m[1]) : now.getMonth() + 1;
      const year  = y ? Number(y[1]) : now.getFullYear();

      const t0 = process.hrtime.bigint();
      let data, result, source;
      if (city) {
        data = await getPromotionsInMonthByCity(city, year, month, 20);
        source = 'sql:promo-city';
        result = { city, year, month, promotions: data, source };
      } else {
        data = await getPromotionsInMonth(year, month, 20);
        source = 'sql:promo-all';
        result = { city: null, year, month, promotions: data, source };
      }
      const t1 = process.hrtime.bigint();
      const latency = Number(t1 - t0) / 1e6;
      res.set('X-Source', source);
      res.set('X-Latency-ms', latency.toFixed(1));

      saveTurn({
        userId, sessionId,
        messageText: msg, messageRaw: req.body,
        replyPayload: result,
        nlu: { ...nlu, intent: 'promotion' },
        source, latencyMs: latency, meta
      }).catch(() => {});

      return res.json(result);
    }

    // ===== FALLBACK: NoSQL/LLM
    const ctx = { filters: typeof filters === 'object' ? filters : {} };
    if (Number.isFinite(top_n) && top_n > 0 && top_n <= 20) ctx.top_n = top_n;
    if (typeof use_llm === 'boolean') ctx.use_llm = use_llm;

    const t0 = process.hrtime.bigint();
    const data = await suggest(db, { message: msg, context: ctx });
    const t1 = process.hrtime.bigint();
    const latency = Number(t1 - t0) / 1e6;
    res.set('X-Source', 'nosql+llm');
    res.set('X-Latency-ms', latency.toFixed(1));

    const result = { ...data, source: 'nosql+llm' };

    console.log('💾 Saving turn with userId:', userId);
    saveTurn({
      userId, 
      sessionId,
      messageText: msg, 
      messageRaw: req.body,
      replyPayload: result,
      nlu: { ...nlu, intent: nlu.intent || 'general' },
      source: 'nosql+llm', 
      latencyMs: latency, 
      meta
    }).catch((err) => {
      console.error('❌ Save turn error:', err);
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
}
/** GET /api/v1/ai/hotels/search?city=...&q=...&limit=20 */
async function searchHotelsHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    const q = req.query.q ? String(req.query.q).trim() : null;
    const limit = Number(req.query.limit || 20);
    if (!city) return res.status(400).json({ error: 'city is required' });

    const t0 = process.hrtime.bigint();
    const data = await searchHotels(city, q, limit);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:search-hotels');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, q, limit, data });
  } catch (e) { next(e); }
}

/** POST /api/v1/ai/hotels/by-any-amenities { city, amenities:[], limit } */
async function hotelsByAnyAmenitiesHandler(req, res, next) {
  try {
    const { city, amenities = [], limit = 10 } = req.body || {};
    if (!city || !Array.isArray(amenities) || amenities.length === 0) {
      return res.status(400).json({ error: 'city and amenities[] are required' });
    }
    const t0 = process.hrtime.bigint();
    const data = await getHotelsByAnyAmenities(String(city).trim(), amenities, Number(limit));
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:any-amenities');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, amenities, limit, data });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/hotels/full/:id */
async function hotelFullHandler(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'hotel id is required' });
    const t0 = process.hrtime.bigint();
    const data = await getHotelFull(id);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:hotel-full');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/promotions/today?limit=50 */
async function promotionsTodayHandler(req, res, next) {
  try {
    const limit = Number(req.query.limit || 50);
    const t0 = process.hrtime.bigint();
    const data = await getPromotionsValidToday(limit);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:promo-today');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, limit, data });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/promotions/today-by-city?city=...&limit=50 */
async function promotionsTodayByCityHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    const limit = Number(req.query.limit || 50);
    if (!city) return res.status(400).json({ error: 'city is required' });
    const t0 = process.hrtime.bigint();
    const data = await getPromotionsValidTodayByCity(city, limit);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:promo-today-city');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, limit, data });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/promotions/search?city=...&kw=...&year=YYYY&month=M&limit=50 */
async function promotionsByKeywordCityMonthHandler(req, res, next) {
  try {
    const city = String(req.query.city || '').trim();
    const kw = req.query.kw ? String(req.query.kw).trim() : null;
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const limit = Number(req.query.limit || 50);
    if (!city || !year || !month) {
      return res.status(400).json({ error: 'city, year, month are required' });
    }
    const t0 = process.hrtime.bigint();
    const data = await getPromotionsByKeywordCityMonth(city, kw, year, month, limit);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:promo-keyword-city-month');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, city, kw, year, month, limit, data });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/promotions/check?code=...&user=...&amount=...&when=ISO */
async function promoCheckHandler(req, res, next) {
  try {
    const code = String(req.query.code || '').trim();
    const user = String(req.query.user || '').trim(); // user_id (uuid)
    const amount = Number(req.query.amount);
    const when = req.query.when ? String(req.query.when).trim() : null;
    if (!code || !user || !Number.isFinite(amount)) {
      return res.status(400).json({ error: 'code, user, amount are required' });
    }
    const t0 = process.hrtime.bigint();
    const data = await promoCheckApplicability(code, user, amount, when);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:promo-check');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, code, user, amount, when, data });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/promotions/stats/:promotion_id */
async function promoStatsHandler(req, res, next) {
  try {
    const promotionId = String(req.params.promotion_id || '').trim();
    if (!promotionId) return res.status(400).json({ error: 'promotion_id is required' });
    const t0 = process.hrtime.bigint();
    const data = await promoUsageStats(promotionId);
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:promo-stats');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, promotionId, data });
  } catch (e) { next(e); }
}

/** GET /api/v1/ai/hotel-cities */
async function hotelCitiesHandler(req, res, next) {
  try {
    const t0 = process.hrtime.bigint();
    const data = await listHotelCities();
    const t1 = process.hrtime.bigint();
    res.set('X-Source', 'sql:hotel-cities');
    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json({ success: true, data });
  } catch (e) { next(e); }
}

module.exports = {
  searchHotelsHandler,
  hotelsByAnyAmenitiesHandler,
  hotelFullHandler,
  promotionsTodayHandler,
  promotionsTodayByCityHandler,
  promotionsByKeywordCityMonthHandler,
  promoCheckHandler,
  promoStatsHandler,
  hotelCitiesHandler,
  // endpoint “tất cả trong một”
  suggestHandler,

  // endpoints test SQL trực tiếp
  topHotelsHandler,
  hotelsByAmenitiesHandler,
  promotionsByMonthHandler,
  promotionsByMonthCityHandler,
  promotionsByCityHandler,
};
