'use strict';

/**
 * Chatbot Service v19.0 [PURE AI REFACTOR]
 * - Tích hợp NLU Rewriting: Search bằng "rewritten query" thay vì raw text.
 * - Logic điều hướng dựa hoàn toàn vào Intent của AI.
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
// 1. AI RERANKING (Logic lọc kết quả Search)
// ==============================================================================

async function rerankWithLLM(query, candidates, currentCity) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return null;
    const validCandidates = candidates.filter(c => c && c.item && c.item.name);
    
    if (validCandidates.length === 0) return null;
    if (validCandidates.length === 1 && validCandidates[0].score > 0.12) return validCandidates[0];

    // Tạo danh sách cho AI chọn
    const candidateList = validCandidates.map((c, i) => 
        `${i}. ${c.item?.name} (${c.item?.province || 'N/A'}) - Score: ${c.score?.toFixed(2)}`
    ).join('\n');

    const prompt = `
    User Query (Đã sửa lỗi): "${query}"
    Khu vực đang tìm: "${currentCity || 'Toàn quốc'}"
    
    Danh sách ứng viên từ Database:
    ${candidateList}
    
    Yêu cầu: Chọn index (0..n) của mục phù hợp nhất với ý định của user.
    Nếu không có mục nào liên quan, trả về -1. 
    Output: Chỉ trả về con số (Index).
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
// 2. SEARCH ENGINE (NÂNG CẤP: Dùng Query đã được NLU Rewrite)
// ==============================================================================

async function findBestMatch(db, correctedQuery, currentCity = null) {
    if (!correctedQuery || correctedQuery.length < 2) return null;
    
    // Query Expansion: Nếu câu đã sửa chưa có tên City, thêm vào để Vector Search tốt hơn
    let vectorQuery = correctedQuery;
    if (currentCity && !correctedQuery.toLowerCase().includes(currentCity.toLowerCase())) {
        vectorQuery = `${correctedQuery} tại ${currentCity}`;
    }

    console.log(`🔍 Searching Vector DB for: "${vectorQuery}"`);

    // Tìm kiếm Vector
    let vectors = await searchVector(vectorQuery, 0.12, 10, null); 
    
    if (vectors && vectors.length > 0) {
        console.log(`   Found ${vectors.length} candidates.`);
    }

    // Rerank lại bằng AI để chọn cái đúng nhất
    return await rerankWithLLM(correctedQuery, vectors, currentCity);
}

// ==============================================================================
// 3. MAIN LOGIC (SUGGEST HYBRID)
// ==============================================================================

async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now();
  
  // A. Context Recovery: Lấy lại trạng thái cũ từ lịch sử
  const history = Array.isArray(context.history) ? context.history : [];
  let lastCity = null;
  let lastEntityName = null;

  for (const turn of history) {
      // Ưu tiên lấy state gần nhất
      if (!lastCity && turn.context_state?.city) lastCity = turn.context_state.city;
      if (!lastCity && turn.context_state?.last_city) lastCity = turn.context_state.last_city;
      if (!lastEntityName && turn.context_state?.last_entity_name) lastEntityName = turn.context_state.last_entity_name;
  }

  // B. PURE AI NLU: Truyền Context vào để NLU tự sửa lỗi & Rewrite câu hỏi
  // VD: User "giá vé bao nhiêu" + Context "Bà Nà" -> NLU trả về "giá vé Bà Nà bao nhiêu"
  let nlu = await analyzeAsync(message, { last_city: lastCity, last_entity: lastEntityName });
  
  let currentCity = nlu.city || lastCity; 
  let searchPayload = nlu.rewritten; // QUAN TRỌNG: Dùng câu NLU đã viết lại

  console.log(`\n💬 Raw: "${message}"`);
  console.log(`✨ AI Rewritten: "${searchPayload}" | Intent: ${nlu.intent} | City: ${currentCity}`);

  // Base Context cho lượt tiếp theo
  const nextContextBase = {
      city: currentCity,      
      last_city: currentCity, 
      last_entity_name: lastEntityName // Giữ nguyên, sẽ update nếu tìm thấy entity mới
  };

  // --- FLOW 1: WEATHER ---
  if (nlu.intent === 'ask_weather') {
      const targetCity = currentCity || 'Hồ Chí Minh';
      const weatherData = await getCurrentWeather(targetCity);
      return { 
          ...weatherData, 
          latency_ms: Date.now() - started, 
          next_context: { ...nextContextBase, city: targetCity },
          nlu // Debug info
      };
  }

  // --- FLOW 2: DISTANCE ---
  if (nlu.intent === 'ask_distance') {
      return { 
          summary: `Mình chưa hỗ trợ tính khoảng cách chính xác trên bản đồ. Bạn vui lòng kiểm tra Google Maps nhé!`, 
          source: 'system-limitation', 
          next_context: nextContextBase 
      };
  }

  // --- FLOW 3: SEARCH & DETAILS ---
  // Chỉ search nếu không phải chitchat hoặc câu quá ngắn vô nghĩa
  let match = null;
  if (nlu.intent !== 'chitchat' && nlu.intent !== 'other') {
      match = await findBestMatch(db, searchPayload, currentCity);
  }
  
  // Fallback Logic: Nếu không tìm thấy gì nhưng User đang hỏi chi tiết -> Thử search lại Context cũ
  if (!match && lastEntityName && ['ask_details', 'ask_places'].includes(nlu.intent)) {
      console.log(`↩️ Fallback Search: Re-checking context "${lastEntityName}"`);
      match = await findBestMatch(db, lastEntityName, currentCity);
  }

  // --- KẾT QUẢ TÌM KIẾM ---
  if (match && match.score >= 0.12) { 
      console.log(`🚀 Match Found: ${match.item.name} (${match.score.toFixed(2)})`);
      const safeDoc = extractProvinceDoc(match.doc);
      
      const payload = await compose({
        doc: safeDoc, 
        nlu: { ...nlu, intent: 'ask_details', city: safeDoc?.name }, 
        user_ctx: { forcedItem: match.item, userMessage: searchPayload, ...context }
      });
      
      payload.latency_ms = Date.now() - started;
      // Cập nhật Entity mới vào Context để lượt sau user hỏi "nó ở đâu" thì bot hiểu
      payload.next_context = { 
          city: currentCity || safeDoc?.name,
          last_city: currentCity || safeDoc?.name,
          last_entity_name: match.item.name 
      };
      return payload;
  }

  // --- FLOW 4: CHITCHAT / FALLBACK ---
  if (nlu.intent === 'chitchat') {
      // Small talk thì dùng message gốc cho tự nhiên
      const payload = await composeSmallTalk({ message }); 
      payload.latency_ms = Date.now() - started;
      payload.next_context = nextContextBase;
      return payload;
  }

  // Kiểm tra các Intent Database khác (SQL)
  if (nlu.intent === 'ask_promotions') return await getPromotionsValidToday(10, { llm: true, context: { ...context, nlu }, next_context: nextContextBase });
  if (nlu.intent === 'ask_hotels') return await getTopHotels(currentCity || 'Hồ Chí Minh', 5, { llm: true, context: { ...context, nlu }, next_context: nextContextBase });

  // Cuối cùng: Fallback Tỉnh/Thành
  console.log('❌ No match found. City Fallback.');
  const payload = await composeCityFallback({ city: currentCity, message: searchPayload });
  payload.latency_ms = Date.now() - started;
  payload.next_context = nextContextBase;
  return payload;
}

// ==============================================================================
// 4. HELPERS & SQL EXPORTS (Giữ nguyên)
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