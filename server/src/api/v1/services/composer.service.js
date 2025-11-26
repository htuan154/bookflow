'use strict';

const { generateJSON } = require('../../../config/ollama');
const { validateResponse } = require('./guardrails.service');
const { cache, makeKey } = require('../../../config/cache');
const { normalize } = require('./nlu.service');

// ===== Text sanitization helpers =====
const CJK_REGEX = /[\u3400-\u9fff]/g;
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

// === BƯỚC 1: XÓA HARDCODE (Chỉ giữ lại Misinfo Rules để bảo vệ logic) ===
const POI_RULES = [
  // Đã xóa hardcode Nhà thờ Đức Bà, Miếu Bà Chúa Xứ... để AI tự suy nghĩ.
  
  // Giữ lại Rule chặn tin giả (Misinfo) - Đây là logic bảo vệ, không phải nội dung cứng
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

function findSpecificItem(doc, message = '') {
  if (!doc || !message) return null;
  
  const normMsg = normalize(String(message).toLowerCase());
  const msgWords = normMsg.split(/\s+/).filter(Boolean);
  
  // FIX: Thêm từ khóa 'review', 'ngon', 'tot', 'dep', 'danh gia', 'the nao'
  const isDetailQuery = /mo ta|chi tiet|thong tin|gioi thieu|noi ve|la gi|bao gom|dia chi|lich su|kien truc|dac diem|cung cap|hieu biet|tim hieu|review|danh gia|ngon|tot|dep|hay|the nao|ra sao|co khong/.test(normMsg);
  
  if (!isDetailQuery) return null;
  
  const fuzzyScore = (itemNorm, msgNorm, msgWordsArr) => {
    // Ưu tiên khớp chính xác cụm từ
    if (msgNorm.includes(itemNorm)) return 1.0;
    if (itemNorm.includes(msgNorm) && msgNorm.length > 3) return 0.9;
    
    const itemWords = itemNorm.split(/\s+/).filter(Boolean);
    if (itemWords.length === 0) return 0;
    
    const matchedWords = itemWords.filter(w => msgWordsArr.some(mw => mw.includes(w) || w.includes(mw)));
    const wordRatio = matchedWords.length / itemWords.length;
    
    if (itemWords.length === 1) {
      const itemChars = new Set(itemNorm.split(''));
      const msgChars = new Set(msgNorm.split(''));
      const intersection = [...itemChars].filter(c => msgChars.has(c)).length;
      const charRatio = intersection / itemChars.size;
      return Math.max(wordRatio, charRatio);
    }
    
    return wordRatio;
  };
  
  const places = Array.isArray(doc.places) ? doc.places : [];
  let bestMatch = null;
  let bestScore = 0.4; // Ngưỡng tối thiểu
  
  for (const place of places) {
    if (!place || !place.name) continue;
    const itemNorm = normalize(String(place.name).toLowerCase());
    const score = fuzzyScore(itemNorm, normMsg, msgWords);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { type: 'place', item: place, score };
    }
  }
  
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

// === BƯỚC 2: AI THINKING MODE (Data-Driven Logic) ===
async function composeSpecificItem({ doc, targetItem, type, intent }) {
  const itemName = targetItem.name || 'Địa điểm chưa rõ tên';
  const provinceName = doc.name || 'Địa phương';
  
  // Lấy hint từ DB (nếu có)
  const dbHint = targetItem.hint || targetItem.description || ''; 

  // --- LOGIC XỬ LÝ TỈNH GỘP (DATA DRIVEN) ---
  // Tự động đọc danh sách gộp từ JSON
  const mergedList = doc.merged_from || doc.mergedFrom || []; 
  
  // Nếu có gộp, tạo context đặc biệt cho AI
  const mergedInfo = (mergedList.length > 0) 
      ? `THÔNG TIN CẤU TRÚC DỮ LIỆU: Tỉnh **${provinceName}** trong hệ thống này bao gồm dữ liệu của các khu vực cũ: **${mergedList.join(', ')}**.`
      : '';

  console.log(`[composeSpecificItem] Thinking v4.0: "${itemName}" @ "${provinceName}" (Merged: ${mergedList.join('+')})`);

  // --- TẠO PROMPT ---
  const prompt = `
Bạn là Hướng dẫn viên du lịch địa phương (AI Local Guide) thân thiện, am hiểu.
Nhiệm vụ: Trả lời câu hỏi về "${itemName}" dựa trên dữ liệu và kiến thức của bạn.
LƯU Ý: Tuyệt đối KHÔNG dùng emoji/icon.

BỐI CẢNH DỮ LIỆU:
- Item đang hỏi: "${itemName}"
- Thuộc tệp dữ liệu của tỉnh: ${provinceName}
${mergedInfo}
- Gợi ý từ DB: "${dbHint}"

YÊU CẦU SUY LUẬN & TRẢ LỜI:
1. **Định vị chính xác:** Dựa vào tên "${itemName}", hãy xác định nó thuộc vùng nào trong số các khu vực gộp trên (${[provinceName, ...mergedList].join(', ')}).
   - Ví dụ: Nếu hỏi "Eo Gió" (trong data Gia Lai), bạn phải biết nó nằm ở Quy Nhơn (Bình Định), không phải ở Pleiku.
   
2. **Cách diễn đạt:**
   - Hãy nói rõ vị trí hiện tại. Ví dụ: "Eo Gió là điểm đến nổi tiếng tại Quy Nhơn, hiện thuộc khu vực duyên hải của tỉnh Gia Lai mở rộng."
   - Phong cách: Tự nhiên, đời thường, như bạn bè chat với nhau.

3. **Format JSON trả về (3 phần):**
{
  "summary": "Đoạn văn xuôi 3-4 câu. Bắt đầu bằng lời xác nhận (VD: 'Nhắc đến X là nhắc đến...'). Mô tả vẻ đẹp/hương vị và VỊ TRÍ CHÍNH XÁC. Không gạch đầu dòng.",
  "tips": ["Mẹo 1: Thời gian/Cách di chuyển", "Mẹo 2: Ăn uống/Trang phục"]
}
`;

  try {
    // Gọi LLM
    const raw = await generateJSON({ prompt, temperature: 0.4 }); // Temp thấp để AI tập trung logic

    return sanitizePayload({
      summary: raw.summary || `${itemName} là điểm đến nổi bật thuộc khu vực ${provinceName}.`,
      
      // Highlight item chính
      places: type === 'place' ? [{ name: itemName, hint: "Chi tiết từ AI Local Guide" }] : [],
      dishes: type === 'dish' ? [{ name: itemName, where: "Đặc sản địa phương" }] : [],
      
      tips: Array.isArray(raw.tips) ? raw.tips : [],
      promotions: [],
      hotels: [],
      source: 'nosql+llm-thinking'
    });

  } catch (error) {
    console.error('[composeSpecificItem] Error:', error.message);
    // Fallback
    return sanitizePayload({
      summary: `${itemName} là một địa danh/món ăn nổi tiếng tại ${provinceName}.`,
      places: type === 'place' ? [{ name: itemName, hint: dbHint }] : [],
      dishes: type === 'dish' ? [{ name: itemName, where: 'Tại địa phương' }] : [],
      tips: ['Hệ thống đang bận, vui lòng thử lại sau.'],
      source: 'nosql-fallback'
    });
  }
}

function factsToPrompt({ doc, intent, queryType = 'overview' }) {
  const places = (doc.places || []).map(p => `- ${p.name}`).join('\n') || '-';
  const dishes = (doc.dishes || []).map(d => `- ${d.name}`).join('\n') || '-';
  const mergedFrom = Array.isArray(doc.merged_from) ? doc.merged_from.filter(x => x && x !== doc.name) : [];
  const mergedNote = mergedFrom.length
    ? `Lưu ý: dữ liệu tham khảo được gộp từ ${[doc.name, ...mergedFrom].join(', ')} nên có thể xuất hiện địa danh ngoài phạm vi ${doc.name}.\n`
    : '';
  const neighborList = mergedFrom.length ? mergedFrom.join(', ') : 'các tỉnh/thành lân cận';
  
  let conditionalInstructions = '';
  if (queryType === 'overview') {
    conditionalInstructions = `
5. TÓM TẮT:
   - Viết một đoạn văn ngắn (3-4 câu) giới thiệu chung về ${doc.name}, nhấn mạnh các điểm nổi bật và đặc trưng.
   - Đặt đoạn văn này vào trường "summary".
`;
  } else if (queryType === 'places') {
    conditionalInstructions = `
5. TÓM TẮT:
   - Viết một đoạn văn ngắn (3-4 câu) giới thiệu chung về các địa điểm du lịch nổi bật ở ${doc.name}.
   - Đặt đoạn văn này vào trường "summary".
`;
  } else if (queryType === 'dishes') {
    conditionalInstructions = `
5. TÓM TẮT:
   - Viết một đoạn văn ngắn (3-4 câu) giới thiệu chung về các món ăn đặc sản ở ${doc.name}.
   - Đặt đoạn văn này vào trường "summary".
`;
  }

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
${conditionalInstructions}
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

  const discount_value =
    x.discount_value ?? x.discount_percent ?? x.discount ?? x.percent ?? x.amount_off ?? x.value ?? null;
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

// ==== DEDUPE HELPERS ====
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
  if (user_ctx && user_ctx.forcedItem && doc) {
      console.log('[compose] => Nhận tín hiệu ép buộc (Thinking Mode) cho:', user_ctx.forcedItem.name);
      return await composeSpecificItem({
          doc,
          targetItem: user_ctx.forcedItem,
          type: user_ctx.forcedType || 'place',
          intent: 'ask_details'
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

  // 1) SQL datasets
  if (Array.isArray(sql) && sql.length > 0) {
    const mode = detectSqlMode(sql);
    const topN = Number.isFinite(user_ctx?.top_n) ? user_ctx.top_n : 10;

    let items = [];
    for (const ds of sql) {
      const tag = ds?.name || ds?.tag || 'dataset';
      const rows = normRows(ds?.rows || [], tag);
      items.push(...rows);
    }

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
        hotels: [], places: [], dishes: [], tips: [],
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
        promotions: [], places: [], dishes: [], tips: [],
        source: 'sql+nosql+llm'
      };
    } else {
      out = {
        summary: `Tìm thấy ${pick.length} kết quả.`,
        data: { items: pick },
        promotions: [], hotels: [], places: [], dishes: [], tips: [],
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
    // SPECIFIC ITEM FOCUS MODE
    const userMessage = nlu?.normalized || user_ctx?.message || '';
    const specificItem = findSpecificItem(doc, userMessage);
    
    if (specificItem) {
      console.log('[compose] ✓ SPECIFIC ITEM MODE:', specificItem.type, specificItem.item.name);
      
      const result = await composeSpecificItem({
        doc,
        targetItem: specificItem.item,
        type: specificItem.type,
        intent: intent || nlu?.intent || 'generic'
      });
      
      cache.set(key, result);
      return result;
    }
    
    // GENERIC LIST MODE
    console.log('[compose] → GENERIC LIST MODE');
    
    // Lấy queryType từ NLU để quyết định cách AI trả lời
    const queryType = nlu?.queryType || user_ctx?.queryType || 'overview';
    console.log('[compose] QueryType detected:', queryType);
    
    const prompt = factsToPrompt({ 
      doc, 
      intent: intent || nlu?.intent || 'generic',
      queryType  // Pass queryType vào prompt
    });
    const raw = await generateJSON({ prompt, temperature: 0.2 });
    const safe = validateResponse(raw, doc);

    const pickSlice = (arr, n = 7) => (Array.isArray(arr) ? arr.slice(0, n) : []);
    
    let places = (safe.places && safe.places.length)
      ? safe.places
      : pickSlice(doc.places || [], 7).map(x => ({ 
          name: x.name, 
          hint: x.hint || x.description || '' 
        }));
    let dishes = (safe.dishes && safe.dishes.length)
      ? safe.dishes
      : pickSlice(doc.dishes || [], 7).map(x => ({ 
          name: x.name,
          where: x.where || x.location || '' 
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

/* ========== Small talk fallback ========== */

async function composeSmallTalk({ message = '', nlu = {}, history = [] }) {
  const historyLines = Array.isArray(history)
    ? history
        .map(h => `Q: ${h?.message?.text || ''}\nA: ${h?.reply?.text || ''}`.trim())
        .filter(Boolean)
        .reverse()
        .slice(0, 5)
    : [];
  const histBlock = historyLines.length
    ? `Ngữ cảnh trước đó (gần nhất trước):\n${historyLines.join('\n')}\n\n`
    : '';

  const prompt = `
Bạn là trợ lý du lịch thân thiện. Người dùng hỏi chung: "${message}".
${histBlock}Hãy trả lời ngắn gọn 2-4 câu, tự nhiên như người thật.
Trả về JSON: { "summary": string, "tips": string[] }
`;

  try {
    const resp = await generateJSON({ prompt, temperature: 0.3 });
    const summary = typeof resp?.summary === 'string' && resp.summary.trim().length
      ? resp.summary.trim()
      : 'Mình đã ghi nhận câu hỏi và gợi ý chung nhé.';
    const tips = Array.isArray(resp?.tips) ? resp.tips.filter(Boolean).slice(0, 5) : [];
    return {
      summary, tips, promotions: [], hotels: [], places: [], dishes: [], source: 'llm-chitchat'
    };
  } catch (e) {
    return {
      summary: 'Mình đã ghi nhận, dưới đây là vài gợi ý chung để bạn tham khảo.',
      tips: ['Thử chọn một điểm đến gần để tiết kiệm thời gian di chuyển'],
      promotions: [], hotels: [], places: [], dishes: [], source: 'llm-chitchat'
    };
  }
}

/* ========== Generic city fallback ========== */
async function composeCityFallback({ city, intent = 'generic', message = '', history = [], month = null, doc = null }) {
  const normMsg = normalize(String(message || ''));
  const inferredCity = city || inferCityFromMessage(normMsg);
  const cityText = inferredCity ? `cho địa điểm: ${inferredCity}` : 'không chỉ rõ địa điểm';
  const cityStrict = inferredCity || city || 'địa điểm người dùng nêu';
  const weatherMode = /thoi tiet|thời tiết|troi|du bao/.test(normMsg);
  const overrideMonthNote = cityMonthContext(inferredCity || city, month);
  const monthNote = overrideMonthNote || monthContext(month);
  const histPayload = payloadFromHistory(history);

  if (histPayload && Array.isArray(histPayload.places)) {
    const found = histPayload.places.find(p => {
      const n = normalize(p?.name || '');
      return n && normMsg.includes(n);
    });
    if (found) {
      const hint = found.hint || found.description || '';
      return sanitizePayload({
        summary: hint || `Thông tin về ${found.name}`,
        places: [{ name: found.name, hint }],
        dishes: [], tips: ['Kiểm tra giờ mở cửa trước khi đến'], promotions: [], hotels: [],
        source: histPayload.source || 'nosql+llm'
      });
    }
  }

  // Kiểm tra POI RULES (chỉ cho misinfo hoặc redirect)
  for (const rule of POI_RULES) {
    if (!rule.alias.test(message)) continue;
    
    if (rule.type === 'misinfo') {
      const replacements = Array.isArray(rule.replacements) ? rule.replacements : [];
      return sanitizePayload({
        summary: rule.info || `Chưa có thông tin chính thống về ${rule.poi}.`,
        places: replacements, dishes: [], tips: rule.tips || [], promotions: [], hotels: [], source: 'llm-generic'
      });
    }
    // Các rules thông thường đã bị bỏ qua ở composeSpecificItem, nhưng nếu rơi vào đây (fallback) 
    // thì cũng nên để AI tự xử lý (return null để xuống dưới) hoặc xử lý generic.
    // Ở đây ta chỉ giữ logic redirect nếu có (nhưng POI_RULES hiện tại đã xóa hardcode info).
  }

  const prompt = `
Bạn là trợ lý du lịch chuyên nghiệp.
Câu hỏi: "${message}" ${cityText}. ${monthNote}
KHÔNG CÓ dữ liệu nội bộ về ${cityStrict}, hãy trả lời dựa vào kiến thức CHẮC CHẮN.
TRẢ VỀ JSON:
{ "summary": string, "places": [{ "name": string, "hint": string }], "dishes": [], "tips": [], "province": string }
Yêu cầu: CHỈ gợi ý địa danh thuộc ĐÚNG ${cityStrict}. Summary 2-3 câu thân thiện.
(intent: ${intent})
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
    if (doc && doc.name) out = alignWithDoc(out, doc);
    return out;
  } catch {
    return {
      summary: city ? `Gợi ý chung cho ${city}` : 'Gợi ý du lịch chung',
      places: [], dishes: [], tips: [], promotions: [], hotels: [], source: 'llm-generic'
    };
  }
}

module.exports = { compose, composeSmallTalk, fallbackFromDoc, composeCityFallback };