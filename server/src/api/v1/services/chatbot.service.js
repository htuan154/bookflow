'use strict';

/**
 * Chatbot Service v18.1 [FIX CRASH METADATA]
 * - Sửa lỗi Crash: Thay c.metadata.province -> c.item.province
 * - Thêm Optional Chaining (?.) để code an toàn tuyệt đối.
 */

const { analyzeAsync } = require('./nlu.service'); 
const { getCurrentWeather } = require('./weather.service');
const { compose, composeSmallTalk, composeCityFallback } = require('./composer.service');
const { supabase } = require('../../../config/supabase');
const { searchVector } = require('./vector.service'); 
const { fetch } = require('undici'); 

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

// ==============================================================================
// 1. AI RERANKING (FIXED)
// ==============================================================================

async function rerankWithLLM(query, candidates, currentCity) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return null;
    
    // Lọc candidate hợp lệ
    const validCandidates = candidates.filter(c => c && c.item && c.item.name);
    
    if (validCandidates.length === 0) return null;
    
    // Nếu chỉ có 1 kết quả tốt -> Lấy luôn
    if (validCandidates.length === 1 && validCandidates[0].score > 0.12) return validCandidates[0];

    // 🔥 FIX CRASH: Dùng c.item.province thay vì c.metadata.province
    const candidateList = validCandidates.map((c, i) => 
        `${i}. ${c.item?.name} (${c.item?.province || 'N/A'}) - Score: ${c.score?.toFixed(2)}`
    ).join('\n');

    const prompt = `
    Câu hỏi: "${query}" (Ngữ cảnh: "${currentCity || 'Không rõ'}")
    Danh sách ứng viên:
    ${candidateList}
    
    Yêu cầu: Chọn index (0..n) của mục phù hợp nhất. 
    Nếu không có mục nào liên quan, trả về -1. 
    Output: Chỉ trả về con số.
    `;

    try {
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: { temperature: 0.0 } 
            })
        });
        const data = await res.json();
        const idx = parseInt(data.response.match(/-?\d+/)?.[0] || '0');
        
        if (idx === -1) return validCandidates[0]; 
        return validCandidates[idx] || validCandidates[0];
    } catch (e) {
        return validCandidates[0];
    }
}

// ==============================================================================
// 2. SEARCH ENGINE
// ==============================================================================

async function findBestMatch(db, query, currentCity = null) {
    if (!query || query.length < 2) return null;
    
    let enhancedQuery = query;
    if (currentCity && !query.toLowerCase().includes(currentCity.toLowerCase())) {
        enhancedQuery = `${query} tại ${currentCity}`;
    }

    // Threshold 0.12 để bắt được nhiều kết quả hơn
    let vectors = await searchVector(enhancedQuery, 0.12, 10, null); 
    
    // Log an toàn (dùng ?.)
    if (vectors && vectors.length > 0) {
        console.log(`🔍 Raw Vectors: ${vectors.map(v => `${v?.item?.name || 'Unknown'}(${v?.score?.toFixed(2) || 0})`).join(', ')}`);
    } else {
        console.log(`🔍 Raw Vectors: NONE for query "${enhancedQuery}"`);
    }

    return await rerankWithLLM(query, vectors, currentCity);
}

// ==============================================================================
// 3. MAIN SUGGEST HYBRID
// ==============================================================================

