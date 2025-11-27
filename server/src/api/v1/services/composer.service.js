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
  const provinceName = doc.name || 'Địa phương';
  
  // [FIX 1] Xử lý Merged Province: Nếu doc này là gộp (VD: Gia Lai gộp Bình Định), hãy báo cho AI biết
  const mergedList = doc.merged_from || doc.mergedFrom || [];
  const mergedInfo = (mergedList.length > 0)
    ? `(LƯU Ý: Dữ liệu tỉnh ${provinceName} đang bao gồm cả các địa danh thuộc: ${mergedList.join(', ')}. Nếu ${itemName} thuộc một trong các tỉnh này, hãy trả lời chính xác theo thực tế.)`
    : '';

  const dbInfo = targetItem.hint || targetItem.description || targetItem.content || ''; 
  const address = targetItem.where || targetItem.location || targetItem.address || '';
  
  console.log(`[Composer] Thinking Mode: Item="${itemName}" | Query="${userMessage}"`);

  const prompt = `
Bạn là Hướng dẫn viên du lịch địa phương (AI Local Guide) thân thiện.
KHÔNG dùng emoji. KHÔNG bịa đặt thông tin sai lệch.

BỐI CẢNH DỮ LIỆU (Context):
- Địa danh/Món ăn: "${itemName}"
- Thuộc tập dữ liệu vùng: ${provinceName} ${mergedInfo}
- Thông tin từ DB: "${dbInfo}"
- Địa chỉ/Vị trí: "${address}"

CÂU HỎI CỦA KHÁCH: "${userMessage}"

NHIỆM VỤ:
1. Trả lời câu hỏi của khách dựa trên Context và KIẾN THỨC CHUNG của bạn.
2. [QUAN TRỌNG] Nếu thông tin từ DB ("${dbInfo}") bị trống hoặc quá ngắn: 
   -> HÃY DÙNG KIẾN THỨC CỦA BẠN để mô tả hấp dẫn về địa điểm này. Đừng nói "không tìm thấy thông tin".
3. Xác định đúng vị trí thực tế của "${itemName}" (Ví dụ: Eo Gió thực tế ở Bình Định, dù dữ liệu có thể gộp chung với Gia Lai).
4. Nếu khách hỏi giá vé/giờ mở cửa mà bạn không chắc chắn, hãy đưa ra ước lượng hợp lý hoặc khuyên kiểm tra tại chỗ.

FORMAT JSON TRẢ VỀ:
{
  "summary": "Câu trả lời của bạn (3-5 câu). Viết tự nhiên, đúng trọng tâm.",
  "tips": ["Mẹo nhỏ 1", "Mẹo nhỏ 2"]
}
`;

  try {
    const raw = await generateJSON({ prompt, temperature: 0.3 });
    
    const summary = (raw && raw.summary)
      ? raw.summary 
      : `${itemName} là điểm đến nổi tiếng. ${mergedInfo ? 'Nó có thể thuộc khu vực ' + mergedList.join('/') : ''}.`;

    return sanitizePayload({
      summary: summary,
      places: [{ name: itemName, hint: dbInfo || 'Điểm đến hấp dẫn' }], 
      dishes: [],
      tips: Array.isArray(raw?.tips) ? raw.tips : [],
      source: 'ai-thinking'
    });

  } catch (error) {
    console.error('[composeSpecificItem] AI Error:', error.message);
    return sanitizePayload({
      summary: `Hiện mình chưa lấy được chi tiết về ${itemName}, nhưng đây là một địa điểm đáng chú ý ở khu vực ${provinceName}.`,
      places: [{ name: itemName, hint: dbInfo }],
      tips: [],
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