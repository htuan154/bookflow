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

const stripDegrees = (text = '') => {
  if (!text) return '';
  const repl = 'nhiệt độ dễ chịu';
  return String(text)
    .replace(/(?:khoảng|từ)?\s*\d+\s*[-–]\s*\d+\s*(?:độ|do|°)\s*c/gi, repl)
    .replace(/(?:khoảng|từ)?\s*\d+\s*(?:độ|do|°)\s*c/gi, repl)
    .replace(/\b\d+\s*(?:độ|do|°)\b/gi, repl)
    .replace(/\s{2,}/g, ' ')
    .trim();
};

// ==============================================================================
// 2. CONTEXT HELPERS
// ==============================================================================

function monthContext(m) {
  if (!m || m < 1 || m > 12) return '';
  if (m >= 5 && m <= 10) return 'Đang là mùa mưa ở nhiều nơi, hãy chuẩn bị ô hoặc áo mưa.';
  if (m >= 11 || m <= 4) return 'Thời tiết khô ráo, rất thích hợp để tham quan ngoài trời.';
  return '';
}

const CITY_MONTH_OVERRIDES = [
  {
    cities: ['Đà Nẵng', 'Quảng Nam', 'Thừa Thiên Huế', 'Quảng Ngãi', 'Bình Định', 'Phú Yên'],
    overrides: {
      9: 'Miền Trung bắt đầu vào mùa mưa bão, cần theo dõi dự báo thời tiết.',
      10: 'Miền Trung đang cao điểm mưa bão, hạn chế các hoạt động biển.',
      11: 'Vẫn còn mưa lớn và biển động ở miền Trung, hãy chuẩn bị phương án dự phòng.'
    }
  }
];

function cityMonthContext(city, month) {
  if (!city || !month) return '';
  const normCity = normalize(String(city));
  for (const group of CITY_MONTH_OVERRIDES) {
    if (group.cities.some(name => normalize(name) === normCity)) {
      return group.overrides?.[month] || '';
    }
  }
  return '';
}

// ==============================================================================
// 3. AI THINKING MODE [UPDATED FIX]
// ==============================================================================

async function composeSpecificItem({ doc, targetItem, userMessage }) {
  const itemName = targetItem.name || 'Địa điểm này';
  const itemType = targetItem.type || 'place'; // Nhận type từ logic search
  const provinceName = doc.name || 'Địa phương';
  
  // Prompt chỉ thị rõ ràng theo loại
  let specificInstruction = "";
  if (itemType === 'dish') {
      specificInstruction = `Đây là MÓN ĂN đặc sản. Hãy mô tả hương vị, nguyên liệu và độ ngon. Tuyệt đối KHÔNG mô tả phong cảnh hay địa điểm check-in.`;
  } else {
      specificInstruction = `Đây là ĐỊA ĐIỂM du lịch. Hãy mô tả vẻ đẹp kiến trúc, thiên nhiên, không khí và hoạt động tham quan.`;
  }

  const prompt = `
Bạn là Hướng dẫn viên du lịch địa phương (AI Local Guide).

THÔNG TIN ĐẦU VÀO:
- Khách hỏi: "${userMessage}"
- Hệ thống tìm được: "${itemName}" (${itemType}) tại "${provinceName}".

YÊU CẦU:
1. Giới thiệu ngắn gọn, hấp dẫn về "${itemName}".
2. ${specificInstruction}
3. Trả lời đúng trọng tâm câu hỏi. Nếu khách hỏi "ở đâu", hãy chỉ đường. Nếu khách hỏi "ngon không", hãy tả vị.
4. Giọng điệu: Tự nhiên, nhiệt tình, như bạn bè.

JSON OUTPUT:
{
  "summary": "Câu trả lời của bạn (khoảng 3 câu).",
  "tips": ["Mẹo 1", "Mẹo 2"]
}
`;

  try {
    const raw = await generateJSON({ prompt, temperature: 0.4 }); // Temperature 0.4 để cân bằng sáng tạo/chính xác
    
    return sanitizePayload({
      summary: raw.summary || `${itemName} là một lựa chọn tuyệt vời tại ${provinceName}.`,
      places: itemType === 'place' ? [{ name: itemName, hint: 'Gợi ý từ AI' }] : [], 
      dishes: itemType === 'dish' ? [{ name: itemName, where: 'Đặc sản địa phương' }] : [],
      tips: raw.tips || [],
      source: 'ai-flex-knowledge'
    });

  } catch (error) {
    return sanitizePayload({ 
        summary: `Mời bạn tham khảo ${itemName} tại ${provinceName}. Đây là một ${itemType === 'dish' ? 'món ăn' : 'địa điểm'} nổi tiếng.`,
        places: [{ name: itemName, hint: '' }],
        source: 'fallback-error' 
    });
  }
}
// ==============================================================================
// 4. GENERIC MODE
// ==============================================================================

