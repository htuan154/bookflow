'use strict';

const { generateJSON } = require('../../../config/ollama');
const { validateResponse } = require('./guardrails.service');
const { cache, makeKey } = require('../../../config/cache');
const { normalize } = require('./nlu.service');

// ==============================================================================
// 1. DATA SANITIZATION & HELPERS
// ==============================================================================

const CJK_REGEX = /[\u3400-\u9fff]/g;
const sanitizeText = (s = '') => String(s || '').replace(CJK_REGEX, '').trim();

const sanitizePayload = (p = {}) => {
  return {
    ...p,
    summary: sanitizeText(p.summary || ''), 
    places: Array.isArray(p.places) ? p.places : [],
    dishes: Array.isArray(p.dishes) ? p.dishes : [],
    tips: Array.isArray(p.tips) ? p.tips.filter(Boolean) : [],
    promotions: Array.isArray(p.promotions) ? p.promotions : [],
    hotels: Array.isArray(p.hotels) ? p.hotels : [],
    province: p.province || null,
    source: p.source || 'unknown'
  };
};

// ==============================================================================
// 2. CONTEXT HELPERS (Giữ nguyên)
// ==============================================================================

function monthContext(m) {
  if (!m || m < 1 || m > 12) return '';
  if (m >= 5 && m <= 10) return 'Đang là mùa mưa, bạn nhớ mang theo ô nhé.';
  if (m >= 11 || m <= 4) return 'Trời đang vào mùa đẹp, rất thích hợp đi chơi.';
  return '';
}

// ==============================================================================
// 3. AI THINKING MODE [PROMPT ĐƯỢC NÂNG CẤP ĐỂ NÓI HAY HƠN]
// ==============================================================================

async function composeSpecificItem({ doc, targetItem, userMessage }) {
  const itemName = targetItem.name || 'Địa điểm này';
  const itemType = targetItem.type || 'place'; 
  const provinceName = doc.name || 'Địa phương';
  
  // Chỉ dẫn chi tiết tùy loại
  let specificInstruction = "";
  if (itemType === 'dish') {
      specificInstruction = `Đây là MÓN ĂN. Hãy miêu tả hương vị đậm đà, nguyên liệu hấp dẫn khiến người nghe "chảy nước miếng".`;
  } else {
      specificInstruction = `Đây là ĐỊA ĐIỂM. Hãy miêu tả không khí, kiến trúc hoặc giá trị lịch sử để khơi gợi cảm hứng đi ngay lập tức.`;
  }

  // 🔥 UPDATE PROMPT: Yêu cầu AI nói dài và hay hơn
  const prompt = `
Bạn là "Thổ địa du lịch" cực kỳ am hiểu và hoạt ngôn (AI Local Expert).

THÔNG TIN:
- Khách hỏi: "${userMessage}"
- Dữ liệu tìm được: "${itemName}" (${itemType}) tại "${provinceName}".
- Nội dung gốc: "${doc.doc || ''}" 

YÊU CẦU QUAN TRỌNG (PHONG CÁCH TRẢ LỜI):
1. **KHÔNG ĐƯỢC CỘC LỐC**: 
   - Sai: "Nó nằm ở Quận 1." (Quá chán!)
   - Đúng: "Chợ Bến Thành tọa lạc ngay trung tâm Quận 1 sầm uất, nơi được ví là trái tim của Sài Gòn với 4 cửa Đông Tây Nam Bắc..."
2. **Luôn mở rộng**: Sau khi trả lời câu hỏi chính, hãy bồi thêm 1-2 câu thông tin thú vị (lịch sử, không khí, cảm nhận).
3. **Giọng điệu**: Thân thiện, nhiệt tình, dùng từ ngữ gợi hình ảnh.
4. **Độ dài**: Phần summary phải từ 3-4 câu hoàn chỉnh.

JSON OUTPUT FORMAT:
{
  "summary": "Câu trả lời chi tiết và hấp dẫn của bạn.",
  "tips": ["Mẹo 1 (thực tế)", "Mẹo 2 (thú vị)"]
}
`;

  try {
    // Tăng temperature lên 0.45 để văn phong bay bổng hơn
    const raw = await generateJSON({ prompt, temperature: 0.45 }); 
    
    return sanitizePayload({
      summary: raw.summary || `${itemName} là điểm đến tuyệt vời tại ${provinceName} mà bạn nhất định không nên bỏ lỡ.`,
      places: itemType === 'place' ? [{ name: itemName, hint: 'Điểm đến gợi ý' }] : [], 
      dishes: itemType === 'dish' ? [{ name: itemName, where: 'Đặc sản phải thử' }] : [],
      tips: raw.tips || [],
      source: 'ai-flex-knowledge'
    });

  } catch (error) {
    return sanitizePayload({ 
        summary: `Mời bạn ghé thăm ${itemName} tại ${provinceName}. Đây là một ${itemType === 'dish' ? 'món ngon' : 'địa điểm'} rất đáng trải nghiệm.`,
        places: [{ name: itemName, hint: '' }],
        source: 'fallback-error' 
    });
  }
}

