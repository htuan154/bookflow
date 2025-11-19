'use strict';

const { generateJSON } = require('../../../config/ollama');
const { validateResponse } = require('./guardrails.service');
const { cache, makeKey } = require('../../../config/cache');
const { normalize } = require('./nlu.service'); // ADDED for dedupe keys

// ===== Text sanitization helpers =====
const CJK_REGEX = /[\u3400-\u9fff]/g; // loại bỏ ký tự tiếng Trung/đông á bất ngờ
const sanitizeText = (s = '') => String(s || '')
  .replace(/Celsius/gi, '°C')
  .replace(CJK_REGEX, '')
  .trim();

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

const sanitizePayload = (p = {}) => {
  const cleanItem = (x) => ({
    ...x,
    name: sanitizeText(x?.name),
    hint: stripDegrees(sanitizeText(x?.hint)),
    where: sanitizeText(stripDegrees(x?.where || x?.location)),
    description: stripDegrees(sanitizeText(x?.description))
  });
  return {
    ...p,
    summary: stripDegrees(sanitizeText(p.summary)),
    tips: Array.isArray(p.tips) ? p.tips.map(t => stripDegrees(sanitizeText(t))).filter(Boolean) : [],
    places: Array.isArray(p.places) ? p.places.map(cleanItem) : [],
    dishes: Array.isArray(p.dishes) ? p.dishes.map(cleanItem) : [],
  };
};

function monthContext(m) {
  if (!m || m < 1 || m > 12) return '';
  if (m === 1 || m === 2) return 'Thời tiết đầu/nửa cuối mùa khô, mát hơn buổi sáng sớm và tối.';
  if (m === 3) return 'Cuối mùa khô, nắng nhiều, nên mang mũ/kem chống nắng.';
  if (m >= 4 && m <= 6) return 'Bước vào mùa mưa đầu/v giữa năm, có mưa rào bất chợt, mang áo mưa mỏng.';
  if (m === 7 || m === 8) return 'Giữa mùa mưa, độ ẩm cao, lưu ý áo mưa và giày khô nhanh.';
  if (m === 9 || m === 10) return 'Cuối mùa mưa, thời tiết dịu hơn, vẫn có mưa cục bộ.';
  if (m === 11) return 'Đầu mùa khô, thời tiết dễ chịu, ít mưa hơn, phù hợp tham quan.';
  if (m === 12) return 'Mùa khô, nắng nhiều nhưng chưa quá gắt, thuận tiện du lịch.';
  return '';
}

