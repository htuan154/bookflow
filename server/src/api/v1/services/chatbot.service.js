'use strict';

/**
 * Chatbot Service v7.3 [FINAL FIXED]
 * * Fix lỗi NLU: Thêm lớp bảo vệ keyword (Lower Message Check)
 */

const { analyze, normalize } = require('./nlu.service');
const { compose, composeSmallTalk, composeCityFallback } = require('./composer.service');
const { supabase } = require('../../../config/supabase');
const { searchVector } = require('./vector.service'); 

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';

const THRESHOLD = {
    BASE_MATCH: 0.65,      
    CONTEXT_PENALTY: 0.15, 
    GLOBAL_ACCEPT: 0.22 
};

// ==============================================================================
// 1. SEARCH ENGINE
// ==============================================================================
async function findBestMatch(db, query, provinceFilter = null) {
    if (!query || query.length < 2) return null;

    // A. Vector Search
    let vectors = [];
    if (provinceFilter) vectors = await searchVector(query, 0.20, 3, provinceFilter);
    if (!vectors || vectors.length === 0) vectors = await searchVector(query, 0.20, 3, null);
    
    const bestVector = vectors && vectors.length > 0 ? vectors[0] : null;

    // B. Regex Search
    let regexMatch = null;
    try {
        const regexPattern = query.toLowerCase().split(' ').join('.*');
        const allCols = await db.listCollections().toArray();
        const targetCols = allCols.map(c => c.name).filter(n => !['system', 'admin', 'chat_history'].some(x => n.startsWith(x)));

        for (const colName of targetCols) {
            const found = await db.collection(colName).findOne({
                 $or: [ 
                    { 'places.name': { $regex: regexPattern, $options: 'i' } },
                    { 'dishes.name': { $regex: regexPattern, $options: 'i' } } 
                 ]
            });
            if (found) {
                 const items = [...(found.places||[]).map(x=>({...x, type:'place'})), ...(found.dishes||[]).map(x=>({...x, type:'dish'}))];
                 const matchItem = items.find(x => x.name.toLowerCase().includes(query.toLowerCase()));
                 if (matchItem) {
                     regexMatch = { 
                         doc: found, item: matchItem, type: matchItem.type, score: 1.0, source: 'regex' 
                     };
                     break; 
                 }
            }
        }
    } catch (e) { console.warn('[Search] Regex Error:', e.message); }

    if (regexMatch) return regexMatch; 
    if (bestVector && bestVector.similarity > THRESHOLD.GLOBAL_ACCEPT) {
         return {
            doc: { name: bestVector.metadata.province || 'Vietnam' },
            item: { name: bestVector.metadata.name, description: bestVector.content, type: bestVector.metadata.type },
            type: bestVector.metadata.type,
            score: bestVector.similarity,
            source: 'vector'
         };
    }
    return null;
}

// ==============================================================================
// 2. CORE LOGIC
// ==============================================================================