async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now();
  
  // A. Context Recovery
  const history = Array.isArray(context.history) ? context.history : [];
  let lastCity = null;
  let lastEntityName = null;

  for (const turn of history) {
      if (!lastCity && turn.context_state?.city) lastCity = turn.context_state.city;
      if (!lastCity && turn.context_state?.last_city) lastCity = turn.context_state.last_city;
      if (!lastEntityName && turn.context_state?.entity_name) lastEntityName = turn.context_state.entity_name;
  }

  // B. NLU
  let nlu = await analyzeAsync(message);
  let currentCity = nlu.city || lastCity; 

  console.log(`\n💬 Query: "${message}" | Intent: ${nlu.intent} | City: ${currentCity} | LastEntity: ${lastEntityName}`);

  const nextContextBase = {
      city: currentCity,      
      last_city: currentCity, 
      entity_name: lastEntityName
  };

  // Flow: Weather
  if (nlu.intent === 'ask_weather') {
      const targetCity = currentCity || 'Hồ Chí Minh';
      const weatherData = await getCurrentWeather(targetCity);
      return { 
          ...weatherData, 
          latency_ms: Date.now() - started, 
          next_context: { ...nextContextBase, city: targetCity } 
      };
  }

  // Flow: Distance
  if (nlu.intent === 'ask_distance') {
      const dest = lastEntityName || 'địa điểm này';
      return { 
          summary: `Hiện chưa tính được khoảng cách tới ${dest}. Bạn tra Google Maps nhé!`, 
          source: 'system-maintenance', 
          next_context: nextContextBase 
      };
  }

  // Flow: Search
  const match = await findBestMatch(db, message, currentCity);
  const isInfoIntent = ['ask_details', 'ask_dishes', 'ask_places'].includes(nlu.intent);
  
  // Case: Hỏi chi tiết nhưng không có ngữ cảnh
  if (isInfoIntent && !match && !lastEntityName) {
      return { 
          summary: `Xin lỗi, mình chưa hiểu bạn muốn hỏi địa điểm nào tại ${currentCity || 'đây'}. Bạn có thể nhắc lại tên địa điểm được không?`, 
          source: 'missing-context-fallback', 
          next_context: nextContextBase 
      };
  }

  // Case: Sticky Context (Hỏi nối tiếp)
  if (lastEntityName && isInfoIntent) {
      const isStrongNewTopic = match && match.score > 0.8 && match.item.name !== lastEntityName;
      if (!isStrongNewTopic) {
          console.log(`↩️ Context Inference: Keeping focus on "${lastEntityName}"`);
          const contextMatch = await findBestMatch(db, lastEntityName, currentCity);
          
          if (contextMatch) {
               const safeDoc = extractProvinceDoc(contextMatch.doc);
               const payload = await compose({
                    doc: safeDoc, 
                    nlu: { ...nlu, intent: 'ask_details', city: safeDoc?.name },
                    user_ctx: { 
                        forcedItem: contextMatch.item, 
                        isFollowUp: true, 
                        userMessage: message, 
                        ...context 
                    }
               });
               payload.next_context = { ...nextContextBase, entity_name: lastEntityName };
               payload.latency_ms = Date.now() - started;
               return payload;
          }
      }
  }

  // Case: New Topic Found
  if (match && match.score >= 0.12) { 
      console.log(`🚀 Vector Match: ${match.item.name} (${match.score.toFixed(2)})`);
      const safeDoc = extractProvinceDoc(match.doc);
      
      const payload = await compose({
        doc: safeDoc, 
        nlu: { ...nlu, intent: 'ask_details', city: safeDoc?.name }, 
        user_ctx: { forcedItem: match.item, userMessage: message, ...context }
      });
      
      payload.latency_ms = Date.now() - started;
      payload.next_context = { 
          city: currentCity || safeDoc?.name,
          last_city: currentCity || safeDoc?.name,
          entity_name: match.item.name 
      };
      return payload;
  }

  // Flow: Fallback / Chitchat
  if (nlu.intent === 'chitchat') {
      const payload = await composeSmallTalk({ message });
      payload.latency_ms = Date.now() - started;
      payload.next_context = nextContextBase;
      return payload;
  }

  if (nlu.intent === 'ask_promotions') return await getPromotionsValidToday(10, { llm: true, context: { ...context, nlu }, next_context: nextContextBase });
  if (nlu.intent === 'ask_hotels') return await getTopHotels(currentCity || 'Hồ Chí Minh', 5, { llm: true, context: { ...context, nlu }, next_context: nextContextBase });

  console.log('❌ No match found. City Fallback.');
  const payload = await composeCityFallback({ city: currentCity, message });
  payload.latency_ms = Date.now() - started;
  payload.next_context = nextContextBase;
  return payload;
}

// ==============================================================================
// 4. HELPERS & EXPORTS
// ==============================================================================

function wantLLM(opts) { if (opts && typeof opts.llm === 'boolean') return opts.llm; return USE_LLM; }
function normalizeRows(rows, tag = '') { return (Array.isArray(rows) ? rows : []).filter(Boolean).map(x => (typeof x === 'string' ? {name:x,_raw:x} : (x && x.name ? {...x} : null))).filter(Boolean); }
async function composeFromSQL(tag, params, rows, opts = {}) { const safeRows = normalizeRows(rows); const payload = await compose({ sql: [{ name: tag, tag, params, rows: safeRows }], nlu: opts.context?.nlu || null, filters: opts.context?.filters || {}, user_ctx: opts.context || {} }); if (opts.next_context) payload.next_context = opts.next_context; return payload;}
function extractProvinceDoc(raw) {
  if (!raw) return null;
  try { return { name: raw.name || raw.province || 'unknown', places: raw.places || [], dishes: raw.dishes || [] }; } 
  catch (err) { return { name: raw?.name || 'unknown' }; }
}
async function suggest(db, opts) { return suggestHybrid(db, opts); }