function factsToPrompt({ doc, queryType = 'overview', intent }) {
  const places = (doc.places || []).slice(0, 10).map(p => p.name).join(', ');
  const dishes = (doc.dishes || []).slice(0, 10).map(d => d.name).join(', ');
  const mergedList = doc.merged_from || doc.mergedFrom || [];
  const mergedNote = mergedList.length ? `(Bao gồm dữ liệu của: ${mergedList.join(', ')})` : '';

  let conditionalInstructions = '';
  if (queryType === 'dishes') conditionalInstructions = 'Tập trung giới thiệu ẩm thực.';
  else if (queryType === 'places') conditionalInstructions = 'Tập trung giới thiệu cảnh đẹp.';
  else conditionalInstructions = 'Giới thiệu tổng quan.';

  return `
Bạn là trợ lý du lịch chuyên nghiệp.
Vùng dữ liệu: ${doc.name} ${mergedNote}.
Địa danh: ${places}
Món ăn: ${dishes}

YÊU CẦU:
1. Viết summary (3-4 câu) giới thiệu du lịch khu vực này. ${conditionalInstructions}
2. Chọn 5 địa điểm + 5 món ăn tiêu biểu.
3. Tạo "hint" (địa điểm) và "where" (món ăn) ngắn gọn.

JSON OUTPUT:
{
  "summary": "...",
  "places": [{ "name": "Tên", "hint": "Mô tả" }],
  "dishes": [{ "name": "Tên", "where": "Địa chỉ" }],
  "tips": []
}
(intent: ${intent})
`;
}

// ==============================================================================
// 5. SQL HELPERS & MAIN COMPOSE
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

  if (Array.isArray(sql) && sql.length > 0) {
    const items = [];
    for (const ds of sql) items.push(...normRows(ds?.rows || [], ds?.name || 'dataset'));
    const isHotel = items.some(i => i.hotel_id || i.star_rating);
    const isPromo = items.some(i => i.promotion_id || i.discount_value);
    
    const out = sanitizePayload({
        summary: `Tìm thấy ${items.length} kết quả phù hợp.`,
        hotels: isHotel ? items.slice(0, 10) : [],
        promotions: isPromo ? items.slice(0, 10) : [],
        source: 'sql+llm'
    });
    cache.set(key, out);
    return out;
  }

  if (!doc || !doc.name) {
    const fb = await composeCityFallback({ city: user_ctx?.city, message: nlu?.normalized }).catch(() => null);
    return fb || sanitizePayload({ summary: 'Chưa đủ dữ kiện.', source: 'empty' });
  }

  try {
    const queryType = nlu?.queryType || 'overview';
    const prompt = factsToPrompt({ doc, queryType, intent: intent || 'generic' });
    const raw = await generateJSON({ prompt, temperature: 0.2 });
    const safe = validateResponse(raw, doc);

    const out = sanitizePayload({
      summary: safe.summary || `Thông tin du lịch ${doc.name}.`,
      places: uniqBy(safe.places, x => normKey(x.name)),
      dishes: uniqBy(safe.dishes, x => normKey(x.name)),
      tips: safe.tips || [],
      source: 'nosql-generic'
    });

    cache.set(key, out);
    return out;
  } catch (e) {
    const out = sanitizePayload({
      summary: `Du lịch ${doc.name} có rất nhiều điều thú vị.`,
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
  const prompt = `Bạn là trợ lý du lịch. User nói: "${message}". Hãy trả lời vui vẻ 2-3 câu. JSON: {"summary": "..."}`;
  try {
    const resp = await generateJSON({ prompt, temperature: 0.5 });
    return sanitizePayload({ summary: resp?.summary || 'Chào bạn!', source: 'llm-chitchat' });
  } catch {
    return sanitizePayload({ summary: 'Xin chào!', source: 'chitchat-static' });
  }
}

async function composeCityFallback({ city, message = '' }) {
    const prompt = `User hỏi về "${city || 'địa điểm'}" (dữ liệu DB chưa có). Nội dung: "${message}". Trả lời xã giao, gợi ý chung chung. JSON: {"summary": "..."}`;
    try {
        const raw = await generateJSON({ prompt, temperature: 0.5 });
        return sanitizePayload({ summary: raw?.summary || 'Mình chưa có thông tin chi tiết.', source: 'llm-pure-fallback' });
    } catch {
        return sanitizePayload({ summary: 'Xin lỗi, mình chưa có thông tin.', source: 'empty' });
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