async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now();
  const history = Array.isArray(context.history) ? context.history : [];
  
  // 1. Phục hồi Context
  let lastCity = null;
  for (const turn of history) {
      if (turn.context_state?.last_city) { lastCity = turn.context_state.last_city; break; }
      if (turn.nlu?.city) { lastCity = turn.nlu.city; break; }
  }
  const lastEntityName = history[0]?.context_state?.last_entity_name || null;
  const lastEntityType = history[0]?.context_state?.last_entity_type || 'place';

  // 2. NLU & Phân tích cơ bản
  let nlu = analyze(message);
  let currentCity = nlu.city || lastCity; 
  console.log(`\n💬 Query: "${message}" | Intent: ${nlu.intent} | City: ${currentCity}`);

  // --------------------------------------------------------------------------
  // [BẢO VỆ] KIỂM TRA TỪ KHÓA TRỰC TIẾP (FIX LỖI THẮNG CỐ)
  // --------------------------------------------------------------------------
  const lowerMsg = message.toLowerCase();
  
  // CASE 1: KHUYẾN MÃI (Ưu tiên cao nhất)
  if (
      ['ask_promotions', 'check_promo'].includes(nlu.intent) ||
      lowerMsg.includes('khuyến mãi') || 
      lowerMsg.includes('voucher') || 
      lowerMsg.includes('giảm giá') ||
      lowerMsg.includes('ưu đãi')
  ) {
      console.log('👉 Routing to SQL: Promotions');
      // Ép NLU thành ask_promotions để các hàm sau hiểu
      nlu.intent = 'ask_promotions';
      return await getPromotionsValidToday(10, { llm: true, context: { ...context, nlu } });
  }

  // CASE 2: KHÁCH SẠN
  if (
      ['ask_hotels', 'find_hotel'].includes(nlu.intent) || 
      lowerMsg.includes('khách sạn') ||
      lowerMsg.includes('hotel')
  ) {
      console.log('👉 Routing to SQL: Hotels');
      nlu.intent = 'ask_hotels';
      const limit = context.top_n || 5;
      
      if (lowerMsg.includes('tìm') && message.length > 15) {
          const keyword = message.replace(/khách sạn|tại|ở|tìm/gi, '').trim();
          return await searchHotels(keyword, currentCity, limit, { llm: true, context: { ...context, nlu } });
      }
      return await getTopHotels(currentCity || 'Hồ Chí Minh', limit, { llm: true, context: { ...context, nlu } });
  }

  // --------------------------------------------------------------------------
  // 3. XỬ LÝ VECTOR / CONTEXT
  // --------------------------------------------------------------------------

  const match = await findBestMatch(db, message, currentCity);
  const matchScore = match ? match.score : 0;
  
  let finalTarget = null;
  let decisionReason = "";
  let currentStrongThreshold = THRESHOLD.BASE_MATCH; 
  if (lastEntityName) currentStrongThreshold += THRESHOLD.CONTEXT_PENALTY;

  if (match && matchScore >= currentStrongThreshold) {
      finalTarget = match;
      decisionReason = `🔥 NEW TOPIC (Score: ${matchScore.toFixed(2)})`;
      if (match.doc.name && match.doc.name !== 'Vietnam') currentCity = match.doc.name; 
  } else if (lastEntityName) {
      console.log(`🔄 Score (${matchScore.toFixed(2)}) < Threshold. Staying in Context: "${lastEntityName}"`);
      finalTarget = await findBestMatch(db, lastEntityName, currentCity);
      decisionReason = "💡 CONTEXT FOLLOW-UP";
  } else if (match && matchScore >= THRESHOLD.GLOBAL_ACCEPT) {
      finalTarget = match;
      decisionReason = `✅ WEAK MATCH ACCEPTED`;
  }

  // 4. Composition
  let nextContext = {
      entity_name: finalTarget ? finalTarget.item.name : lastEntityName,
      entity_type: finalTarget ? finalTarget.type : lastEntityType,
      city: currentCity,
      last_city: currentCity
  };

  if (finalTarget) {
    console.log(`👉 [Decision]: ${decisionReason} => Answer about: ${finalTarget.item.name}`);
    const safeDoc = extractProvinceDoc(finalTarget.doc);
    const payload = await compose({
      doc: safeDoc,
      nlu: { ...nlu, intent: 'ask_details', city: safeDoc?.name },
      filters: {},
      user_ctx: { forcedItem: finalTarget.item, forcedType: finalTarget.type, userMessage: message, ...context }
    });
    payload.latency_ms = Date.now() - started;
    payload.province = safeDoc?.name;
    payload.next_context = nextContext;
    return payload;
  }

  console.log(`❌ No match. Fallback.`);
  if (nlu.intent === 'chitchat' || message.length < 4) {
      const payload = await composeSmallTalk({ message });
      payload.next_context = nextContext;
      return payload;
  }
  const payload = await composeCityFallback({ city: currentCity, message });
  payload.latency_ms = Date.now() - started;
  payload.next_context = nextContext;
  return payload;
}

// Helpers & Wrappers
function wantLLM(opts) {
  if (opts && typeof opts.llm === 'boolean') return opts.llm;
  return USE_LLM;
}
function normalizeRows(rows, tag = '') {
  if (!Array.isArray(rows)) return [];
  return rows.filter(Boolean).map((x) => {
      if (typeof x === 'string') return { name: x, _raw: x, _tag: tag };
      if (!x || typeof x !== 'object') return null;
      const name = x.name || x.title || x.hotel_name || x.promotion_name || x.code || null;
      return name ? { ...x, name } : null;
  }).filter(Boolean);
}
async function composeFromSQL(tag, params, rows, opts = {}) {
  const safeRows = normalizeRows(rows, tag);
  return await compose({
    sql: [{ name: tag, tag, params, rows: safeRows }],
    nlu: opts.context?.nlu || null,
    filters: opts.context?.filters || {},
    user_ctx: opts.context || {},
  });
}
function extractProvinceDoc(raw) {
  if (!raw) return null;
  try {
    const _toNameItems = arr => (Array.isArray(arr) ? arr : []).map(i => (i ? (typeof i === 'string' ? {name:i} : i) : null)).filter(Boolean);
    return {
      name: raw.name || raw.province || 'unknown',
      places: _toNameItems(raw.places || raw.pois),
      dishes: _toNameItems(raw.dishes || raw.foods),
      tips: (Array.isArray(raw.tips) ? raw.tips : []).filter(Boolean),
      merged_from: raw.merged_from || []
    };
  } catch (err) { return { name: raw?.name || 'unknown', places: [], dishes: [], tips: [] }; }
}
async function suggest(db, opts) { return suggestHybrid(db, opts); }