const CITY_MONTH_OVERRIDES = [
  {
    cities: ['Đà Nẵng', 'Quảng Nam', 'Thừa Thiên Huế', 'Quảng Ngãi'],
    overrides: {
      10: 'Miền Trung đang cao điểm mưa bão (tháng 9-12), thời tiết âm u, có thể có bão, nên chuẩn bị kế hoạch dự phòng.',
      11: 'Miền Trung vẫn ở đỉnh mùa mưa bão; thường có mưa lớn kéo dài, gió mạnh và biển động, nên ưu tiên hoạt động trong nhà.'
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

// Map một số địa danh phụ phổ biến -> tỉnh/TP
const PLACE_PROVINCE = new Map([
  ['pho hien', 'Hưng Yên'],
  ['thung lung may', 'Thanh Hóa'],
  ['tham quan pho hien', 'Hưng Yên'],
  ['pho hien hung yen', 'Hưng Yên'],
]);

function inferCityFromMessage(message = '') {
  const norm = normalize(String(message || ''));
  for (const [alias, city] of PLACE_PROVINCE.entries()) {
    if (norm.includes(alias)) return city;
  }
  return null;
}

function payloadFromHistory(history = []) {
  if (!Array.isArray(history) || history.length === 0) return null;
  const last = history[0]; // recentTurns sort desc
  const p = last?.reply?.payload || last?.replyPayload || last?.payload || null;
  return (p && typeof p === 'object') ? p : null;
}

// Một số địa danh cụ thể: xử lý quyết định sớm để trả lời đúng trọng tâm
const POI_RULES = [
  {
    alias: /nha tho duc ba/i,
    poi: 'Nhà thờ Đức Bà',
    cityActual: 'Hồ Chí Minh',
    info: 'Địa chỉ: 01 Công xã Paris, Q.1, TP.HCM. Kiến trúc Gothic Pháp, biểu tượng Sài Gòn, mở cửa miễn phí ban ngày.',
    alt: {
      city: 'Đà Nẵng',
      suggestion: 'Tham khảo Nhà thờ Chính toà Đà Nẵng (156 Trần Phú, Q.Hải Châu) với kiến trúc kiểu Gothic, còn gọi là Nhà thờ Con Gà.'
    }
  },
  {
    alias: /bao tang ca mau|bảo tàng cà mau/i,
    poi: 'Bảo tàng Cà Mau',
    cityActual: 'Cà Mau',
    info: 'Địa chỉ: 12 Phan Ngọc Hiển, P.2, TP Cà Mau. Trưng bày văn hóa Khmer, Hoa, Việt và hiện vật khẩn hoang miền Tây.',
  },
  {
    alias: /v[ịi]nh d[ạa]i l[aã]nh/i,
    poi: 'Vịnh Đại Lãnh',
    cityActual: 'Phú Yên',
    info: 'Vịnh biển ở giáp ranh Khánh Hòa - Phú Yên, nước xanh và bờ cát cong. Không nằm ở Cà Mau.',
  },
  {
    alias: /c[uù]\s*lao\s*t[iị]eu/i,
    type: 'misinfo',
    poi: 'Khu bảo tồn thiên nhiên Cù Lao Tiếu',
    info: 'Không có ghi nhận chính thức về khu bảo tồn tên "Cù Lao Tiếu". Khách thường nhầm lẫn với Rừng U Minh Hạ hoặc Sân chim Cà Mau khi tìm điểm sinh thái ở Cà Mau.',
    replacements: [
      {
        name: 'Rừng U Minh Hạ',
        hint: 'Khu dự trữ sinh quyển tại xã Khánh Lâm, huyện U Minh; có tour đi xuồng xuyên rừng tràm và leo tháp quan sát.'
      },
      {
        name: 'Sân chim Cà Mau',
        hint: 'Điểm ngắm chim tự nhiên ở ấp 1, xã Định Bình (TP Cà Mau), nên ghé sáng sớm để xem đàn chim về tổ.'
      }
    ],
    tips: [
      'Liên hệ Ban quản lý Rừng U Minh Hạ để đặt tour đi xuồng và chuẩn bị áo mưa nhẹ.',
      'Mang ủng hoặc giày chống trượt vì nhiều đoạn rừng ngập nước dễ trơn.'
    ]
  }
];

/**
 * Find specific item (place or dish) that user is asking about
 * Uses fuzzy matching with normalized text and character overlap detection
 * @param {object} doc - Province document
 * @param {string} message - User's query message
 * @returns {object|null} - { type: 'place'|'dish', item: object } or null
 */
function findSpecificItem(doc, message = '') {
  if (!doc || !message) return null;
  
  const normMsg = normalize(String(message).toLowerCase());
  const msgWords = normMsg.split(/\s+/).filter(Boolean);
  
  // Check if message contains detail-seeking keywords
  const isDetailQuery = /mo ta|chi tiet|thong tin|gioi thieu|noi ve|la gi|bao gom|dia chi|lich su|kien truc|dac diem|cung cap|hieu biet|tim hieu/.test(normMsg);
  
  if (!isDetailQuery) return null;
  
  /**
   * Fuzzy match scorer: checks word overlap and character similarity
   * Returns match score (0-1), where 1 is perfect match
   */
  const fuzzyScore = (itemNorm, msgNorm, msgWordsArr) => {
    // Direct substring match
    if (msgNorm.includes(itemNorm)) return 1.0;
    if (itemNorm.includes(msgNorm) && msgNorm.length > 3) return 0.9;
    
    const itemWords = itemNorm.split(/\s+/).filter(Boolean);
    if (itemWords.length === 0) return 0;
    
    // Word overlap ratio
    const matchedWords = itemWords.filter(w => msgWordsArr.some(mw => mw.includes(w) || w.includes(mw)));
    const wordRatio = matchedWords.length / itemWords.length;
    
    // Character overlap for single-word items
    if (itemWords.length === 1) {
      const itemChars = new Set(itemNorm.split(''));
      const msgChars = new Set(msgNorm.split(''));
      const intersection = [...itemChars].filter(c => msgChars.has(c)).length;
      const charRatio = intersection / itemChars.size;
      return Math.max(wordRatio, charRatio);
    }
    
    return wordRatio;
  };
  
  // Search in places
  const places = Array.isArray(doc.places) ? doc.places : [];
  let bestMatch = null;
  let bestScore = 0.5; // Minimum threshold
  
  for (const place of places) {
    if (!place || !place.name) continue;
    const itemNorm = normalize(String(place.name).toLowerCase());
    const score = fuzzyScore(itemNorm, normMsg, msgWords);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { type: 'place', item: place, score };
    }
  }
  
  // Search in dishes
  const dishes = Array.isArray(doc.dishes) ? doc.dishes : [];
  for (const dish of dishes) {
    if (!dish || !dish.name) continue;
    const itemNorm = normalize(String(dish.name).toLowerCase());
    const score = fuzzyScore(itemNorm, normMsg, msgWords);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { type: 'dish', item: dish, score };
    }
  }
  
  if (bestMatch) {
    console.log(`[findSpecificItem] Found ${bestMatch.type}:`, bestMatch.item.name, `(score: ${bestMatch.score.toFixed(2)})`);
    return bestMatch;
  }
  
  return null;
}

function projectDocItems(list = [], mapper = () => null, limit = 5) {
  return (list || [])
    .filter(x => x && x.name)
    .slice(0, limit)
    .map(base => mapper({ base }))
    .filter(Boolean);
}

function alignWithDoc(payload, doc) {
  if (!doc || !doc.name) return payload;
  const limit = 5;
  const docPlaces = Array.isArray(doc.places) ? doc.places : [];
  const docDishes = Array.isArray(doc.dishes) ? doc.dishes : [];
  const docTips = Array.isArray(doc.tips) ? doc.tips : [];

  const placeMap = new Map(docPlaces.map(p => [normKey(p.name), p]));
  const dishMap = new Map(docDishes.map(d => [normKey(d.name), d]));

  const pickPlace = ({ item = {}, base }) => ({
    name: base.name,
    hint: item.hint || base.hint || base.description || ''
  });
  const pickDish = ({ item = {}, base }) => ({
    name: base.name,
    where: item.where || base.where || base.location || ''
  });

  const filteredPlaces = (payload.places || [])
    .map(item => {
      const base = placeMap.get(normKey(item?.name));
      if (!base) return null;
      return pickPlace({ item, base });
    })
    .filter(Boolean)
    .slice(0, limit);
  const filteredDishes = (payload.dishes || [])
    .map(item => {
      const base = dishMap.get(normKey(item?.name));
      if (!base) return null;
      return pickDish({ item, base });
    })
    .filter(Boolean)
    .slice(0, limit);

  const fallbackPlaces = !filteredPlaces.length && placeMap.size
    ? projectDocItems(docPlaces, ({ base }) => pickPlace({ base }), limit)
    : filteredPlaces;
  const fallbackDishes = !filteredDishes.length && dishMap.size
    ? projectDocItems(docDishes, ({ base }) => pickDish({ base }), limit)
    : filteredDishes;

  const tips = payload.tips && payload.tips.length
    ? payload.tips
    : docTips.slice(0, limit);

  return {
    ...payload,
    places: fallbackPlaces,
    dishes: fallbackDishes,
    tips,
    province: doc.name
  };
}

/* ========== NoSQL (địa danh/món ăn) – logic cũ, giữ nguyên ========== */

/**
 * Compose detailed response for specific item (place or dish) - Anti-Hallucination Mode
 * Injects hardcoded POI_RULES knowledge as ground truth to prevent fabrication
 * @param {object} doc - Province document
 * @param {object} targetItem - Specific place/dish to describe
 * @param {string} type - 'place' or 'dish'
 * @param {string} intent - User intent
 * @returns {Promise<object>} - Composed payload with single item focus
 */
async function composeSpecificItem({ doc, targetItem, type, intent }) {
  const itemName = targetItem.name || 'Unknown';
  const provinceName = doc.name || 'Unknown';
  
  // KNOWLEDGE INJECTION: Check POI_RULES for verified ground truth
  let groundTruth = null;
  const itemNormalized = normalize(itemName);
  
  for (const rule of POI_RULES) {
    if (!rule.alias) continue;
    
    // Test against both original name and normalized version
    if (rule.alias.test(itemName) || rule.alias.test(itemNormalized)) {
      groundTruth = rule;
      console.log('[composeSpecificItem] Ground truth found for:', itemName);
      break;
    }
  }
  
  // Build knowledge injection block
  let knowledgeBlock = '';
  if (groundTruth) {
    knowledgeBlock = `\n=== GROUND TRUTH (USE THIS FIRST) ===\n`;
    knowledgeBlock += `Item: ${groundTruth.poi || itemName}\n`;
    knowledgeBlock += `Verified Info: ${groundTruth.info || 'N/A'}\n`;
    
    if (groundTruth.cityActual) {
      knowledgeBlock += `Actual Province: ${groundTruth.cityActual}\n`;
    }
    
    if (groundTruth.type === 'misinfo') {
      knowledgeBlock += `Warning: This is misinformation. `;
      if (Array.isArray(groundTruth.replacements) && groundTruth.replacements.length) {
        knowledgeBlock += `Suggest these alternatives instead:\n`;
        groundTruth.replacements.forEach(r => {
          knowledgeBlock += `  - ${r.name}: ${r.hint || ''}\n`;
        });
      }
    }
    
    if (groundTruth.alt && groundTruth.alt.city !== provinceName) {
      knowledgeBlock += `Note: User asked about ${provinceName}, but ${groundTruth.poi} is in ${groundTruth.cityActual}. `;
      knowledgeBlock += `Alternative in ${provinceName}: ${groundTruth.alt.suggestion || 'N/A'}\n`;
    }
    
    knowledgeBlock += `===================================\n`;
  }
  
  let prompt = '';
  
  if (type === 'place') {
    prompt = `
You are a LOCAL EXPERT GUIDE specializing in ${provinceName}. A tourist is asking specifically about "${itemName}".
${knowledgeBlock}
Return JSON following this schema:
{
  "summary": string,
  "places": [{ "name": string, "hint": string }],
  "dishes": [],
  "tips": string[],
  "source": "nosql+llm"
}

MANDATORY REQUIREMENTS:

1. SINGLE ITEM FOCUS:
   - Describe ONLY "${itemName}". DO NOT list other places.
   - If Ground Truth shows this is misinformation or wrong province, explain that clearly.

2. "summary" (3-4 detailed sentences):
   - Historical background / Origin story (if known with certainty).
   - Architectural features / Visual characteristics.
   - EXACT address (street, district) if you know it reliably.
   - If uncertain about address: say "Located in [general area name]" or "Contact ${provinceName} tourist center for directions".
   - If Ground Truth exists, prioritize that information.

3. "places" array:
   - Contains EXACTLY 1 element: { "name": "${itemName}", "hint": "..." }
   - "hint" must be 15-20 words describing unique features (architecture/history/activities).
   - GOOD EXAMPLE: "Gothic cathedral built 1863-1880, red bricks imported from Marseille, 58m bell towers, crowned with Virgin Mary statue"
   - BAD EXAMPLE: "Famous place in Saigon" (too generic)

4. "dishes": Always return empty array [].

5. "tips": 2-3 PRACTICAL tips:
   - Opening hours (if known).
   - Transportation / Parking advice.
   - Dress code (if religious site).
   - If Ground Truth provides tips, include those.

6. ANTI-HALLUCINATION RULES:
   - Use ONLY information you are CERTAIN about.
   - If Ground Truth contradicts your knowledge, TRUST Ground Truth.
   - DO NOT fabricate phone numbers, emails, or websites.
   - If address is unknown, admit it and guide to general area.

(Original intent: ${intent})
`;
  } else if (type === 'dish') {
    prompt = `
You are a LOCAL CULINARY EXPERT specializing in ${provinceName} cuisine. A foodie is asking specifically about "${itemName}".
${knowledgeBlock}
Return JSON following this schema:
{
  "summary": string,
  "places": [],
  "dishes": [{ "name": string, "where": string }],
  "tips": string[],
  "source": "nosql+llm"
}

MANDATORY REQUIREMENTS:

1. SINGLE ITEM FOCUS:
   - Describe ONLY "${itemName}". DO NOT list other dishes.

2. "summary" (3-4 detailed sentences):
   - Main ingredients.
   - Characteristic flavors (sour/sweet/salty/spicy).
   - Special cooking method (if any).
   - Origin story / Cultural significance (if known with certainty).
   - If Ground Truth exists, prioritize that information.

3. "dishes" array:
   - Contains EXACTLY 1 element: { "name": "${itemName}", "where": "..." }
   - "where" must be 15-20 words suggesting SPECIFIC RESTAURANTS or FAMOUS AREAS:
   - GOOD EXAMPLE: "Com Tam Suon Bi Cha Saigon restaurant (138 Nguyen Van Cu, District 1) or Ben Thanh Market area"
   - BAD EXAMPLE: "Many restaurants in Saigon" (not helpful)
   - If you don't know specific restaurants, suggest general area: "Near [market name] / Along [street name]"

4. "places": Always return empty array [].

5. "tips": 2-3 PRACTICAL tips:
   - How to eat it properly (local style).
   - Price range (approximate, not exact).
   - Best time to eat (breakfast/lunch/dinner).
   - If Ground Truth provides tips, include those.

6. ANTI-HALLUCINATION RULES:
   - If you don't know famous restaurants, suggest general area only.
   - DO NOT fabricate restaurant names.
   - If Ground Truth exists, TRUST it over your general knowledge.

(Original intent: ${intent})
`;
  }
  
  try {
    const raw = await generateJSON({ prompt, temperature: 0.2 });
    const safe = validateResponse(raw, doc);
    
    // Ensure single item in response
    const result = {
      summary: safe.summary || `Detailed information about ${itemName}.`,
      places: type === 'place' ? (safe.places || []).slice(0, 1) : [],
      dishes: type === 'dish' ? (safe.dishes || []).slice(0, 1) : [],
      tips: Array.isArray(safe.tips) ? safe.tips.slice(0, 5) : [],
      promotions: [],
      hotels: [],
      source: 'nosql+llm-specific'
    };
    
    console.log('[composeSpecificItem] Generated detailed response for:', itemName);
    return sanitizePayload(result);
    
  } catch (error) {
    console.error('[composeSpecificItem] Error:', error.message);
    
    // Fallback: return basic info from doc
    const fallback = {
      summary: `Information about ${itemName} in ${provinceName}.`,
      places: type === 'place' ? [{ name: itemName, hint: targetItem.hint || targetItem.description || '' }] : [],
      dishes: type === 'dish' ? [{ name: itemName, where: targetItem.where || targetItem.location || '' }] : [],
      tips: ['Check with local tourist office for more details'],
      promotions: [],
      hotels: [],
      source: 'fallback-specific'
    };
    
    return sanitizePayload(fallback);
  }
}

function factsToPrompt({ doc, intent }) {
  const places = (doc.places || []).map(p => `- ${p.name}`).join('\n') || '-';
  const dishes = (doc.dishes || []).map(d => `- ${d.name}`).join('\n') || '-';
  const mergedFrom = Array.isArray(doc.merged_from) ? doc.merged_from.filter(x => x && x !== doc.name) : [];
  const mergedNote = mergedFrom.length
    ? `Lưu ý: dữ liệu tham khảo được gộp từ ${[doc.name, ...mergedFrom].join(', ')} nên có thể xuất hiện địa danh ngoài phạm vi ${doc.name}.\n`
    : '';
  const neighborList = mergedFrom.length ? mergedFrom.join(', ') : 'các tỉnh/thành lân cận';

  return `
Bạn là trợ lý du lịch tiếng Việt chuyên nghiệp. CHỈ dùng dữ kiện có sẵn, KHÔNG bịa tên mới.
${mergedNote}Trả về duy nhất một JSON theo schema:
{
  "province": string,
  "places": [{ "name": string, "hint": string }],
  "dishes": [{ "name": string, "where": string }],
  "tips": string[],
  "source": "nosql+llm"
}

Tỉnh: ${doc.name}
Địa danh:
${places}
Món ăn:
${dishes}

YÊU CẦU BẮT BUỘC VỀ NỘI DUNG:

1. DANH SÁCH:
   - Luôn trả cả hai danh sách "places" và "dishes" (tối đa 5–7 mỗi loại).
   - Không thêm tên mới ngoài danh sách đã cho.
   - Nếu một danh sách không có dữ liệu thì trả mảng rỗng [].

2. CHẤT LƯỢNG "HINT" CHO ĐỊA DANH:
   - MỖI địa danh PHẢI có "hint" dài 10-15 từ.
   - "hint" PHẢI mô tả ĐẶC ĐIỂM CỤ THỂ: hương vị/kiến trúc/lịch sử/cảnh quan/hoạt động.
   - TUYỆT ĐỐI KHÔNG chỉ viết "nằm ở [Tên Tỉnh]" hay "thuộc [Địa điểm]". 
   - KHÔNG lặp lại tên địa danh trong hint.
   - Ví dụ TỐT: "Núi lửa cổ với hồ nước ngọt xanh biếc, trekking ngắm hoàng hôn tuyệt đẹp"
   - Ví dụ XẤU: "Nằm trong khu du lịch Sa Pa" (quá chung chung, không mô tả gì)

3. CHẤT LƯỢNG "WHERE" CHO MÓN ĂN:
   - MỖI món ăn PHẢI có "where" dài 10-15 từ.
   - "where" PHẢI gợi ý ĐỊA CHỈ CỤ THỂ: tên quán/chợ/khu vực/đường phố.
   - Nếu biết tên quán nổi tiếng, PHẢI ghi rõ (vd: "Quán Cơm Gà Hội An - 08 Trần Cao Vân").
   - Nếu không biết quán cụ thể, gợi ý khu vực (vd: "Các quán quanh chợ Đà Lạt hoặc đường Nguyễn Thị Minh Khai").
   - Ví dụ TỐT: "Quán Cơm Hến Bà Hoa (17 Nguyễn Huệ) hoặc khu Đông Ba, Huế"
   - Ví dụ XẤU: "Có nhiều quán" (không hữu ích)

4. KIỂM SOÁT ĐỊA LÝ:
   - KHÔNG được nhắc tới địa danh/món ăn thuộc tỉnh/thành khác ngoài ${doc.name}.
   - Nếu danh sách gốc có địa danh thuộc ${neighborList}, phải tự hỏi "địa danh này có thực sự thuộc ${doc.name} không?" Nếu không chắc, loại bỏ nó.

(intent gốc: ${intent})
`;
}

function fallbackFromDoc(doc, intent) {
  const pick = (arr) => Array.isArray(arr) ? arr.slice(0, 7) : [];
  return {
    province: doc.name,
    // Luôn trả cả hai thay vì lọc theo intent, giữ hint/where nếu có
    places: pick(doc.places).map(x => ({ 
      name: x.name, 
      hint: x.hint || x.description || '' 
    })),
    dishes: pick(doc.dishes).map(x => ({ 
      name: x.name,
      where: x.where || x.location || ''
    })),
    tips: doc.tips || [],
    source: 'fallback',
  };
}

/* ========== Helpers cho SQL ========== */

function normRow(x, tag = '') {
  if (!x || typeof x !== 'object') return null;

  const name =
    x.name || x.title || x.promotion_name || x.hotel_name ||
    x.code || x.place || x.dish || x.city || x.id || null;
  if (!name) return null;

  // Chuẩn hoá các field FE đang render
  const discount_value =
    x.discount_value ?? x.discount_percent ?? x.discount ?? x.percent ?? x.amount_off ?? x.value ?? null;

  // FE dùng "valid_from" & "valid_until"
  const valid_from = x.valid_from ?? x.start_date ?? x.from ?? x.begin_at ?? null;
  const valid_until = x.valid_until ?? x.valid_to ?? x.end_date ?? x.to ?? x.expire_at ?? null;

  const city = x.city ?? x.province ?? x.location ?? null;

  return {
    ...x,
    name,
    discount_value,
    valid_from,
    valid_until,
    city,
    _tag: tag
  };
}

function normRows(rows, tag = '') {
  if (!Array.isArray(rows)) return [];
  return rows.map(r => normRow(r, tag)).filter(Boolean);
}

function detectSqlMode(sql = []) {
  const anyPromo = sql.some(ds =>
    /promo|promotion/i.test(ds?.tag || ds?.name || '') ||
    (ds?.rows || []).some(r => 'code' in r || 'promotion_name' in r || 'discount_value' in r)
  );
  if (anyPromo) return 'promotions';

  const anyHotel = sql.some(ds =>
    /hotel/i.test(ds?.tag || ds?.name || '') ||
    (ds?.rows || []).some(r => 'hotel_name' in r || 'star_rating' in r)
  );
  if (anyHotel) return 'hotels';

  return 'generic';
}

// ==== DEDUPE HELPERS (ADDED) ====
const uniqBy = (arr, keyFn) => {
  const seen = new Set();
  return (arr || []).filter(x => {
    try {
      const k = keyFn(x);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    } catch {
      return false;
    }
  });
};
const normKey = v => normalize(String(v || ''));

/* ========== COMPOSE (hợp nhất NoSQL + SQL) ========== */

async function compose({ doc, sql = [], nlu = {}, filters = {}, user_ctx = {}, intent }) {
  const key = makeKey({
    doc_key: doc?.name || doc?.province || 'no-doc',
    sql_tags: (sql || []).map(ds => ds?.tag || ds?.name).join('|') || 'no-sql',
    intent: intent || nlu?.intent || 'generic',
    city: nlu?.city || user_ctx?.city || '',
    filters, user_ctx
  });
  const cached = cache.get(key);
  if (cached) return cached;

  // 1) SQL datasets
  if (Array.isArray(sql) && sql.length > 0) {
    const mode = detectSqlMode(sql);
    const topN = Number.isFinite(user_ctx?.top_n) ? user_ctx.top_n : 10;

    // Gộp + chuẩn hoá
    let items = [];
    for (const ds of sql) {
      const tag = ds?.name || ds?.tag || 'dataset';
      const rows = normRows(ds?.rows || [], tag);
      items.push(...rows);
    }

    // Dedupe theo mode
    if (mode === 'promotions') {
      items = uniqBy(items, r => r.code ? normKey(r.code) : `${normKey(r.name)}|${normKey(r.city)}`);
    } else if (mode === 'hotels') {
      items = uniqBy(items, r => r.hotel_id ? normKey(r.hotel_id) : normKey(r.name));
    } else {
      items = uniqBy(items, r => normKey(r.name));
    }

    const pick = items.slice(0, topN);

    let out;
    if (mode === 'promotions') {
      const promos = pick.map(p => ({
        promotion_id: p.promotion_id ?? p.id,
        name: p.name,
        code: p.code ?? null,
        discount_value: p.discount_value ?? null,
        valid_from: p.valid_from ?? null,
        valid_until: p.valid_until ?? null,
        city: p.city ?? null,
        description: p.description ?? p.note ?? null,
        _tag: p._tag
      }));
      out = {
        summary: `Tìm thấy ${items.length} khuyến mãi, hiển thị ${promos.length} ưu đãi tiêu biểu.`,
        promotions: promos,
        hotels: [],
        places: [],
        dishes: [],
        tips: [],
        source: 'sql+nosql+llm'
      };
    } else if (mode === 'hotels') {
      const hotels = pick.map(h => ({
        hotel_id: h.hotel_id ?? h.id,
        name: h.name,
        address: h.address ?? null,
        star_rating: h.star_rating ?? h.stars ?? null,
        average_rating: h.average_rating ?? null,
        amenities: h.amenities ?? null,
        phone_number: h.phone_number ?? null,
        _tag: h._tag
      }));
      out = {
        summary: `Gợi ý ${hotels.length} khách sạn.`,
        hotels,
        promotions: [],
        places: [],
        dishes: [],
        tips: [],
        source: 'sql+nosql+llm'
      };
    } else {
      out = {
        summary: `Tìm thấy ${pick.length} kết quả.`,
        data: { items: pick },
        promotions: [],
        hotels: [],
        places: [],
        dishes: [],
        tips: [],
        source: 'sql+nosql+llm'
      };
    }

    cache.set(key, out);
    return out;
  }

  // 2) NoSQL
  if (!doc || !doc.name) {
    const cityHint = nlu?.city || user_ctx?.city || filters?.city || null;
    const generic = await composeCityFallback({
      city: cityHint,
      intent: intent || nlu?.intent || 'generic',
      message: nlu?.normalized || '',
      history: user_ctx?.history || []
    }).catch(() => null);
    const fb = generic || { summary: 'Chưa đủ dữ kiện để trả lời.', sections: [], promotions: [], hotels: [], places: [], dishes: [], tips: [], source: 'nosql+llm' };
    cache.set(key, fb);
    return fb;
  }

  try {
    // SPECIFIC ITEM FOCUS MODE: Check if user asks about a specific place/dish
    const userMessage = nlu?.normalized || user_ctx?.message || '';
    const specificItem = findSpecificItem(doc, userMessage);
    
    if (specificItem) {
      console.log('[compose] ✓ SPECIFIC ITEM MODE:', specificItem.type, specificItem.item.name, `(confidence: ${specificItem.score?.toFixed(2) || 'N/A'})`);
      
      // Use dedicated composeSpecificItem function for focused, anti-hallucination response
      const result = await composeSpecificItem({
        doc,
        targetItem: specificItem.item,
        type: specificItem.type,
        intent: intent || nlu?.intent || 'generic'
      });
      
      cache.set(key, result);
      return result;
    }
    
    // GENERIC LIST MODE: Return multiple items
    console.log('[compose] → GENERIC LIST MODE');
    const prompt = factsToPrompt({ doc, intent: intent || nlu?.intent || 'generic' });
    const raw = await generateJSON({ prompt, temperature: 0.2 });
    const safe = validateResponse(raw, doc);

    const pickSlice = (arr, n = 7) => (Array.isArray(arr) ? arr.slice(0, n) : []);
    
    // Ưu tiên kết quả từ LLM (có hint/where), nếu không có thì lấy từ doc (chỉ có name)
    let places = (safe.places && safe.places.length)
      ? safe.places
      : pickSlice(doc.places || [], 7).map(x => ({ 
          name: x.name, 
          hint: x.hint || x.description || '' // Giữ hint nếu có trong doc
        }));
    let dishes = (safe.dishes && safe.dishes.length)
      ? safe.dishes
      : pickSlice(doc.dishes || [], 7).map(x => ({ 
          name: x.name,
          where: x.where || x.location || '' // Giữ where nếu có trong doc
        }));
    let tips = (safe.tips && safe.tips.length) ? safe.tips : (doc.tips || []);

    // Dedupe NoSQL
    places = uniqBy(places, x => normKey(x.name));
    dishes = uniqBy(dishes, x => normKey(x.name));
    tips = uniqBy(tips, x => (typeof x === 'string' ? normKey(x) : normKey(x.name || x.hint || JSON.stringify(x))));

    const emptyBoth = places.length === 0 && dishes.length === 0;

    const out = emptyBoth
      ? {
          summary: `Chưa có dữ liệu địa danh/món ăn cho “${doc.name}”.`,
          promotions: [], hotels: [], places: [], dishes: [], tips,
          source: 'nosql+llm'
        }
      : {
          promotions: [], hotels: [], places, dishes, tips,
          source: 'nosql+llm'
        };

    cache.set(key, out);
    return out;
  } catch {
    const fb0 = fallbackFromDoc(doc, intent || nlu?.intent || 'generic');
    const places = uniqBy(fb0.places, x => normKey(x.name));
    const dishes = uniqBy(fb0.dishes, x => normKey(x.name));
    const tips = uniqBy(fb0.tips, x => (typeof x === 'string' ? normKey(x) : normKey(x.name || JSON.stringify(x))));
    const out = { promotions: [], hotels: [], places, dishes, tips, source: 'nosql+llm' };
    cache.set(key, out);
    return out;
  }
}

/* ========== Small talk / chitchat fallback (không cần doc/whitelist) ========== */

async function composeSmallTalk({ message = '', nlu = {}, history = [] }) {
  const historyLines = Array.isArray(history)
    ? history
        .map(h => `Q: ${h?.message?.text || ''}\nA: ${h?.reply?.text || ''}`.trim())
        .filter(Boolean)
        .reverse() // gần nhất trước
        .slice(0, 5)
    : [];
  const histBlock = historyLines.length
    ? `Ngữ cảnh trước đó (gần nhất trước):\n${historyLines.join('\n')}\n\n`
    : '';

  const prompt = `
Bạn là trợ lý du lịch thân thiện. Người dùng hỏi chung (có thể không liên quan dữ liệu nội bộ): "${message}".
${histBlock}Hãy trả lời ngắn gọn 2-4 câu, tự nhiên như người thật, không viện dẫn nguồn, không nói "thiếu dữ liệu".
Nếu câu hỏi gợi ý đi chơi/du lịch mà không có địa điểm cụ thể, hãy gợi ý các lựa chọn phổ biến (biển, núi, nghỉ dưỡng gần) mang tính an toàn.
Trả về JSON:
{
  "summary": string,
  "tips": string[]
}
`;

  try {
    const resp = await generateJSON({ prompt, temperature: 0.3 });
    const summary = typeof resp?.summary === 'string' && resp.summary.trim().length
      ? resp.summary.trim()
      : 'Mình đã ghi nhận câu hỏi và gợi ý chung nhé.';
    const tips = Array.isArray(resp?.tips) ? resp.tips.filter(Boolean).slice(0, 5) : [];
    return {
      summary,
      tips,
      promotions: [],
      hotels: [],
      places: [],
      dishes: [],
      source: 'llm-chitchat'
    };
  } catch (e) {
    return {
      summary: 'Mình đã ghi nhận, dưới đây là vài gợi ý chung để bạn tham khảo.',
      tips: ['Thử chọn một điểm đến gần để tiết kiệm thời gian di chuyển', 'Mang theo áo mưa/ô gấp phòng trường hợp thời tiết thay đổi'],
      promotions: [],
      hotels: [],
      places: [],
      dishes: [],
      source: 'llm-chitchat'
    };
  }
}

module.exports = { compose, composeSmallTalk, fallbackFromDoc, composeCityFallback };

/* ========== Generic city fallback khi không có dữ liệu NoSQL (không whitelist) ========== */
async function composeCityFallback({ city, intent = 'generic', message = '', history = [], month = null, doc = null }) {
  const normMsg = normalize(String(message || ''));
  const inferredCity = city || inferCityFromMessage(normMsg);
  const cityText = inferredCity ? `cho địa điểm: ${inferredCity}` : 'không chỉ rõ địa điểm';
  const cityStrict = inferredCity || city || 'địa điểm người dùng nêu';
  const weatherMode = /thoi tiet|thời tiết|troi|du bao/.test(normMsg);
  const overrideMonthNote = cityMonthContext(inferredCity || city, month);
  const monthNote = overrideMonthNote || monthContext(month);
  const histPayload = payloadFromHistory(history);

  // Nếu user follow-up về một địa danh đã gợi ý trong payload trước
  if (histPayload && Array.isArray(histPayload.places)) {
    const found = histPayload.places.find(p => {
      const n = normalize(p?.name || '');
      return n && normMsg.includes(n);
    });
    if (found) {
      const addrNote = /dia chi|địa chỉ/i.test(message) && !found.address
        ? `Chưa có địa chỉ chi tiết, bạn có thể hỏi quầy du lịch địa phương tại ${inferredCity || city || 'địa phương'} hoặc tra cứu trên bản đồ.`
        : '';
      const activityNote = /hoạt động|activity|làm gì|chơi gì|tham quan/i.test(message)
        ? 'Hoạt động gợi ý: tham quan, chụp ảnh, nghe thuyết minh lịch sử, thử ẩm thực địa phương.'
        : '';
      const annualNote = /thường niên|lễ hội|festival|sự kiện/i.test(message)
        ? 'Sự kiện: kiểm tra lịch lễ hội/liveshow tại điểm tham quan hoặc trang văn hóa địa phương (nếu có).'
        : '';
      const hint = [found.hint || found.description || '', found.address || found.where || '', addrNote, activityNote, annualNote]
        .map(s => (s || '').trim())
        .filter(Boolean)
        .join(' \n ');
      return sanitizePayload({
        summary: hint || `Thông tin về ${found.name}`,
        places: [{ name: found.name, hint }],
        dishes: [], tips: ['Kiểm tra giờ mở cửa và đường đi trước khi đến', addrNote].filter(Boolean), promotions: [], hotels: [],
        source: histPayload.source || 'nosql+llm'
      });
    }
  }

  // Nếu user hỏi 1 địa danh cụ thể đã biết
  for (const rule of POI_RULES) {
    if (!rule.alias.test(message)) continue;

    if (rule.type === 'misinfo') {
      const replacements = Array.isArray(rule.replacements) ? rule.replacements : [];
      const tips = Array.isArray(rule.tips) && rule.tips.length
        ? rule.tips
        : ['Kiểm tra lại tên địa điểm trên bản đồ chính thống trước khi đặt tour.'];
      return sanitizePayload({
        summary: rule.info || `Chưa có thông tin chính thống về ${rule.poi}.`,
        places: replacements,
        dishes: [],
        tips,
        promotions: [], hotels: [],
        source: 'llm-generic'
      });
    }

    if (inferredCity && rule.cityActual !== inferredCity && rule.alt && rule.alt.city === inferredCity) {
      return sanitizePayload({
        summary: `${rule.poi} nằm ở ${rule.cityActual}, không thuộc ${inferredCity}. ${rule.info || ''}`.trim(),
        places: [{ name: rule.alt.suggestion || rule.info || rule.poi }],
        dishes: [],
        tips: ['Bạn có thể ghé đúng địa danh thay thế trong tỉnh: ' + (rule.alt.suggestion || '')],
        promotions: [], hotels: [],
        source: 'llm-generic'
      });
    }
    return sanitizePayload({
      summary: `${rule.poi}: ${rule.info || ''}`.trim(),
      places: [{ name: rule.poi, hint: rule.info || '' }],
      dishes: [],
      tips: ['Kiểm tra giờ mở cửa trước khi đi', 'Mang áo mưa/ô nếu thời tiết xấu'],
      promotions: [], hotels: [],
      source: 'llm-generic'
    });
  }
  const historyLines = Array.isArray(history)
    ? history
        .map(h => `Q: ${h?.message?.text || ''}\nA: ${h?.reply?.text || ''}`.trim())
        .filter(Boolean)
        .reverse()
        .slice(0, 3)
    : [];
  const histBlock = historyLines.length
    ? `Ngữ cảnh trước đó:\n${historyLines.join('\n')}\n\n`
    : '';
  const prompt = `
Bạn là trợ lý du lịch chuyên nghiệp, nhiệt tình, và hiểu biết sâu về các tỉnh thành Việt Nam.
${histBlock}Câu hỏi người dùng: "${message}" ${cityText}.
${monthNote}

Bạn KHÔNG CÓ dữ liệu nội bộ chi tiết về ${cityStrict}, nhưng hãy dựa vào kiến thức CHẮC CHẮN của bạn để trả lời.

TRẢ VỀ JSON DUY NHẤT (schema):
{
  "summary": string,
  "places": [{ "name": string, "hint": string }],
  "dishes": [{ "name": string, "where": string }],
  "tips": string[],
  "province": string
}

YÊU CẦU BẮT BUỘC:

1. KIỂM SOÁT ĐỊA LÝ NGHIÊM NGẶT:
   - CHỈ gợi ý địa danh/món ăn thuộc ĐÚNG ${cityStrict}.
   - TUYỆT ĐỐI KHÔNG gợi ý địa điểm từ tỉnh khác (ví dụ: KHÔNG gợi ý "Hồ Dầu Tiếng" (Bình Dương) cho "Đắk Lắk").
   - Nếu bạn KHÔNG CHẮC CHẮN một địa danh thuộc ${cityStrict}, HÃY BỎ QUA địa danh đó.
   - Nếu không có kiến thức chắc chắn về ${cityStrict}, trả danh sách rỗng [] thay vì bịa.

2. CHẤT LƯỢNG NỘI DUNG:
   - "summary": 2-3 câu, giọng văn thân thiện, mang tính an toàn.
   - "hint": 10-15 từ mô tả ĐỘC ĐÁO (kiến trúc/cảnh quan/hoạt động/lịch sử), KHÔNG chỉ viết "nằm ở [tên tỉnh]".
   - "where": 10-15 từ gợi ý ĐỊA CHỈ/KHU VỰC cụ thể nếu biết (tên quán/chợ/đường phố), hoặc "khu vực trung tâm" nếu không chắc.
   - "tips": Lời khuyên thực tế về thời điểm/chuẩn bị/an toàn.

3. KIỂM TRA TRƯỚC KHI TRẢ LỜI:
   - Với MỖI địa danh/món ăn bạn định gợi ý, tự hỏi: "Tôi có CHẮC CHẮN 100% rằng [tên này] thuộc ${cityStrict} không?"
   - Nếu câu trả lời là "Không chắc" hoặc "Có thể thuộc tỉnh khác" → BỎ QUA địa danh đó.

4. XỬ LÝ THỜI TIẾT (nếu intent=ask_weather):
   - Nếu có ghi chú đặc biệt: ${overrideMonthNote || 'không có ghi chú'}
   - Mô tả cảm tính "ấm áp/mát mẻ", KHÔNG bịa số °C cụ thể.
   - Nếu user nêu tháng ${month ?? 'không rõ'}, mô tả mùa đúng (tháng 11 ≠ mùa hè).

5. "province" gán bằng "${cityStrict}".

(intent: ${intent}, weatherMode: ${weatherMode}, inferred city: ${inferredCity || 'N/A'})
`;

  try {
    const raw = await generateJSON({ prompt, temperature: 0.35 });
    let out = {
      summary: raw?.summary || `Gợi ý du lịch phổ biến ${city || ''}`.trim(),
      places: Array.isArray(raw?.places) ? raw.places.slice(0, 5) : [],
      dishes: Array.isArray(raw?.dishes) ? raw.dishes.slice(0, 5) : [],
      tips: Array.isArray(raw?.tips) ? raw.tips.slice(0, 5) : [],
      promotions: [], hotels: [],
      source: 'llm-generic'
    };
    out = sanitizePayload(out);
    if (doc && doc.name) {
      out = alignWithDoc(out, doc);
    }
    return out;
  } catch {
    return {
      summary: city ? `Gợi ý chung cho ${city}` : 'Gợi ý du lịch chung',
      places: [], dishes: [], tips: [], promotions: [], hotels: [],
      source: 'llm-generic'
    };
  }
}
