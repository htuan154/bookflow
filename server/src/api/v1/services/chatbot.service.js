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

/**
 * Hàm dùng LLM (AI) để chọn ra kết quả phù hợp nhất từ danh sách candidates(ứng viên).
 * - Bước 1: Lọc các candidate hợp lệ (có item và item.name).
 * - Bước 2: Nếu có city và query không phải tên riêng, ưu tiên các candidate cùng thành phố (strict mode).
 * - Bước 3: Nếu chỉ còn 1 candidate, trả về luôn.
 * - Bước 4: Nếu còn nhiều candidate, tạo prompt liệt kê các lựa chọn và gửi cho AI (Ollama) để chọn index tốt nhất.
 * - Bước 5: Nếu AI trả về index hợp lệ thì lấy candidate đó, nếu không thì lấy candidate đầu tiên.
 * - Nếu có lỗi hoặc AI không trả về index hợp lệ thì fallback về candidate đầu tiên.
 *
 * @param {string} query - Câu hỏi/từ khóa tìm kiếm của user
 * @param {Array} candidates - Danh sách kết quả tìm kiếm sơ bộ
 * @param {string} currentCity - Thành phố hiện tại (nếu có)
 * @returns {object|null} Candidate phù hợp nhất hoặc null nếu không có
 */
async function rerankWithLLM(query, candidates, currentCity) {
    // Nếu không có candidates(ứng viên) hợp lệ thì trả về null
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return null;
    
    // Lọc các candidate hợp lệ (có item và item.name)
    const validCandidates = candidates.filter(c => c && c.item && c.item.name);
    if (validCandidates.length === 0) return null;

    // STRICT MODE: Ưu tiên item cùng thành phố, trừ khi query là tên riêng (ví dụ: tên địa danh cụ thể)
    let strictCandidates = validCandidates;
    // Kiểm tra query có phải tên riêng không (logic đơn giản: dài > 10 và chữ cái đầu viết hoa)
    const hasProperNoun = query.length > 10 && query[0] === query[0].toUpperCase(); // Logic đơn giản check tên riêng

    if (currentCity && !hasProperNoun) {
    // Nếu có city và không phải tên riêng, chỉ lấy các candidate cùng thành phố
        const cityMatches = validCandidates.filter(c => {
             const prov = (c.item.province || '').toLowerCase();
             const city = currentCity.toLowerCase();
             return prov.includes(city) || city.includes(prov);
        });
        if (cityMatches.length > 0) strictCandidates = cityMatches;
    }

    // Nếu chỉ còn 1 candidate thì trả về luôn
    if (strictCandidates.length === 1) return strictCandidates[0];

    // Tạo danh sách các lựa chọn cho prompt AI
    const candidateList = strictCandidates.map((c, i) => 
        `[${i}] ${c.item.name} (${c.item.province || 'Unknown'}) - Snippet: ${(c.item.doc || '').substring(0, 100)}...`
    ).join('\n');

    // Tạo prompt cho AI: liệt kê các lựa chọn, yêu cầu AI chọn index tốt nhất
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
        // Gửi prompt cho Ollama để AI chọn index tốt nhất
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
        
        // Nếu AI trả về index hợp lệ thì lấy candidate đó, nếu không thì lấy candidate đầu tiên
        if (idx === undefined || idx < 0 || idx >= strictCandidates.length) return strictCandidates[0]; 
        return strictCandidates[idx];
        // Nếu có lỗi, fallback về candidate đầu tiên
    } catch (e) { return strictCandidates[0]; }
}

// ==============================================================================
// 2. SEARCH ENGINE
// ==============================================================================

/**
 * Tìm kết quả phù hợp nhất với truy vấn của user bằng vector search kết hợp AI rerank.
 * - Nếu searchTerm quá ngắn hoặc không có thì trả về null.
 * - Nếu có city, ưu tiên ghép city vào searchTerm để tăng độ chính xác khi tìm kiếm.
 * - Gọi searchVector để lấy danh sách kết quả liên quan (theo vector embedding).
 * - Sau đó dùng rerankWithLLM để AI chọn ra kết quả phù hợp nhất từ danh sách vector vừa tìm được.
 *
 * @param {object} db - Kết nối database (không dùng trực tiếp ở đây)
 * @param {string} searchTerm - Từ khóa/tin nhắn user nhập
 * @param {string|null} currentCity - Thành phố hiện tại (nếu có)
 * @returns {object|null} Kết quả phù hợp nhất hoặc null nếu không tìm được
 */
