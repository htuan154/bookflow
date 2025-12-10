'use strict';

const { generateJSON } = require('../../../config/ollama');
const { validateResponse } = require('./guardrails.service');
const { cache, makeKey } = require('../../../config/cache');
const { normalize } = require('./nlu.service');

// ==============================================================================
// 1. DATA SANITIZATION & HELPERS
// ==============================================================================

// Regex để loại bỏ các ký tự CJK (Chinese, Japanese, Korean) trong text trả về
const CJK_REGEX = /[\u3400-\u9fff]/g;

// Hàm sanitizeText: Loại bỏ ký tự CJK, trim chuỗi và trả về chuỗi sạch
const sanitizeText = (s = '') => String(s || '').replace(CJK_REGEX, '').trim();

/**
 * Hàm làm sạch và chuẩn hóa dữ liệu trả về cho chatbot.
 * - Đảm bảo các trường như summary, places, dishes, tips, promotions, hotels, province, source đều đúng kiểu và không bị thiếu.
 * - summary: loại bỏ ký tự CJK và khoảng trắng thừa.
 * - places, dishes, promotions, hotels: luôn là mảng (nếu không có thì trả về mảng rỗng).
 * - tips: lọc bỏ các giá trị falsy (null, undefined, '').
 * - province: nếu không có thì trả về null.
 * - source: nếu không có thì trả về 'unknown'.
 *
 * @param {object} p - Payload đầu vào cần làm sạch
 * @returns {object} Payload đã chuẩn hóa, an toàn cho chatbot sử dụng
 */
