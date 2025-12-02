'use strict';

const { fetch } = require('undici'); 

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

function normalize(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

async function analyzeWithLLM(text, context = {}) {
    const { last_city, last_entity } = context;

    // 🔥 PROMPT ĐƯỢC TINH CHỈNH ĐỂ SỬA 3 LỖI TRÊN
    const prompt = `
    Bạn là chuyên gia ngôn ngữ du lịch Việt Nam.
    
    INPUT: "${text}"
    CONTEXT: City="${last_city || '?'}", Entity="${last_entity || '?'}"

    NHIỆM VỤ:
    1. search_term (QUAN TRỌNG): 
       - Khôi phục dấu tiếng Việt chuẩn xác cho địa danh.
       - VD: "duong ham dieu khac" -> "Đường Hầm Điêu Khắc".
       - VD: "da nag" -> "Đà Nẵng".
       - Giữ nguyên tên riêng, bỏ các từ thừa.
    
    2. rewritten: Viết lại câu hỏi tự nhiên.

    3. city: Tên thành phố hiện tại.

    4. intent (Phân loại thật kỹ):
       - "ask_hotels": CHỈ KHI user hỏi tìm nơi ở, khách sạn, resort, homestay, đặt phòng.
         (LƯU Ý: "check-in" tại địa điểm tham quan như cầu, hồ, núi -> LÀ "ask_places", KHÔNG PHẢI "ask_hotels").
       - "ask_promotions": Hỏi khuyến mãi, voucher, giảm giá.
       - "ask_weather": Hỏi thời tiết.
       - "ask_places": Hỏi chỗ chơi, tham quan, ăn uống, hoặc "check-in" địa danh.
       - "ask_details": Hỏi chi tiết (giá vé, địa chỉ) về 1 địa điểm cụ thể.
       - "chitchat": Xã giao.

    5. filters: amenities (tiện ích), time_ref (thời gian).

    JSON OUTPUT FORMAT:
    {
       "search_term": "...",
       "rewritten": "...",
       "city": "...",
       "intent": "...",
       "amenities": [],
       "time_ref": null
    }
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
                options: { temperature: 0.1 } 
            })
        });

        const data = await res.json();
        let result;
        try {
            result = JSON.parse(data.response);
        } catch (err) {
            return { 
                search_term: text, 
                rewritten: text, 
                city: last_city, 
                intent: 'ask_places', 
                amenities: [], 
                time_ref: null 
            };
        }

        return { 
            search_term: result.search_term || text, 
            rewritten: result.rewritten || text,     
            city: result.city || last_city, 
            intent: result.intent || 'ask_places',
            amenities: Array.isArray(result.amenities) ? result.amenities : [],
            time_ref: result.time_ref || null
        };

    } catch (e) {
        return { search_term: text, rewritten: text, city: last_city, intent: 'other', amenities: [], time_ref: null };
    }
}

async function analyzeAsync(message = '', contextState = {}) {
  const aiResult = await analyzeWithLLM(message, contextState);
  
  let finalIntent = aiResult.intent;
  if (finalIntent === 'ask_details' && !contextState.last_entity && message.length < 4) {
      finalIntent = 'chitchat';
  }

  return {
    original: message,
    normalized: normalize(aiResult.search_term),
    rewritten: aiResult.rewritten,
    search_term: aiResult.search_term, 
    intent: finalIntent,
    city: aiResult.city, 
    amenities: aiResult.amenities, 
    time_ref: aiResult.time_ref,   
    category: finalIntent === 'ask_weather' ? 'weather' : 'place'
  };
}

module.exports = { analyzeAsync, normalize };