async function findBestMatch(db, searchTerm, currentCity = null) {
    // Nếu không có searchTerm hoặc quá ngắn thì trả về null
    if (!searchTerm || searchTerm.length < 2) return null;
    
    // Nếu có city, ưu tiên ghép city vào query để tăng độ chính xác
    let vectorQuery = searchTerm;
    if (currentCity && !searchTerm.toLowerCase().includes(currentCity.toLowerCase())) {
        vectorQuery = `${searchTerm} ${currentCity}`;
    }

    // Tìm kiếm vector tương tự với ngưỡng score >= 0.12, lấy tối đa 15 kết quả
    console.log(`🔍 Vector Searching: "${vectorQuery}"`);
    let vectors = await searchVector(vectorQuery, 0.12, 15, null); 
    
    // Dùng AI rerank để chọn ra kết quả phù hợp nhất từ danh sách vector
    return await rerankWithLLM(searchTerm, vectors, currentCity);
}

// ==============================================================================
// 3. MAIN LOGIC
// ==============================================================================

/**
 * Hàm trung tâm xử lý logic trả lời của chatbot, kết hợp nhiều luồng (weather, hotels, promotions, vector search, chitchat)
 * dựa trên intent và ngữ cảnh hội thoại.
 *
 * @param {object} db - Kết nối database (không dùng trực tiếp ở đây)
 * @param {object} param1 - { message, context } gồm message người dùng và context hội thoại
 * @returns {object} payload trả lời phù hợp nhất
 */
