'use strict';

/**
 * Chatbot Service v6.1 [FULL RESTORED & FIXED]
 * - Đã khôi phục toàn bộ các hàm Supabase bị thiếu.
 * - Đã bao gồm fix lỗi Regex tìm kiếm "Eo Gió".
 */

const { analyze, normalize } = require('./nlu.service');
const repo = require('../repositories/province.repo');
const { compose, composeSmallTalk, composeCityFallback } = require('./composer.service');
const { supabase } = require('../../../config/supabase');

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';

// ==============================================================================
// 1. HELPERS & UTILITIES
// ==============================================================================

function wantLLM(opts) {
  if (opts && typeof opts.llm === 'boolean') return opts.llm;
  return USE_LLM;
}

function normalizeRows(rows, tag = '') {
  if (!Array.isArray(rows)) return [];
  return rows.filter(Boolean).map((x) => {
      if (typeof x === 'string') return { name: x, _raw: x, _tag: tag };
      if (!x || typeof x !== 'object') return null;
      const name = x.name || x.title || x.hotel_name || x.promotion_name || x.code || x.place || x.dish || x.city || x.id || null;
      return name ? { ...x, name } : null;
    }).filter(Boolean);
}

async function composeFromSQL(tag, params, rows, opts = {}) {
  const safeRows = normalizeRows(rows, tag);
  return await compose({
    sql: [{ name: tag, tag, params, rows: safeRows }],
    nlu: opts.nlu || null,
    filters: opts.context?.filters || {},
    user_ctx: opts.context || {},
  });
}

// ==============================================================================
// 2. SUPABASE RPC WRAPPERS (ĐẦY ĐỦ)
// ==============================================================================

async function getTopHotels(city, limit = 10, opts = undefined) {
  let { data, error } = await supabase.rpc('top_hotels_by_city', { p_city: city, p_limit: limit });
  if ((!data || data.length === 0) && /h[oồ]\s*ch[ií]\s*minh/i.test(city)) {
    const alt = await supabase.rpc('top_hotels_by_city', { p_city: 'TP Hồ Chí Minh', p_limit: limit });
    if (!alt.error && alt.data?.length) data = alt.data;
  }
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('top_hotels_by_city', { city, limit }, data, opts);
}

async function getHotelsByAmenities(city, amenities = [], limit = 10, opts = undefined) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_amenities', { p_city: city, p_amenities: amenities, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotels_by_city_with_amenities', { city, amenities, limit }, data, opts);
}

async function getPromotionsInMonth(year, month, limit = 20, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_in_month', { p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_in_month', { year, month, limit }, data, opts);
}

async function getPromotionsInMonthByCity(city, year, month, limit = 20, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_in_month_by_city', { p_city: city, p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_in_month_by_city', { city, year, month, limit }, data, opts);
}

async function getPromotionsByCity(city, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_by_city', { p_city: city });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_by_city', { city }, data, opts);
}

async function searchHotels(q = '', city = '', limit = 20, opts = undefined) {
  const { data, error } = await supabase.rpc('search_hotels', { p_city: city, p_q: q, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('search_hotels', { q, city, limit }, data, opts);
}

async function getHotelsByAnyAmenities(city, amenities = [], limit = 10, opts = undefined) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_any_amenities', { p_city: city, p_amenities: amenities, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotels_by_city_with_any_amenities', { city, amenities, limit }, data, opts);
}

async function getHotelFull(hotelId, opts = undefined) {
  const { data, error } = await supabase.rpc('hotel_full', { p_hotel_id: hotelId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('hotel_full', { hotelId }, row ? [row] : [], opts);
}

async function getPromotionsValidToday(limit = 50, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_valid_today', { p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_valid_today', { limit }, data, opts);
}

async function getPromotionsValidTodayByCity(city, limit = 50, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_valid_today_by_city', { p_city: city, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_valid_today_by_city', { city, limit }, data, opts);
}

async function getPromotionsByKeywordCityMonth(q = null, city = '', year, month, limit = 50, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_by_keyword_city_month', { p_city: city, p_kw: q, p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_by_keyword_city_month', { q, city, year, month, limit }, data, opts);
}