// --- REAL SQL IMPLEMENTATIONS ---

async function getTopHotels(city, limit = 10, opts = undefined) {
    const { data } = await supabase.rpc('top_hotels_by_city', { p_city: city, p_limit: limit });
    if (!wantLLM(opts)) return { data }; 
    return await composeFromSQL('top_hotels_by_city', { city, limit }, data, opts);
}
async function getPromotionsValidToday(limit = 50, opts = undefined) {
    const { data } = await supabase.rpc('promotions_valid_today', { p_limit: limit });
    if (!wantLLM(opts)) return { data };
    return await composeFromSQL('promotions_valid_today', { limit }, data, opts);
}
async function searchHotels(q = '', city = '', limit = 20, opts = undefined) {
    const { data } = await supabase.rpc('search_hotels', { p_city: city, p_q: q, p_limit: limit });
    if (!wantLLM(opts)) return { data };
    return await composeFromSQL('search_hotels', { q, city, limit }, data, opts);
}
async function getHotelsByAnyAmenities(city, amenities, limit, opts) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_any_amenities', { p_city: city, p_amenities: amenities, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return { data };
  return composeFromSQL('hotels_by_city_with_any_amenities', { city, amenities, limit }, data, opts);
}
async function getHotelFull(hotelId, opts) {
  const { data, error } = await supabase.rpc('hotel_full', { p_hotel_id: hotelId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return { data: row };
  return composeFromSQL('hotel_full', { hotelId }, row ? [row] : [], opts);
}
async function getPromotionsValidTodayByCity(city, limit, opts) {
  const { data, error } = await supabase.rpc('promotions_valid_today_by_city', { p_city: city, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return { data };
  return composeFromSQL('promotions_valid_today_by_city', { city, limit }, data, opts);
}
async function getPromotionsByKeywordCityMonth(q, city, year, month, limit, opts) {
  const { data, error } = await supabase.rpc('promotions_by_keyword_city_month', { p_city: city, p_kw: q, p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return { data };
  return composeFromSQL('promotions_by_keyword_city_month', { q, city, year, month, limit }, data, opts);
}
async function promoCheckApplicability(code, userId, bookingAmount, whenTs, opts) {
  const args = { p_code: code, p_user: userId, p_booking_amount: bookingAmount };
  if (whenTs) args.p_when = whenTs;
  const { data, error } = await supabase.rpc('promo_check_applicability', args);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return { data: row };
  return composeFromSQL('promo_check_applicability', { code, userId, bookingAmount, whenTs }, row ? [row] : [], opts);
}
async function promoUsageStats(promotionId, opts) {
  const { data, error } = await supabase.rpc('promo_usage_stats', { p_promotion_id: promotionId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return { data: row };
  return composeFromSQL('promo_usage_stats', { promotionId }, row ? [row] : [], opts);
}
async function listHotelCities(opts) {
  const { data, error } = await supabase.rpc('hotel_cities');
  if (error) throw error;
  if (!wantLLM(opts)) return { data };
  return composeFromSQL('hotel_cities', {}, data, opts);
}
async function getHotelsByAmenities(city, amenities, limit, opts) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_amenities', { p_city: city, p_amenities: amenities, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return { data };
  return composeFromSQL('hotels_by_city_with_amenities', { city, amenities, limit }, data, opts);
}
async function getPromotionsInMonth(year, month, limit, opts) {
  const { data, error } = await supabase.rpc('promotions_in_month', { p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return { data };
  return composeFromSQL('promotions_in_month', { year, month, limit }, data, opts);
}
async function getPromotionsInMonthByCity(city, year, month, limit, opts) {
  const { data, error } = await supabase.rpc('promotions_in_month_by_city', { p_city: city, p_year: year, p_month: month, p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return { data };
  return composeFromSQL('promotions_in_month_by_city', { city, year, month, limit }, data, opts);
}
async function getPromotionsByCity(city, opts) {
  const { data, error } = await supabase.rpc('promotions_by_city', { p_city: city });
  if (error) throw error;
  if (!wantLLM(opts)) return { data };
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