async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now(); // Đánh dấu thời gian bắt đầu để đo latency
  
  // === 1. PHỤC HỒI NGỮ CẢNH (Context Recovery) ===
  // Lấy lại city và entity cuối cùng từ lịch sử hội thoại (nếu có)
  const history = Array.isArray(context.history) ? context.history : [];
  let lastCity = null;
  let lastEntityName = null;
  for (const turn of history) {
      if (!lastCity) lastCity = turn.context_state?.city || turn.context_state?.last_city;
      if (!lastEntityName) lastEntityName = turn.context_state?.last_entity_name;
  }

  // === B. PHÂN TÍCH NGÔN NGỮ TỰ NHIÊN (NLU Analysis) ===
  // Phân tích message để lấy intent, city, entity, search_term...
  let nlu = await analyzeAsync(message, { last_city: lastCity, last_entity: lastEntityName });
  let currentCity = nlu.city || lastCity ; 
  
  // AUTO-FIX QUERY: Nếu câu hỏi quá ngắn (ví dụ: "giá bao nhiêu", "ở đâu"), tự động ghép entity cũ vào search term
  let searchPayload = nlu.search_term; 
  if (lastEntityName && searchPayload.length < 15 && !searchPayload.includes(lastEntityName)) {
      // Nếu search term quá ngắn và chưa có entity cũ, tự động nối thêm entity cũ vào để tăng độ chính xác
      console.log(`💡 Query Expansion: Appending context entity "${lastEntityName}"`);
      searchPayload = `${searchPayload} ${lastEntityName}`;
  }

  // Log lại intent, city, search để debug
  console.log(`\n✨ Intent: ${nlu.intent} | City: ${currentCity} | Search: "${searchPayload}"`);

  // Tạo context base cho bước tiếp theo (giữ lại city, entity cuối cùng)
  let nextContextBase = {
      city: currentCity,      
      last_city: currentCity, 
      last_entity_name: lastEntityName 
  };

  // === FLOW 1: XỬ LÝ CÂU HỎI THỜI TIẾT ===
  // Nếu intent là hỏi thời tiết, gọi API lấy thời tiết và trả về luôn
  if (nlu.intent === 'ask_weather') {
      const weatherData = await getCurrentWeather(currentCity);
      return { ...weatherData, latency_ms: Date.now() - started, next_context: nextContextBase, nlu };
  }

  // === FLOW 2: XỬ LÝ CÂU HỎI KHÁCH SẠN ===
  if (nlu.intent === 'ask_hotels') {
      // Nếu có amenities (tiện ích), ưu tiên tìm khách sạn theo amenities
      if (nlu.amenities && nlu.amenities.length > 0) {
          return await getHotelsByAmenities(currentCity, nlu.amenities, 5, { 
              llm: true, context: { ...context, nlu }, next_context: nextContextBase 
          });
      }
      // Nếu không có amenities, lấy top khách sạn của city
      return await getTopHotels(currentCity, 5, { 
          llm: true, context: { ...context, nlu }, next_context: nextContextBase 
      });
  }

  // === FLOW 3: XỬ LÝ CÂU HỎI KHUYẾN MÃI ===
  if (nlu.intent === 'ask_promotions') {
    // Nếu hỏi khuyến mãi hôm nay
      if (nlu.time_ref === 'today' || message.toLowerCase().includes('hôm nay')) {
           return await getPromotionsValidTodayByCity(currentCity, 10, {
               llm: true, context: { ...context, nlu }, next_context: nextContextBase
           });
      }
      // Nếu hỏi khuyến mãi theo tháng
      const monthMatch = message.match(/tháng (\d+)/i);
      const month = monthMatch ? parseInt(monthMatch[1]) : (new Date().getMonth() + 1);
      const year = new Date().getFullYear();
      return await getPromotionsByKeywordCityMonth(null, currentCity, year, month, 10, {
          llm: true, context: { ...context, nlu }, next_context: nextContextBase
      });
  }

  // === FLOW 4: VECTOR SEARCH (Tìm kiếm ngữ nghĩa + AI rerank) ===
  let match = null;
  // Nếu intent không phải chitchat/other thì tìm kiếm vector
  if (nlu.intent !== 'chitchat' && nlu.intent !== 'other') {
      match = await findBestMatch(db, searchPayload, currentCity);
  }
  
  // Fallback: Nếu không tìm thấy, thử lại với entity cũ (nếu intent là ask_details/ask_places)
  if (!match && lastEntityName && ['ask_details', 'ask_places'].includes(nlu.intent)) {
      console.log(`↩️ Fallback: Re-checking context "${lastEntityName}"`);
      match = await findBestMatch(db, lastEntityName, currentCity);
  }

  // Nếu tìm được match đủ score, trả về kết quả chi tiết
  if (match && match.score >= 0.12) { 
      console.log(`🚀 Match Found: ${match.item.name} (${match.score.toFixed(2)})`);
      const safeDoc = extractProvinceDoc(match.doc);
      
      // 🔥 CRITICAL FIX: Nếu địa điểm tìm thấy có tên tỉnh, cập nhật context city ngay lập tức
      const foundProvince = match.item.province; 
      if (foundProvince && foundProvince.length > 2) {
           console.log(`🌍 Auto-updating City Context: ${currentCity} -> ${foundProvince}`);
           currentCity = foundProvince;
           nextContextBase.city = foundProvince;
           nextContextBase.last_city = foundProvince;
      }

      // Gọi compose để tạo payload trả lời chi tiết
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

  // === FLOW 5: CHITCHAT / FALLBACK ===
  // Nếu intent là chitchat, trả về hội thoại nhỏ  
  if (nlu.intent === 'chitchat') {
      const payload = await composeSmallTalk({ message }); 
      payload.latency_ms = Date.now() - started;
      payload.next_context = nextContextBase;
      return payload;
  }

  // Nếu không tìm thấy gì, fallback về trả lời mặc định cho city
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

// Các hàm xử lý API cho các truy vấn SQL liên quan đến khách sạn và khuyến mãi
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

// Giải thích về tham số temperature:
// - temperature là tham số điều chỉnh mức độ ngẫu nhiên/kreativity của AI model (Ollama)
// - temperature = 0.0: AI trả về kết quả nhất quán, ít sáng tạo, bám sát hướng dẫn
// - temperature cao hơn (gần 1.0): AI trả về đa dạng, sáng tạo hơn nhưng có thể không ổn định
// - Ở đây để temperature = 0.0 nhằm đảm bảo AI luôn trả về kết quả chuẩn xác, nhất quán khi chuyển đổi tên thành phố