'use strict';

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
// 1. AI RERANKING & STRICT FILTERING
// ==============================================================================
async function rerankWithLLM(query, candidates, currentCity) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return null;
    
    const validCandidates = candidates.filter(c => c && c.item && c.item.name);
    if (validCandidates.length === 0) return null;

    // 🔥 STRICT MODE: Ưu tiên item cùng thành phố, NHƯNG nới lỏng nếu query chứa tên địa danh cụ thể
    // Nếu query chứa tên riêng (VD: "Hầm điêu khắc"), ta tạm bỏ qua filter city để tìm cho ra.
    let strictCandidates = validCandidates;
    const hasProperNoun = query.length > 10 && query[0] === query[0].toUpperCase(); // Logic đơn giản check tên riêng

    if (currentCity && !hasProperNoun) {
        const cityMatches = validCandidates.filter(c => {
             const prov = (c.item.province || '').toLowerCase();
             const city = currentCity.toLowerCase();
             return prov.includes(city) || city.includes(prov);
        });
        if (cityMatches.length > 0) strictCandidates = cityMatches;
    }

    if (strictCandidates.length === 1) return strictCandidates[0];

    const candidateList = strictCandidates.map((c, i) => 
        `[${i}] ${c.item.name} (${c.item.province || 'Unknown'}) - Snippet: ${(c.item.doc || '').substring(0, 100)}...`
    ).join('\n');

    const prompt = `
    Query: "${query}"
    Target City: "${currentCity || 'Any'}"
    Candidates:
    ${candidateList}
    
    TASK: Pick the best match index (0-${strictCandidates.length-1}).
    If nothing matches sensibly, return -1.
    JSON Output: {"index": 0}
    `;

    try {
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                format: "json",
                options: { temperature: 0.0 } 
            })
        });
        const data = await res.json();
        const json = JSON.parse(data.response);
        const idx = json.index;
        
        if (idx === undefined || idx < 0 || idx >= strictCandidates.length) return strictCandidates[0]; 
        return strictCandidates[idx];
    } catch (e) { return strictCandidates[0]; }
}

// ==============================================================================
// 2. SEARCH ENGINE
// ==============================================================================
async function findBestMatch(db, searchTerm, currentCity = null) {
    if (!searchTerm || searchTerm.length < 2) return null;
    
    // Nếu có city, ưu tiên ghép vào query
    let vectorQuery = searchTerm;
    if (currentCity && !searchTerm.toLowerCase().includes(currentCity.toLowerCase())) {
        vectorQuery = `${searchTerm} ${currentCity}`;
    }

    console.log(`🔍 Vector Searching: "${vectorQuery}"`);
    let vectors = await searchVector(vectorQuery, 0.12, 15, null); 
    
    return await rerankWithLLM(searchTerm, vectors, currentCity);
}