const sanitizePayload = (p = {}) => {
  return {
    ...p, // Giữ lại các trường gốc
    summary: sanitizeText(p.summary || ''), // Làm sạch chuỗi summary
    places: Array.isArray(p.places) ? p.places : [], // Đảm bảo places là mảng
    dishes: Array.isArray(p.dishes) ? p.dishes : [], // Đảm bảo dishes là mảng
    tips: Array.isArray(p.tips) ? p.tips.filter(Boolean) : [], // Lọc tips, chỉ giữ giá trị thật
    promotions: Array.isArray(p.promotions) ? p.promotions : [], // Đảm bảo promotions là mảng
    hotels: Array.isArray(p.hotels) ? p.hotels : [], // Đảm bảo hotels là mảng
    province: p.province || null, // Nếu không có province thì trả về null
    source: p.source || 'unknown' // Nếu không có source thì trả về 'unknown'
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

/**
 * Tạo câu trả lời chi tiết, hấp dẫn cho một địa điểm hoặc món ăn cụ thể mà người dùng hỏi.
 * Quy trình:
 * 1. Xác định tên, loại (địa điểm/món ăn), tỉnh/thành của item.
 * 2. Tạo prompt hướng dẫn AI trả lời theo phong cách thân thiện, dài, có thông tin mở rộng, không cộc lốc.
 * 3. Gửi prompt này cho AI (Ollama) để sinh ra câu trả lời (summary) và các mẹo (tips).
 * 4. Làm sạch và chuẩn hóa dữ liệu trả về bằng sanitizePayload.
 * 5. Nếu AI lỗi, trả về câu trả lời fallback đơn giản.
 *
 * @param {object} param0 - { doc, targetItem, userMessage }
 * @returns {object} Payload đã chuẩn hóa, gồm summary, places/dishes, tips, source
 */
async function composeSpecificItem({ doc, targetItem, userMessage }) {
  const itemName = targetItem.name || 'Địa điểm này'; // Tên địa điểm/món ăn
  const itemType = targetItem.type || 'place'; // Loại: 'place' hoặc 'dish'
  const provinceName = doc.name || 'Địa phương'; // Tên tỉnh/thành
  
  // Chỉ dẫn chi tiết cho AI tuỳ loại item
  let specificInstruction = "";
  if (itemType === 'dish') {
      specificInstruction = `Đây là MÓN ĂN. Hãy miêu tả hương vị đậm đà, nguyên liệu hấp dẫn khiến người nghe "chảy nước miếng".`;
  } else {
      specificInstruction = `Đây là ĐỊA ĐIỂM. Hãy miêu tả không khí, kiến trúc hoặc giá trị lịch sử để khơi gợi cảm hứng đi ngay lập tức.`;
  }

  // Tạo prompt chi tiết yêu cầu AI trả lời hấp dẫn, mở rộng, đúng phong cách
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
    
    // Làm sạch và chuẩn hóa dữ liệu trả về
    return sanitizePayload({
      summary: raw.summary || `${itemName} là điểm đến tuyệt vời tại ${provinceName} mà bạn nhất định không nên bỏ lỡ.`,
      places: itemType === 'place' ? [{ name: itemName, hint: 'Điểm đến gợi ý' }] : [], 
      dishes: itemType === 'dish' ? [{ name: itemName, where: 'Đặc sản phải thử' }] : [],
      tips: raw.tips || [],
      source: 'ai-flex-knowledge'
    });

  } catch (error) {
    // Nếu AI lỗi, trả về câu trả lời fallback đơn giản
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

/**
 * Tạo prompt tổng quan cho AI để sinh ra đoạn giới thiệu hấp dẫn về một tỉnh/thành.
 * Quy trình:
 * 1. Lấy danh sách địa danh và món ăn nổi bật từ doc (tối đa 10 mỗi loại).
 * 2. Tùy theo queryType (dishes/places/overview) mà thêm hướng dẫn cho AI tập trung vào món ăn, địa điểm hoặc tổng quan.
 * 3. Trả về chuỗi prompt chi tiết, yêu cầu AI viết đoạn giới thiệu cuốn hút, chọn ra 5 địa điểm và 5 món ăn tiêu biểu.
 * 4. Định dạng JSON output để AI trả về đúng cấu trúc mong muốn.
 *
 * @param {object} param0 - { doc, queryType, intent }
 * @returns {string} Prompt chi tiết cho AI
 */
function factsToPrompt({ doc, queryType = 'overview', intent }) {
  // Lấy danh sách tên địa danh và món ăn nổi bật (tối đa 10 mỗi loại)
  const places = (doc.places || []).slice(0, 10).map(p => p.name).join(', ');
  const dishes = (doc.dishes || []).slice(0, 10).map(d => d.name).join(', ');
  
  // Tùy loại truy vấn mà thêm hướng dẫn cho AI
  let conditionalInstructions = '';
  if (queryType === 'dishes') conditionalInstructions = 'Hãy tập trung review ẩm thực thật hấp dẫn.';
  else if (queryType === 'places') conditionalInstructions = 'Hãy vẽ ra bức tranh du lịch với các địa điểm nổi tiếng.';
  else conditionalInstructions = 'Hãy giới thiệu tổng quan đầy cảm hứng về vùng đất này.';

  // Tạo prompt chi tiết cho AI, yêu cầu văn phong cuốn hút, chọn ra 5 địa điểm và 5 món ăn tiêu biểu
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

/**
 * Chuẩn hóa một dòng dữ liệu (địa điểm, món ăn, khách sạn, khuyến mãi...)
 * - Lấy tên từ nhiều trường khác nhau (name, title, hotel_name, promotion_name, code, id)
 * - Nếu không có tên thì bỏ qua (trả về null)
 * - Gắn thêm tag để biết nguồn gốc hoặc loại dữ liệu
 *
 * @param {object} x - Dữ liệu đầu vào (row)
 * @param {string} tag - Nhãn nguồn gốc hoặc loại dữ liệu
 * @returns {object|null} Dữ liệu đã chuẩn hóa hoặc null nếu thiếu tên
 */
function normRow(x, tag = '') {
  if (!x || typeof x !== 'object') return null; // Nếu không phải object thì bỏ qua
  const name = x.name || x.title || x.hotel_name || x.promotion_name || x.code || x.id || null;   // Lấy tên từ nhiều trường, ưu tiên theo thứ tự
  if (!name) return null; // Nếu không có tên thì bỏ qua
  return { ...x, name, _tag: tag }; // Trả về object đã chuẩn hóa với tên và tag
}

/**
 * Chuẩn hóa một mảng dữ liệu (danh sách địa điểm, món ăn, khách sạn...)
 * - Kiểm tra đầu vào phải là mảng, nếu không thì trả về mảng rỗng
 * - Áp dụng hàm normRow cho từng phần tử để chuẩn hóa từng dòng
 * - Loại bỏ các phần tử không hợp lệ (null)
 *
 * @param {Array} rows - Mảng dữ liệu đầu vào
 * @param {string} tag - Nhãn nguồn gốc hoặc loại dữ liệu
 * @returns {Array} Mảng dữ liệu đã chuẩn hóa, chỉ giữ lại các phần tử hợp lệ
 */
function normRows(rows, tag = '') {
  if (!Array.isArray(rows)) return []; // Nếu không phải mảng thì trả về mảng rỗng
  // Chuẩn hóa từng dòng và loại bỏ phần tử không hợp lệ
  return rows.map(r => normRow(r, tag)).filter(Boolean);
}

/**
 * Lọc trùng trong mảng dựa trên giá trị trả về từ hàm keyFn.
 * - Duyệt qua từng phần tử của mảng arr.
 * - Sử dụng Set để lưu các giá trị key đã gặp (do keyFn trả về).
 * - Nếu key đã tồn tại trong Set thì bỏ qua phần tử đó (loại trùng).
 * - Nếu key chưa tồn tại thì thêm vào Set và giữ lại phần tử đó.
 * - Nếu keyFn bị lỗi hoặc trả về giá trị falsy thì bỏ qua phần tử đó.
 *
 * @param {Array} arr - Mảng đầu vào cần lọc trùng
 * @param {Function} keyFn - Hàm lấy key duy nhất từ mỗi phần tử
 * @returns {Array} Mảng đã loại bỏ các phần tử trùng lặp theo key
 */
const uniqBy = (arr, keyFn) => {
  const seen = new Set(); // Lưu các key đã gặp
  return (arr || []).filter(x => {
    try { const k = keyFn(x); if (!k || seen.has(k)) return false; seen.add(k); return true; } catch { return false; }
  });
};
// try {
//       const k = keyFn(x); // Lấy key từ phần tử
//       if (!k || seen.has(k)) return false; // Nếu key đã có hoặc không hợp lệ thì bỏ qua
//       seen.add(k); // Thêm key vào Set
//       return true; // Giữ lại phần tử này
//     } catch {
//       return false; // Nếu keyFn lỗi thì bỏ qua phần tử
//     }
const normKey = v => normalize(String(v || '')); // Chuẩn hóa chuỗi để làm key

/**
 * Hàm tổng hợp dữ liệu trả về cho chatbot dựa trên nhiều nguồn (doc, sql, nlu, user_ctx, intent).
 * Quy trình xử lý:
 * 1. Nếu user hỏi chi tiết về một địa điểm/món ăn cụ thể (user_ctx.forcedItem), gọi AI để sinh câu trả lời chi tiết.
 * 2. Nếu có dữ liệu SQL (booking, khuyến mãi...), chuẩn hóa và trả về danh sách kết quả phù hợp.
 * 3. Nếu không có doc hoặc doc thiếu tên, trả về thông báo fallback (chưa có dữ liệu, hứa sẽ cập nhật).
 * 4. Nếu có doc hợp lệ, sinh prompt tổng quan cho AI, lấy kết quả, chuẩn hóa và loại trùng các địa điểm/món ăn.
 * 5. Tất cả kết quả đều được cache lại để tăng tốc cho lần truy vấn sau.
 *
 * @param {object} param0 - { doc, sql, nlu, filters, user_ctx, intent }
 * @returns {object} Payload đã chuẩn hóa, phù hợp cho chatbot sử dụng
 */
async function compose({ doc, sql = [], nlu = {}, filters = {}, user_ctx = {}, intent }) {
  // TH1: Nếu user hỏi chi tiết về một địa điểm/món ăn cụ thể (forcedItem)
  if (user_ctx && user_ctx.forcedItem && doc) {
    // Gọi hàm composeSpecificItem để sinh câu trả lời chi tiết cho item đó
      return await composeSpecificItem({
          doc,
          targetItem: user_ctx.forcedItem,
          userMessage: user_ctx.userMessage || nlu?.normalized || '' 
      });
  }

  // Tạo key duy nhất cho cache dựa trên các tham số truy vấn
  const key = makeKey({
    doc_key: doc?.name || doc?.province || 'no-doc',
    sql_tags: (sql || []).map(ds => ds?.tag || ds?.name).join('|') || 'no-sql',
    intent: intent || nlu?.intent || 'generic',
    city: nlu?.city || user_ctx?.city || '',
    filters, user_ctx
  });
  // Kiểm tra cache, nếu đã có kết quả thì trả về luôn
  const cached = cache.get(key);
  if (cached) return cached;

  // TH2: Nếu có dữ liệu SQL (ví dụ: booking, khuyến mãi...)
  if (Array.isArray(sql) && sql.length > 0) {
    const items = [];
    // Chuẩn hóa từng dataset SQL thành mảng items
    for (const ds of sql) items.push(...normRows(ds?.rows || [], ds?.name || 'dataset'));
    // Kiểm tra xem có phải dữ liệu khách sạn hoặc khuyến mãi không
    const isHotel = items.some(i => i.hotel_id || i.star_rating);
    const isPromo = items.some(i => i.promotion_id || i.discount_value);
    
    // Trả về payload đã chuẩn hóa, chỉ lấy tối đa 10 kết quả cho mỗi loại
    const out = sanitizePayload({
        summary: `Mình tìm thấy ${items.length} kết quả phù hợp với yêu cầu của bạn đây!`,
        hotels: isHotel ? items.slice(0, 10) : [],
        promotions: isPromo ? items.slice(0, 10) : [],
        source: 'sql+llm'
    });
    cache.set(key, out);
    return out;
  }

  // TH3: Nếu không có doc hoặc doc thiếu tên, trả về fallback
  if (!doc || !doc.name) {
    // Gọi composeCityFallback để sinh câu trả lời fallback (chưa có dữ liệu)
    const fb = await composeCityFallback({ city: user_ctx?.city, message: nlu?.normalized }).catch(() => null);
    return fb || sanitizePayload({ summary: 'Thông tin này mình đang cập nhật thêm, bạn đợi chút nhé.', source: 'empty' });
  }

  // TH4: Nếu có doc hợp lệ, sinh prompt tổng quan cho AI
  try {
    const queryType = nlu?.queryType || 'overview'; // Loại truy vấn: tổng quan, món ăn, địa điểm..
    const prompt = factsToPrompt({ doc, queryType, intent: intent || 'generic' }); // Tạo prompt chi tiết cho AI
    const raw = await generateJSON({ prompt, temperature: 0.3 }); // Gọi AI sinh dữ liệu, temp thấp để ổn định
    const safe = validateResponse(raw, doc); // Kiểm tra và chuẩn hóa dữ liệu trả về

    // Chuẩn hóa kết quả, loại trùng địa điểm/món ăn bằng uniqBy + normKey
    const out = sanitizePayload({
      summary: safe.summary || `Chào mừng bạn đến với ${doc.name}, một vùng đất tuyệt vời!`,
      places: uniqBy(safe.places, x => normKey(x.name)),
      dishes: uniqBy(safe.dishes, x => normKey(x.name)),
      tips: safe.tips || [],
      source: 'nosql-generic'
    });

    cache.set(key, out); // Lưu kết quả vào cache
    return out;
  } catch (e) {
    // Nếu AI lỗi, trả về fallback đơn giản từ doc
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

/**
 * Hàm trả lời small talk (chào hỏi, trò chuyện vui vẻ) cho chatbot.
 * - Tạo prompt yêu cầu AI trả lời thân thiện, vui vẻ, có emoji.
 * - Gửi prompt cho AI (Ollama) với temperature cao hơn để câu trả lời đa dạng, tự nhiên hơn.
 * - Nếu AI trả về kết quả thì chuẩn hóa và trả về summary.
 * - Nếu AI lỗi thì trả về câu trả lời mặc định thân thiện.
 *
 * @param {object} param0 - { message } Nội dung user gửi
 * @returns {object} Payload gồm summary trả lời small talk
 */
async function composeSmallTalk({ message = '' }) {
  // Tạo prompt yêu cầu AI trả lời thân thiện, vui vẻ, có emoji
  const prompt = `Bạn là trợ lý du lịch vui tính. User nói: "${message}". Hãy trả lời thật thân thiện, dùng emoji. JSON: {"summary": "..."}`;
  try {
    // Gọi AI sinh câu trả lời, temperature = 0.6 để văn phong tự nhiên, đa dạng
    const resp = await generateJSON({ prompt, temperature: 0.6 });
    // Trả về kết quả đã chuẩn hóa, nếu AI trả về rỗng thì dùng câu mặc định
    return sanitizePayload({ summary: resp?.summary || 'Chào bạn! Mình có thể giúp gì cho chuyến đi sắp tới?', source: 'llm-chitchat' });
  } catch {
    // Nếu AI lỗi, trả về câu trả lời mặc định thân thiện
    return sanitizePayload({ summary: 'Xin chào! Rất vui được hỗ trợ bạn.', source: 'chitchat-static' });
  }
}

/**
 * Hàm trả về câu trả lời fallback khi user hỏi về thành phố/địa điểm chưa có trong database.
 * - Tạo prompt yêu cầu AI trả lời khéo léo, hứa sẽ học thêm, tránh trả lời cộc lốc.
 * - Gửi prompt cho AI (Ollama) với temperature vừa phải (0.5) để câu trả lời tự nhiên, mềm mại.
 * - Nếu AI trả về kết quả thì chuẩn hóa và trả về summary.
 * - Nếu AI lỗi thì trả về câu trả lời mặc định xin lỗi, báo chưa có dữ liệu.
 *
 * @param {object} param0 - { city, message } Thành phố/địa điểm và nội dung user hỏi
 * @returns {object} Payload gồm summary trả lời fallback
 */
async function composeCityFallback({ city, message = '' }) {
    // Tạo prompt yêu cầu AI trả lời khéo léo, hứa sẽ học thêm
    const prompt = `User hỏi về "${city || 'địa điểm'}" nhưng database chưa có. Nội dung: "${message}". Trả lời khéo léo, hứa sẽ học thêm. JSON: {"summary": "..."}`;
    try {
        // Gọi AI sinh câu trả lời, temperature = 0.5 để văn phong mềm mại, tự nhiên
        const raw = await generateJSON({ prompt, temperature: 0.5 });
        // Trả về kết quả đã chuẩn hóa, nếu AI trả về rỗng thì dùng câu fallback
        return sanitizePayload({ summary: raw?.summary || 'Địa điểm này mới quá, mình chưa kịp cập nhật. Bạn hỏi địa điểm khác nhé?', source: 'llm-pure-fallback' });
    } catch {
        // Nếu AI lỗi, trả về câu trả lời mặc định xin lỗi, báo chưa có dữ liệu
        return sanitizePayload({ summary: 'Xin lỗi, thông tin này mình chưa có.', source: 'empty' });
    }
}

/**
 * Hàm trả về dữ liệu fallback tĩnh từ doc khi không có kết quả AI hoặc dữ liệu động.
 * - Lấy tên tỉnh/thành từ doc.name.
 * - Lấy tối đa 5 địa điểm và 5 món ăn từ doc.places và doc.dishes.
 * - Đánh dấu source là 'static' để biết đây là dữ liệu tĩnh, không phải AI sinh ra.
 * - Chuẩn hóa kết quả bằng sanitizePayload để đảm bảo an toàn cho chatbot.
 *
 * @param {object} doc - Đối tượng dữ liệu tỉnh/thành, có trường name, places, dishes
 * @returns {object} Payload đã chuẩn hóa, dùng làm fallback khi không có dữ liệu AI
 */
function fallbackFromDoc(doc) {
  return sanitizePayload({
    province: doc.name, // Tên tỉnh/thành
    places: (doc.places || []).slice(0,5), // Lấy tối đa 5 địa điểm
    dishes: (doc.dishes || []).slice(0,5), // Lấy tối đa 5 món ăn
    source: 'static' // Đánh dấu là dữ liệu tĩnh
  });
}

module.exports = { compose, composeSmallTalk, fallbackFromDoc, composeCityFallback };

// Giải thích về tham số temperature:
// - temperature là tham số điều chỉnh mức độ ngẫu nhiên/kreativity của AI model (Ollama)
// - temperature = 0.0: AI trả về kết quả nhất quán, ít sáng tạo, bám sát hướng dẫn
// - temperature cao hơn (gần 1.0): AI trả về đa dạng, sáng tạo hơn nhưng có thể không ổn định
// - Ở đây để temperature = 0.0 nhằm đảm bảo AI luôn trả về kết quả chuẩn xác, nhất quán khi chuyển đổi tên thành phố