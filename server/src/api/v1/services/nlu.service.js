'use strict';

const { fetch } = require('undici'); 

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

/**
 * 1. HELPER: Normalize
 * Giữ lại hàm này để đảm bảo các service khác (như Cache) không bị lỗi.
 * Tuy nhiên, luồng chính của NLU sẽ dùng kết quả từ AI.
 */
function normalize(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

/**
 * 2. CORE AI NLU (MULTI-TASKING)
 * Input: Message của user + Context (Last City, Last Entity).
 * Output: JSON chứa câu đã sửa lỗi, City, và Intent.
 */
async function analyzeWithLLM(text, context = {}) {
    const { last_city, last_entity } = context;

    // Prompt "Chain-of-Thought" để xử lý ngữ cảnh
    const prompt = `
    Bạn là AI Linguistic Engine chuyên về du lịch Việt Nam.
    
    INPUT:
    - User Message: "${text}"
    - Context (Đang nói về): City="${last_city || '?'}", Entity="${last_entity || '?'}"

    NHIỆM VỤ (Thực hiện tuần tự):
    1. **Correction & Rewrite**: 
       - Sửa lỗi chính tả (VD: "da nag" -> "Đà Nẵng").
       - Giải quyết tham chiếu: Nếu user dùng "nó", "chỗ này", "giá vé", hãy ghép với Context Entity.
       - Viết lại thành câu hỏi đầy đủ để Search Database (VD: "nó ở đâu" + Context "Chợ Hàn" -> "địa chỉ Chợ Hàn ở đâu").
    2. **Entity Extraction**: Tìm City (Tỉnh/Thành) *hiện tại* trong câu nói. Nếu không có, dùng City từ Context.
    3. **Intent Classification**:
       - "ask_weather": Hỏi thời tiết, mưa nắng.
       - "ask_places": Hỏi chung chung (chỗ chơi, ăn uống, tham quan).
       - "ask_details": Hỏi chi tiết cụ thể (giá vé, giờ mở cửa, review) về 1 địa điểm.
       - "ask_distance": Hỏi đường đi, khoảng cách.
       - "chitchat": Chào hỏi, khen chê, không có thông tin du lịch.
       - "other": Không xác định.

    JSON OUTPUT FORMAT (Bắt buộc):
    {
       "rewritten": "Câu hỏi hoàn chỉnh đã sửa lỗi",
       "city": "Tên thành phố (hoặc null)",
       "intent": "Mã intent",
       "confidence": 0.9
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
                options: { temperature: 0.1 } // Temp thấp để đảm bảo logic chính xác
            })
        });

        const data = await res.json();
        let result;
        try {
            result = JSON.parse(data.response);
        } catch (err) {
            console.error("[NLU] JSON Parse Error:", err);
            // Fallback an toàn nếu LLM trả JSON lỗi
            return { rewritten: text, city: last_city, intent: 'ask_places' };
        }

        return { 
            rewritten: result.rewritten || text,
            city: result.city || last_city, // Ưu tiên city mới tìm thấy
            intent: result.intent || 'other'
        };

    } catch (e) {
        console.error("[NLU] LLM Connection Error:", e);
        return { rewritten: text, city: last_city, intent: 'other' };
    }
}

/**
 * 3. MAIN FUNCTION
 */
async function analyzeAsync(message = '', contextState = {}) {
  // Gọi AI để xử lý tất cả Logic (Pure AI)
  const aiResult = await analyzeWithLLM(message, contextState);
  
  // Logic phụ: Nếu AI bảo hỏi chi tiết mà câu quá ngắn và không có ngữ cảnh -> Chitchat
  let finalIntent = aiResult.intent;
  if (finalIntent === 'ask_details' && !contextState.last_entity && message.length < 4) {
      finalIntent = 'chitchat';
  }

  return {
    original: message,
    normalized: normalize(aiResult.rewritten), // Dùng bản đã sửa lỗi để chuẩn hóa
    rewritten: aiResult.rewritten,             // QUAN TRỌNG: Dùng cái này để Search Vector
    intent: finalIntent,
    city: aiResult.city, 
    category: finalIntent === 'ask_weather' ? 'weather' : 'place'
  };
}

module.exports = { analyzeAsync, normalize };