// ==============================================================================
// 4. GENERIC MODE (PROMPT NÂNG CẤP)
// ==============================================================================

function factsToPrompt({ doc, queryType = 'overview', intent }) {
  const places = (doc.places || []).slice(0, 10).map(p => p.name).join(', ');
  const dishes = (doc.dishes || []).slice(0, 10).map(d => d.name).join(', ');
  
  let conditionalInstructions = '';
  if (queryType === 'dishes') conditionalInstructions = 'Hãy tập trung review ẩm thực thật hấp dẫn.';
  else if (queryType === 'places') conditionalInstructions = 'Hãy vẽ ra bức tranh du lịch với các địa điểm nổi tiếng.';
  else conditionalInstructions = 'Hãy giới thiệu tổng quan đầy cảm hứng về vùng đất này.';

  // 🔥 UPDATE PROMPT TỔNG QUAN
  return `
Bạn là một Blogger du lịch nổi tiếng.
Vùng đất: ${doc.name}
Địa danh có sẵn: ${places}
Món ăn có sẵn: ${dishes}

YÊU CẦU:
1. Viết đoạn giới thiệu (Summary) khoảng 60-80 từ. ${conditionalInstructions}
2. Văn phong: Cuốn hút, dùng từ ngữ gợi cảm xúc (VD: "thơ mộng", "sôi động", "ngon khó cưỡng").
3. Chọn ra 5 địa điểm và 5 món ăn tiêu biểu nhất để gợi ý.

JSON OUTPUT:
{
  "summary": "Đoạn văn giới thiệu...",
  "places": [{ "name": "Tên", "hint": "Mô tả ngắn hấp dẫn" }],
  "dishes": [{ "name": "Tên", "where": "Địa chỉ/Khu vực" }],
  "tips": []
}
(intent: ${intent})
`;
}

// ==============================================================================
// 5. MAIN COMPOSE (LOGIC GIỮ NGUYÊN)
// ==============================================================================

function normRow(x, tag = '') {
  if (!x || typeof x !== 'object') return null;
  const name = x.name || x.title || x.hotel_name || x.promotion_name || x.code || x.id || null;
  if (!name) return null;
  return { ...x, name, _tag: tag };
}

function normRows(rows, tag = '') {
  if (!Array.isArray(rows)) return [];
  return rows.map(r => normRow(r, tag)).filter(Boolean);
}

const uniqBy = (arr, keyFn) => {
  const seen = new Set();
  return (arr || []).filter(x => {
    try { const k = keyFn(x); if (!k || seen.has(k)) return false; seen.add(k); return true; } catch { return false; }
  });
};
const normKey = v => normalize(String(v || ''));

