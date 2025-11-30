'use strict';

/**
 * Chatbot Service v17.0 [FULL LOGIC + SENSITIVITY FIX]
 * - Search Threshold: 0.12 (Tăng khả năng tìm thấy dữ liệu).
 * - Context Logic: Xử lý trường hợp hỏi nối tiếp nhưng thiếu Entity.
 * - Debugging: Log chi tiết Raw Vectors.
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
// 1. AI RERANKING (Sắp xếp lại kết quả tìm kiếm)
// ==============================================================================

async function rerankWithLLM(query, candidates, currentCity) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return null;
    
    // Lọc bỏ kết quả rác
    const validCandidates = candidates.filter(c => c && c.item && c.item.name);
    
    if (validCandidates.length === 0) return null;
    
    // Nếu chỉ có 1 kết quả và điểm > 0.12 -> Lấy luôn (Không cần hỏi AI tốn thời gian)
    if (validCandidates.length === 1 && validCandidates[0].score > 0.12) return validCandidates[0];

    // Format danh sách cho AI chọn
    const candidateList = validCandidates.map((c, i) => 
        `${i}. ${c.item.name} (${c.metadata.province || 'N/A'}) - Score: ${c.score.toFixed(2)}`
    ).join('\n');

    const prompt = `
    Câu hỏi: "${query}"
    Ngữ cảnh thành phố: "${currentCity || 'Không rõ'}"
    
    Danh sách ứng viên:
    ${candidateList}
    
    Yêu cầu: Chọn index (0, 1...) của mục phù hợp nhất.
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
                options: { temperature: 0.0 } // 0.0 để kết quả nhất quán
            })
        });

        const data = await res.json();
        const idx = parseInt(data.response.match(/-?\d+/)?.[0] || '0');
        
        if (idx === -1) return validCandidates[0]; // Fallback an toàn
        return validCandidates[idx] || validCandidates[0];

    } catch (e) {
        return validCandidates[0];
    }
}

// ==============================================================================
// 2. SEARCH ENGINE (TÌM KIẾM VECTOR)
// ==============================================================================

async function findBestMatch(db, query, currentCity = null) {
    if (!query || query.length < 2) return null;
    
    // Kỹ thuật Query Expansion: Thêm tên thành phố vào câu query nếu chưa có
    let enhancedQuery = query;
    if (currentCity && !query.toLowerCase().includes(currentCity.toLowerCase())) {
        enhancedQuery = `${query} tại ${currentCity}`;
    }

    // 🔥 QUAN TRỌNG: Hạ ngưỡng xuống 0.12 để bắt được nhiều dữ liệu hơn
    let vectors = await searchVector(enhancedQuery, 0.12, 10, null); 
    
    // Log để debug xem Vector tìm thấy gì
    if (vectors && vectors.length > 0) {
        console.log(`🔍 Raw Vectors: ${vectors.map(v => `${v.item.name}(${v.score.toFixed(2)})`).join(', ')}`);
    } else {
        console.log(`🔍 Raw Vectors: NONE for query "${enhancedQuery}"`);
    }

    return await rerankWithLLM(query, vectors, currentCity);
}

// ==============================================================================
// 3. MAIN LOGIC (XỬ LÝ HỘI THOẠI)
// ==============================================================================

async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now();
  
  // --- A. PHỤC HỒI NGỮ CẢNH (CONTEXT RECOVERY) ---
  const history = Array.isArray(context.history) ? context.history : [];
  let lastCity = null;
  let lastEntityName = null;

  for (const turn of history) {
      if (!lastCity && turn.context_state?.city) lastCity = turn.context_state.city;
      if (!lastCity && turn.context_state?.last_city) lastCity = turn.context_state.last_city;
      if (!lastEntityName && turn.context_state?.entity_name) lastEntityName = turn.context_state.entity_name;
  }

  // --- B. NLU ANALYSIS ---
  let nlu = await analyzeAsync(message);
  
  // Ưu tiên City mới phát hiện > City cũ trong bộ nhớ
  let currentCity = nlu.city || lastCity; 

  console.log(`\n💬 Query: "${message}" | Intent: ${nlu.intent} | City: ${currentCity} | LastEntity: ${lastEntityName}`);

  // Chuẩn bị object Context để trả về (Luôn phải có)
  const nextContextBase = {
      city: currentCity,      
      last_city: currentCity, 
      entity_name: lastEntityName
  };

  // =================================================================
  // FLOW 1: WEATHER (Thời tiết)
  // =================================================================
  if (nlu.intent === 'ask_weather') {
      const targetCity = currentCity || 'Hồ Chí Minh';
      console.log(`👉 Action: Weather (${targetCity})`);
      const weatherData = await getCurrentWeather(targetCity);
      
      return { 
          ...weatherData, 
          latency_ms: Date.now() - started, 
          next_context: { ...nextContextBase, city: targetCity } 
      };
  }

  // =================================================================
  // FLOW 2: DISTANCE (Khoảng cách)
  // =================================================================
  if (nlu.intent === 'ask_distance') {
      const dest = lastEntityName || 'địa điểm này';
      return { 
          summary: `Hiện tại mình chưa tính được khoảng cách tới ${dest}. Bạn tra Google Maps tại ${currentCity || ''} nhé!`, 
          source: 'system-maintenance',
          next_context: nextContextBase
      };
  }

  // =================================================================
  // FLOW 3: SEARCH & RETRIEVAL (Tìm kiếm)
  // =================================================================
  
  const match = await findBestMatch(db, message, currentCity);
  
  // Logic: Hỏi nối tiếp (Follow-up)
  const isInfoIntent = ['ask_details', 'ask_dishes', 'ask_places'].includes(nlu.intent);
  
  // 🔥 TRƯỜNG HỢP ĐẶC BIỆT: Hỏi chi tiết nhưng không có ngữ cảnh
  // Ví dụ: User hỏi "Nó ở đâu?" nhưng Bot không biết "Nó" là gì (Entity=NULL) và cũng không tìm thấy Match mới.
  if (isInfoIntent && !match && !lastEntityName) {
      return {
          summary: `Xin lỗi, mình chưa hiểu bạn đang muốn hỏi về địa điểm cụ thể nào tại ${currentCity || 'đây'}. Bạn có thể nhắc lại tên địa điểm được không?`,
          source: 'missing-context-fallback',
          next_context: nextContextBase
      };
  }

  // Logic: Giữ Context cũ (Sticky Context)
  if (lastEntityName && isInfoIntent) {
      // Nếu kết quả tìm kiếm mới không "quá mạnh" (> 0.8) -> Giả định user vẫn hỏi về cái cũ
      const isStrongNewTopic = match && match.score > 0.8 && match.item.name !== lastEntityName;
      
      if (!isStrongNewTopic) {
          console.log(`↩️ Context Inference: Keeping focus on "${lastEntityName}"`);
          
          // Tìm lại thông tin của Entity cũ
          const contextMatch = await findBestMatch(db, lastEntityName, currentCity);
          
          if (contextMatch) {
               const safeDoc = extractProvinceDoc(contextMatch.doc);
               const payload = await compose({
                    doc: safeDoc,
                    nlu: { ...nlu, intent: 'ask_details', city: safeDoc?.name },
                    user_ctx: { 
                        forcedItem: contextMatch.item, 
                        forcedType: contextMatch.type, 
                        userMessage: message, 
                        isFollowUp: true, 
                        ...context 
                    }
               });
               payload.next_context = { ...nextContextBase, entity_name: lastEntityName };
               payload.latency_ms = Date.now() - started;
               return payload;
          }
      }
  }

  // Logic: Tìm thấy Topic Mới (Match >= 0.12)
  if (match && match.score >= 0.12) { 
      console.log(`🚀 Vector Match: ${match.item.name} (${match.score.toFixed(2)})`);
      const safeDoc = extractProvinceDoc(match.doc);
      
      const payload = await compose({
        doc: safeDoc,
        nlu: { ...nlu, intent: 'ask_details', city: safeDoc?.name }, 
        user_ctx: { forcedItem: match.item, forcedType: match.type, userMessage: message, ...context }
      });
      
      payload.latency_ms = Date.now() - started;
      
      // Cập nhật Entity mới vào Context
      payload.next_context = { 
          city: currentCity || safeDoc?.name,
          last_city: currentCity || safeDoc?.name,
          entity_name: match.item.name, // Lưu tên địa điểm mới
          entity_type: match.type 
      };
      return payload;
  }

  // =================================================================
  // FLOW 4: FALLBACK & CHITCHAT
  // =================================================================

  if (nlu.intent === 'chitchat') {
      const payload = await composeSmallTalk({ message });
      payload.latency_ms = Date.now() - started;
      payload.next_context = nextContextBase;
      return payload;
  }

  // SQL Fallbacks
  if (nlu.intent === 'ask_promotions') {
      const payload = await getPromotionsValidToday(10, { llm: true, context: { ...context, nlu } });
      if (payload) payload.next_context = nextContextBase;
      return payload;
  }
  if (nlu.intent === 'ask_hotels') {
      const payload = await getTopHotels(currentCity || 'Hồ Chí Minh', 5, { llm: true, context: { ...context, nlu } });
      if (payload) payload.next_context = nextContextBase;
      return payload;
  }

  // Final Fallback: Không tìm thấy gì
  console.log('❌ No match found. City Fallback.');
  const payload = await composeCityFallback({ city: currentCity, message });
  payload.latency_ms = Date.now() - started;
  payload.next_context = nextContextBase; // Vẫn phải giữ Context
  return payload;
}

// ==============================================================================
// 4. EXPORTS & HELPERS (Giữ nguyên)
// ==============================================================================

function wantLLM(opts) { if (opts && typeof opts.llm === 'boolean') return opts.llm; return USE_LLM; }
function normalizeRows(rows, tag = '') { return (Array.isArray(rows) ? rows : []).filter(Boolean).map(x => (typeof x === 'string' ? {name:x,_raw:x} : (x && x.name ? {...x} : null))).filter(Boolean); }
async function composeFromSQL(tag, params, rows, opts = {}) { const safeRows = normalizeRows(rows); return await compose({ sql: [{ name: tag, tag, params, rows: safeRows }], nlu: opts.context?.nlu || null, filters: opts.context?.filters || {}, user_ctx: opts.context || {} }); }
function extractProvinceDoc(raw) {
  if (!raw) return null;
  try { return { name: raw.name || raw.province || 'unknown', places: raw.places || [], dishes: raw.dishes || [] }; } 
  catch (err) { return { name: raw?.name || 'unknown' }; }
}
async function suggest(db, opts) { return suggestHybrid(db, opts); }

async function getTopHotels(city, limit = 10, opts = undefined) {
    const { data, error } = await supabase.rpc('top_hotels_by_city', { p_city: city, p_limit: limit });
    if (error) console.error('SQL Error:', error);
    if (!wantLLM(opts)) return { data }; 
    return await composeFromSQL('top_hotels_by_city', { city, limit }, data, opts);
}
async function getPromotionsValidToday(limit = 50, opts = undefined) {
    const { data, error } = await supabase.rpc('promotions_valid_today', { p_limit: limit });
    if (!wantLLM(opts)) return { data };
    return await composeFromSQL('promotions_valid_today', { limit }, data, opts);
}
async function searchHotels(q = '', city = '', limit = 20, opts = undefined) {
    const { data } = await supabase.rpc('search_hotels', { p_city: city, p_q: q, p_limit: limit });
    if (!wantLLM(opts)) return { data };
    return await composeFromSQL('search_hotels', { q, city, limit }, data, opts);
}

// Mock exports
async function getHotelsByAnyAmenities() { return {}; }
async function getHotelFull() { return {}; }
async function getPromotionsValidTodayByCity() { return {}; }
async function getPromotionsByKeywordCityMonth() { return {}; }
async function promoCheckApplicability() { return {}; }
async function promoUsageStats() { return {}; }
async function listHotelCities() { return {}; }
async function getHotelsByAmenities() { return {}; }
async function getPromotionsInMonth() { return {}; }
async function getPromotionsInMonthByCity() { return {}; }
async function getPromotionsByCity() { return {}; }

module.exports = {
  suggestHybrid, suggest, searchVector,
  getTopHotels, searchHotels, getPromotionsValidToday,
  getHotelsByAnyAmenities, getHotelFull, getPromotionsValidTodayByCity,
  getPromotionsByKeywordCityMonth, promoCheckApplicability, promoUsageStats,
  listHotelCities, getHotelsByAmenities, getPromotionsInMonth,
  getPromotionsInMonthByCity, getPromotionsByCity
};