// --- SQL FUNCTIONS EXPORT ---
async function getTopHotels(city, limit = 10, opts = undefined) {
  const { data, error } = await supabase.rpc('top_hotels_by_city', { p_city: city, p_limit: limit });
  if (error) { console.error('SQL Error:', error); return { summary: 'Lỗi truy vấn SQL.' }; }
  if (!wantLLM(opts)) return data;
  return composeFromSQL('top_hotels_by_city', { city, limit }, data, opts);
}
async function getPromotionsValidToday(limit = 50, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_valid_today', { p_limit: limit });
  if (error) { console.error('SQL Error:', error); return { summary: 'Lỗi truy vấn SQL.' }; }
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_valid_today', { limit }, data, opts);
}
async function searchHotels(q = '', city = '', limit = 20, opts = undefined) {
  const { data, error } = await supabase.rpc('search_hotels', { p_city: city, p_q: q, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('search_hotels', { q, city, limit }, data, opts);
}

// Exports
async function getHotelsByAnyAmenities(city, amenities, limit, opts) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_any_amenities', { p_city: city, p_amenities: amenities, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotels_by_city_with_any_amenities', { city, amenities, limit }, data, opts);
}
async function getHotelFull(hotelId, opts) {
  const { data, error } = await supabase.rpc('hotel_full', { p_hotel_id: hotelId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('hotel_full', { hotelId }, row ? [row] : [], opts);
}
async function getPromotionsValidTodayByCity(city, limit, opts) {
  const { data, error } = await supabase.rpc('promotions_valid_today_by_city', { p_city: city, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_valid_today_by_city', { city, limit }, data, opts);
}
async function getPromotionsByKeywordCityMonth(q, city, year, month, limit, opts) {
  const { data, error } = await supabase.rpc('promotions_by_keyword_city_month', { p_city: city, p_kw: q, p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_by_keyword_city_month', { q, city, year, month, limit }, data, opts);
}
async function promoCheckApplicability(code, userId, bookingAmount, whenTs, opts) {
  const args = { p_code: code, p_user: userId, p_booking_amount: bookingAmount };
  if (whenTs) args.p_when = whenTs;
  const { data, error } = await supabase.rpc('promo_check_applicability', args);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('promo_check_applicability', { code, userId, bookingAmount, whenTs }, row ? [row] : [], opts);
}
async function promoUsageStats(promotionId, opts) {
  const { data, error } = await supabase.rpc('promo_usage_stats', { p_promotion_id: promotionId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('promo_usage_stats', { promotionId }, row ? [row] : [], opts);
}
async function listHotelCities(opts) {
  const { data, error } = await supabase.rpc('hotel_cities');
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotel_cities', {}, data, opts);
}
async function getHotelsByAmenities(city, amenities, limit, opts) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_amenities', { p_city: city, p_amenities: amenities, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotels_by_city_with_amenities', { city, amenities, limit }, data, opts);
}
async function getPromotionsInMonth(year, month, limit, opts) {
  const { data, error } = await supabase.rpc('promotions_in_month', { p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_in_month', { year, month, limit }, data, opts);
}
async function getPromotionsInMonthByCity(city, year, month, limit, opts) {
  const { data, error } = await supabase.rpc('promotions_in_month_by_city', { p_city: city, p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_in_month_by_city', { city, year, month, limit }, data, opts);
}
async function getPromotionsByCity(city, opts) {
  const { data, error } = await supabase.rpc('promotions_by_city', { p_city: city });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_by_city', { city }, data, opts);
}

module.exports = {
  suggestHybrid, suggest, searchVector,
  getTopHotels, searchHotels, getPromotionsValidToday,
  getHotelsByAnyAmenities, getHotelFull, getPromotionsValidTodayByCity,
  getPromotionsByKeywordCityMonth, promoCheckApplicability, promoUsageStats,
  listHotelCities, getHotelsByAmenities, getPromotionsInMonth,
  getPromotionsInMonthByCity, getPromotionsByCity
};