async function compose({ doc, sql = [], nlu = {}, filters = {}, user_ctx = {}, intent }) {
  // Case 1: Hỏi chi tiết về 1 địa điểm cụ thể (Force Item)
  if (user_ctx && user_ctx.forcedItem && doc) {
      return await composeSpecificItem({
          doc,
          targetItem: user_ctx.forcedItem,
          userMessage: user_ctx.userMessage || nlu?.normalized || '' 
      });
  }

  const key = makeKey({
    doc_key: doc?.name || doc?.province || 'no-doc',
    sql_tags: (sql || []).map(ds => ds?.tag || ds?.name).join('|') || 'no-sql',
    intent: intent || nlu?.intent || 'generic',
    city: nlu?.city || user_ctx?.city || '',
    filters, user_ctx
  });
  const cached = cache.get(key);
  if (cached) return cached;

  // Case 2: SQL Data (Booking, Promo...)
  if (Array.isArray(sql) && sql.length > 0) {
    const items = [];
    for (const ds of sql) items.push(...normRows(ds?.rows || [], ds?.name || 'dataset'));
    const isHotel = items.some(i => i.hotel_id || i.star_rating);
    const isPromo = items.some(i => i.promotion_id || i.discount_value);
    
    const out = sanitizePayload({
        summary: `Mình tìm thấy ${items.length} kết quả phù hợp với yêu cầu của bạn đây!`,
        hotels: isHotel ? items.slice(0, 10) : [],
        promotions: isPromo ? items.slice(0, 10) : [],
        source: 'sql+llm'
    });
    cache.set(key, out);
    return out;
  }

  // Case 3: Doc Fallback
  if (!doc || !doc.name) {
    const fb = await composeCityFallback({ city: user_ctx?.city, message: nlu?.normalized }).catch(() => null);
    return fb || sanitizePayload({ summary: 'Thông tin này mình đang cập nhật thêm, bạn đợi chút nhé.', source: 'empty' });
  }

  // Case 4: Generic Overview (Tổng quan tỉnh/thành)
  try {
    const queryType = nlu?.queryType || 'overview';
    const prompt = factsToPrompt({ doc, queryType, intent: intent || 'generic' });
    const raw = await generateJSON({ prompt, temperature: 0.3 }); // Generic thì temp thấp hơn chút để ổn định list
    const safe = validateResponse(raw, doc);

    const out = sanitizePayload({
      summary: safe.summary || `Chào mừng bạn đến với ${doc.name}, một vùng đất tuyệt vời!`,
      places: uniqBy(safe.places, x => normKey(x.name)),
      dishes: uniqBy(safe.dishes, x => normKey(x.name)),
      tips: safe.tips || [],
      source: 'nosql-generic'
    });

    cache.set(key, out);
    return out;
  } catch (e) {
    const out = sanitizePayload({
      summary: `${doc.name} có rất nhiều cảnh đẹp và món ngon đang chờ bạn khám phá.`,
      places: (doc.places || []).slice(0, 5).map(x => ({ name: x.name, hint: '' })),
      dishes: [],
      tips: [],
      source: 'nosql-fallback'
    });
    cache.set(key, out);
    return out;
  }
}

async function composeSmallTalk({ message = '' }) {
  const prompt = `Bạn là trợ lý du lịch vui tính. User nói: "${message}". Hãy trả lời thật thân thiện, dùng emoji. JSON: {"summary": "..."}`;
  try {
    const resp = await generateJSON({ prompt, temperature: 0.6 });
    return sanitizePayload({ summary: resp?.summary || 'Chào bạn! Mình có thể giúp gì cho chuyến đi sắp tới?', source: 'llm-chitchat' });
  } catch {
    return sanitizePayload({ summary: 'Xin chào! Rất vui được hỗ trợ bạn.', source: 'chitchat-static' });
  }
}

async function composeCityFallback({ city, message = '' }) {
    const prompt = `User hỏi về "${city || 'địa điểm'}" nhưng database chưa có. Nội dung: "${message}". Trả lời khéo léo, hứa sẽ học thêm. JSON: {"summary": "..."}`;
    try {
        const raw = await generateJSON({ prompt, temperature: 0.5 });
        return sanitizePayload({ summary: raw?.summary || 'Địa điểm này mới quá, mình chưa kịp cập nhật. Bạn hỏi địa điểm khác nhé?', source: 'llm-pure-fallback' });
    } catch {
        return sanitizePayload({ summary: 'Xin lỗi, thông tin này mình chưa có.', source: 'empty' });
    }
}

function fallbackFromDoc(doc) {
  return sanitizePayload({
    province: doc.name,
    places: (doc.places || []).slice(0,5),
    dishes: (doc.dishes || []).slice(0,5),
    source: 'static'
  });
}

module.exports = { compose, composeSmallTalk, fallbackFromDoc, composeCityFallback };