// ==============================================================================
// 3. MAIN LOGIC
// ==============================================================================
async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now();
  
  // A. Context Recovery
  const history = Array.isArray(context.history) ? context.history : [];
  let lastCity = null;
  let lastEntityName = null;
  for (const turn of history) {
      if (!lastCity) lastCity = turn.context_state?.city || turn.context_state?.last_city;
      if (!lastEntityName) lastEntityName = turn.context_state?.last_entity_name;
  }

  // B. NLU Analysis
  let nlu = await analyzeAsync(message, { last_city: lastCity, last_entity: lastEntityName });
  let currentCity = nlu.city || lastCity ; 
  
  // 🔥 AUTO-FIX QUERY: Nếu câu hỏi quá ngắn ("giá bao nhiêu", "ở đâu"), ghép Entity cũ vào
  let searchPayload = nlu.search_term; 
  if (lastEntityName && searchPayload.length < 15 && !searchPayload.includes(lastEntityName)) {
      console.log(`💡 Query Expansion: Appending context entity "${lastEntityName}"`);
      searchPayload = `${searchPayload} ${lastEntityName}`;
  }

  console.log(`\n✨ Intent: ${nlu.intent} | City: ${currentCity} | Search: "${searchPayload}"`);

  // Context base
  let nextContextBase = {
      city: currentCity,      
      last_city: currentCity, 
      last_entity_name: lastEntityName 
  };

  // --- FLOW 1: WEATHER ---
  if (nlu.intent === 'ask_weather') {
      const weatherData = await getCurrentWeather(currentCity);
      return { ...weatherData, latency_ms: Date.now() - started, next_context: nextContextBase, nlu };
  }

  // --- FLOW 2: HOTELS ---
  if (nlu.intent === 'ask_hotels') {
      if (nlu.amenities && nlu.amenities.length > 0) {
          return await getHotelsByAmenities(currentCity, nlu.amenities, 5, { 
              llm: true, context: { ...context, nlu }, next_context: nextContextBase 
          });
      }
      return await getTopHotels(currentCity, 5, { 
          llm: true, context: { ...context, nlu }, next_context: nextContextBase 
      });
  }

  // --- FLOW 3: PROMOTIONS ---
  if (nlu.intent === 'ask_promotions') {
      if (nlu.time_ref === 'today' || message.toLowerCase().includes('hôm nay')) {
           return await getPromotionsValidTodayByCity(currentCity, 10, {
               llm: true, context: { ...context, nlu }, next_context: nextContextBase
           });
      }
      const monthMatch = message.match(/tháng (\d+)/i);
      const month = monthMatch ? parseInt(monthMatch[1]) : (new Date().getMonth() + 1);
      const year = new Date().getFullYear();
      return await getPromotionsByKeywordCityMonth(null, currentCity, year, month, 10, {
          llm: true, context: { ...context, nlu }, next_context: nextContextBase
      });
  }

  // --- FLOW 4: VECTOR SEARCH ---
  let match = null;
  if (nlu.intent !== 'chitchat' && nlu.intent !== 'other') {
      match = await findBestMatch(db, searchPayload, currentCity);
  }
  
  // Fallback Context Search
  if (!match && lastEntityName && ['ask_details', 'ask_places'].includes(nlu.intent)) {
      console.log(`↩️ Fallback: Re-checking context "${lastEntityName}"`);
      match = await findBestMatch(db, lastEntityName, currentCity);
  }

  if (match && match.score >= 0.12) { 
      console.log(`🚀 Match Found: ${match.item.name} (${match.score.toFixed(2)})`);
      const safeDoc = extractProvinceDoc(match.doc);
      
      // 🔥 CRITICAL FIX: Cập nhật City theo địa điểm mới tìm thấy
      // Nếu địa điểm tìm thấy có tên tỉnh (VD: Lâm Đồng), update Context ngay lập tức
      const foundProvince = match.item.province; 
      if (foundProvince && foundProvince.length > 2) {
           console.log(`🌍 Auto-updating City Context: ${currentCity} -> ${foundProvince}`);
           currentCity = foundProvince;
           nextContextBase.city = foundProvince;
           nextContextBase.last_city = foundProvince;
      }

      const payload = await compose({
        doc: safeDoc, 
        nlu: { ...nlu, intent: 'ask_details', city: currentCity }, 
        user_ctx: { forcedItem: match.item, userMessage: nlu.rewritten, ...context }
      });
      
      payload.latency_ms = Date.now() - started;
      payload.next_context = { 
          ...nextContextBase,
          last_entity_name: match.item.name 
      };
      return payload;
  }

  // --- FLOW 5: CHITCHAT / FALLBACK ---
  if (nlu.intent === 'chitchat') {
      const payload = await composeSmallTalk({ message }); 
      payload.latency_ms = Date.now() - started;
      payload.next_context = nextContextBase;
      return payload;
  }

  console.log('❌ No match found. City Fallback.');
  const payload = await composeCityFallback({ city: currentCity, message: nlu.rewritten });
  payload.latency_ms = Date.now() - started;
  payload.next_context = nextContextBase;
  return payload;
}

// ... (Giữ nguyên phần Helper & SQL Wrappers như cũ) ...
// (Phần này bạn không cần copy lại nếu đã có, hoặc copy từ file cũ vào)
// Đảm bảo có các hàm: getTopHotels, searchVector, compose... ở cuối file
// ==============================================================================
// 4. HELPERS & SQL EXPORTS 
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

// --- SQL FUNCTION WRAPPERS ---

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