async function promoCheckApplicability(code, userId, bookingAmount, whenTs = null, opts = undefined) {
  const args = { p_code: code, p_user: userId, p_booking_amount: bookingAmount };
  if (whenTs) args.p_when = whenTs;
  const { data, error } = await supabase.rpc('promo_check_applicability', args);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('promo_check_applicability', { code, userId, bookingAmount, whenTs }, row ? [row] : [], opts);
}

async function promoUsageStats(promotionId, opts = undefined) {
  const { data, error } = await supabase.rpc('promo_usage_stats', { p_promotion_id: promotionId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('promo_usage_stats', { promotionId }, row ? [row] : [], opts);
}

async function listHotelCities(opts = undefined) {
  const { data, error } = await supabase.rpc('hotel_cities');
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotel_cities', {}, data, opts);
}

// ==============================================================================
// 3. CORE LOGIC: CONTEXT & SEARCH [FIXED]
// ==============================================================================

function resolveContextUsage(message, history) {
  const lastTurn = history && history.length > 0 ? history[0] : null;
  const lastEntity = lastTurn?.context_state?.last_entity_name;
  
  if (!lastEntity) return { shouldUseContext: false };

  const normMsg = normalize(message);
  
  // Các đại từ và từ khóa ám chỉ context cũ
  const contextTriggers = [
    'no', 'cho do', 'o day', 'o do', 'cho nay', 'dia diem nay', 'nay', // Đại từ
    've', 'gia', 'bao nhieu', 'o dau', 'an gi', 'review', 'co dep khong' // Từ hỏi thuộc tính
  ];
  
  const hasTrigger = contextTriggers.some(p => normMsg.includes(p));

  // Nếu câu có trigger và KHÔNG chứa tên entity cũ (tránh lặp lại) -> Dùng context
  if (hasTrigger && !normMsg.includes(normalize(lastEntity))) {
      return { shouldUseContext: true };
  }
  return { shouldUseContext: false };
}

/**
 * [FIXED] Hàm tìm kiếm Item trong DB thông minh hơn.
 * - Cho phép tìm gần đúng (fuzzy match) kể cả khi query mất dấu ngoặc.
 */
async function scanItemInDB(db, message) {
  if (!message || message.length < 2) return null;

  let cleanQuery = message.toLowerCase(); 
  
  // Danh sách từ khóa rác cần loại bỏ để lấy tên địa danh sạch
  const stopWords = [
    'cho tôi biết', 'tìm hiểu', 'giới thiệu', 'là gì', 'ở đâu', 'review', 'chi tiết', 
    'thông tin', 'giá', 'vé', 'bao nhiêu', 'ăn gì', 'chơi gì', 'có gì', 'món', 'quán',
    'địa điểm', 'địa danh', 'như thế nào', 'thế nào', 'ra sao', 'có', 'không', 'em', 'ơi',
    'chỗ này', 'buổi tối', 'mở cửa', 'lúc nào', 'khi nào'
  ];
  
  stopWords.forEach(w => {
    cleanQuery = cleanQuery.replace(new RegExp(`\\b${w}\\b`, 'gi'), ' ');
  });
  
  // [FIX] Chỉ giữ lại chữ cái và số, thay thế ký tự đặc biệt bằng khoảng trắng
  // Ví dụ: "Eo Gió (Bình Định)" -> "eo gió bình định"
  cleanQuery = cleanQuery.replace(/[?!.,;:"'()]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (cleanQuery.length < 2) {
    console.log('[scanItemInDB] Query ignored (too short):', cleanQuery);
    return null;
  }

  // [FIX] Tạo Regex "lỏng" (Permissive Regex)
  // Biến "eo gió bình định" thành /eo.*gió.*bình.*định/i
  const regexPattern = cleanQuery.split(' ').join('.*');
  console.log(`[scanItemInDB] 🔍 Searching Regex: /${regexPattern}/i`);

  try {
    const allCols = await db.listCollections().toArray();
    const targetCols = allCols.map(c => c.name).filter(n => !n.startsWith('system') && !n.startsWith('admin'));
    
    for (const colName of targetCols) {
        const found = await db.collection(colName).findOne({
             $or: [ 
                { 'places.name': { $regex: regexPattern, $options: 'i' } },
                { 'dishes.name': { $regex: regexPattern, $options: 'i' } } 
             ]
        });

        if (found) {
             const places = (found.places || []).map(x => ({...x, type: 'place'}));
             const dishes = (found.dishes || []).map(x => ({...x, type: 'dish'}));
             
             // Tìm item khớp nhất trong doc tìm được
             // [FIX] So sánh bằng cách normalize cả 2 bên để chắc chắn khớp
             const match = [...places, ...dishes].find(x => {
                const iName = x.name.toLowerCase().replace(/[()]/g, '');
                const qName = cleanQuery.replace(/[()]/g, '');
                return iName.includes(qName) || qName.includes(iName);
             });

             if (match) {
                 console.log(`[scanItemInDB] ✅ FOUND: "${match.name}" in ${colName}`);
                 return { doc: found, item: match, type: match.type };
             }
        }
    }
  } catch (e) { 
    console.warn('[scanItemInDB] Error:', e.message);
  }
  return null;
}

/**
 * LOGIC CHÍNH: HYBRID SUGGEST
 */
async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now();
  const history = Array.isArray(context.history) ? context.history : [];
  
  const lastTurn = history[0] || {};
  const lastEntityName = lastTurn.context_state?.last_entity_name || null;
  const lastCity = lastTurn.context_state?.last_city || null;

  // 1. Phân tích ngữ cảnh
  const { shouldUseContext } = resolveContextUsage(message, history);
  let nlu = analyze(message); 
  let targetCity = nlu.city || lastCity; 

  // 2. Chiến thuật tìm kiếm (Search Strategy)
  let dbMatch = null;

  if (shouldUseContext && lastEntityName) {
      console.log(`[suggestHybrid] 💡 Dùng context cũ: "${lastEntityName}"`);
      dbMatch = await scanItemInDB(db, lastEntityName); // Tìm lại item cũ
  } else {
      dbMatch = await scanItemInDB(db, message); // Tìm item mới từ câu hỏi
  }

  // Fallback: Nếu không tìm thấy mới + có context cũ + không phải câu chào -> Thử dùng lại context
  if (!dbMatch && lastEntityName && nlu.intent !== 'chitchat') {
      console.log(`[suggestHybrid] 💡 Fallback về context cũ: "${lastEntityName}"`);
      dbMatch = await scanItemInDB(db, lastEntityName);
  }

  // Chuẩn bị state cho turn sau
  let nextContext = {
    entity_name: dbMatch ? dbMatch.item.name : lastEntityName,
    entity_type: dbMatch ? dbMatch.type : (lastTurn.context_state?.last_entity_type || null),
    city: targetCity || (dbMatch ? dbMatch.doc.name : null)
  };

  // === CASE 1: TÌM THẤY ITEM CỤ THỂ -> KÍCH HOẠT "THINKING MODE" ===
  if (dbMatch) {
    const safeDoc = extractProvinceDoc(dbMatch.doc);
    nextContext.city = dbMatch.doc.name;

    console.log(`[suggestHybrid] => 🔥 Activating Thinking Mode for: ${dbMatch.item.name}`);

    const payload = await compose({
      doc: safeDoc,
      nlu: { ...nlu, intent: 'ask_details', city: safeDoc.name },
      filters: {},
      user_ctx: { 
        forcedItem: dbMatch.item, // Ép buộc Composer tập trung vào Item này
        forcedType: dbMatch.type,
        userMessage: message,     // Truyền câu hỏi gốc ("Vé bao nhiêu") cho AI trả lời
        ...context
      }
    });

    payload.latency_ms = Date.now() - started;
    payload.province = safeDoc.name;
    payload.next_context = nextContext;
    return payload; 
  }

  // === CASE 2: FALLBACKS (Chitchat, Weather, Generic Search) ===
  
  const nluCtx = { ...nlu, city: targetCity };

  // 2.1 Chitchat
  if (nluCtx.intent === 'chitchat' && !targetCity) {
    const payload = await composeSmallTalk({ message });
    payload.latency_ms = Date.now() - started;
    payload.next_context = nextContext; 
    return payload;
  }
  
  // 2.2 Weather
  if (nluCtx.intent === 'ask_weather') {
    const payload = await composeCityFallback({ city: targetCity, message });
    payload.latency_ms = Date.now() - started;
    payload.next_context = nextContext;
    return payload;
  }

  // 2.3 Generic Search (SQL + NoSQL)
  const nosqlTask = repo.findInText(db, { ...nluCtx, normalized: normalize(message) }).catch(() => null);
  const sqlTasks = [];
  const top_n = context.top_n || nlu.top_n || 10;
  
  const rawMsg = normalize(message);
  // Gọi SQL nếu có dấu hiệu tìm khách sạn/promo
  if (nluCtx.intent === 'hotels_top' || rawMsg.includes('khach san')) {
    sqlTasks.push(getTopHotels(targetCity, top_n, { llm: false }).catch(()=>[]));
  }
  if (nluCtx.intent === 'promotions_in_month' || rawMsg.includes('khuyen mai')) {
    sqlTasks.push(getPromotionsInMonth(new Date().getFullYear(), new Date().getMonth() + 1, top_n, { llm: false }).catch(()=>[]));
  }

  const [docFirst, ...sqlDatasets] = await Promise.all([nosqlTask, ...sqlTasks]);

  // Tìm lại doc địa phương nếu search text thất bại
  let docFallback = docFirst;
  if (!docFallback && targetCity) {
      docFallback = await repo.findByAlias(db, targetCity).catch(()=>null);
  }
  const safeDocFallback = extractProvinceDoc(docFallback);
  const cityFinal = safeDocFallback?.name || targetCity;
  
  if (cityFinal) nextContext.city = cityFinal;

  // Gọi Generic Compose
  const payload = await compose({
    doc: safeDocFallback,
    sql: sqlDatasets.map((rows) => ({ name: 'dataset', rows: normalizeRows(rows) })),
    nlu: nluCtx,
    filters: context.filters || {},
    user_ctx: { city: cityFinal, top_n, ...context }
  });

  payload.source = payload.source || 'sql+nosql+llm';
  payload.latency_ms = Date.now() - started;
  payload.province = safeDocFallback?.name || cityFinal || null;
  payload.next_context = nextContext;
  
  return payload;
}

// ==============================================================================
// 4. LEGACY HELPERS
// ==============================================================================
async function suggest(db, { message, context = {} }) {
  return suggestHybrid(db, { message, context });
}

function extractProvinceDoc(raw) {
  if (!raw) return null;
  try {
    const _toNameItems = arr => (Array.isArray(arr) ? arr : []).map(i => {
        if (!i) return null; 
        if (typeof i === 'string') return { name: i };
        if (typeof i === 'object' && i.name) return i; 
        return null; 
      }).filter(Boolean);

    return {
      name: raw.name || raw.province || 'unknown',
      places: _toNameItems(raw.places || raw.pois),
      dishes: _toNameItems(raw.dishes || raw.foods),
      tips: (Array.isArray(raw.tips) ? raw.tips : []).filter(Boolean),
      merged_from: raw.merged_from || []
    };
  } catch (err) {
    return { name: raw?.name || 'unknown', places: [], dishes: [], tips: [] };
  }
}

module.exports = {
  suggestHybrid, suggest,
  searchHotels, getHotelsByAnyAmenities, getHotelFull, getPromotionsValidToday, 
  getPromotionsValidTodayByCity, getPromotionsByKeywordCityMonth, 
  promoCheckApplicability, promoUsageStats, listHotelCities, 
  getTopHotels, getHotelsByAmenities, getPromotionsInMonth, 
  getPromotionsInMonthByCity, getPromotionsByCity,
};