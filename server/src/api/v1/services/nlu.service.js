'use strict';

const { generateEmbedding } = require('../../../config/ollama');
const { supabase } = require('../../../config/supabase');
const { fetch } = require('undici'); 

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

function normalize(text = '') {
  return String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/gi, 'd').toLowerCase().trim();
}

/**
 * PURE AI NLU: Trích xuất City và kiểm tra Intent logic
 * Prompt được tối ưu để phân biệt ngữ cảnh Weather vs Place
 */
async function analyzeWithLLM(text) {
    if (!text || text.length < 2) return { city: null, category: 'other' };

    const prompt = `
    Phân tích câu nói: "${text}"
    
    Nhiệm vụ:
    1. Trích xuất Entity: Tìm tên Thành phố/Tỉnh (City). Nếu không có, trả về null.
    2. Phân loại Category (Quan trọng):
       - "weather": Chỉ khi hỏi về nhiệt độ, mưa, nắng, dự báo thời tiết.
       - "place": Hỏi về địa điểm, ăn uống, check-in, hoặc TÊN RIÊNG chứa từ thời tiết (VD: "Cầu Mây", "Chợ Nắng", "Quán Gió").
       - "distance": Hỏi về khoảng cách, đường đi, bao xa.
       - "other": Chào hỏi, cảm ơn, hoặc câu không rõ ràng.

    JSON OUTPUT ONLY:
    {"city": "...", "category": "..."}
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
        const result = JSON.parse(data.response);
        return { 
            city: result.city || null,
            category: result.category || 'other'
        };

    } catch (e) {
        console.error("LLM Extraction Error:", e);
        return { city: null, category: 'other' };
    }
}

/**
 * PHÂN LOẠI INTENT KẾT HỢP VECTOR & LLM VALIDATION
 */
async function detectIntentSmart(text, llmAnalysis) {
    // Bước 1: Vector Search (Tham khảo)
    let vectorIntent = 'ask_details';
    try {
        const embedding = await generateEmbedding(text);
        if (embedding) {
            const { data } = await supabase.rpc('match_intent', {
                query_embedding: embedding,
                match_threshold: 0.65, 
                match_count: 1
            });
            if (data && data.length > 0) vectorIntent = data[0].intent_code;
        }
    } catch (e) {}

    // Bước 2: AI Logic Guardrail (QUAN TRỌNG: CÁC RULE ƯU TIÊN)
    
    // 🔥 RULE 1: Nếu LLM bảo là weather -> Force Weather ngay lập tức
    // Bất chấp Vector có tìm ra địa danh hay không (VD: "Thời tiết Hà Nội")
    if (llmAnalysis.category === 'weather') {
        return 'ask_weather';
    }

    // RULE 2: Vector bảo Weather, nhưng LLM bảo Place (VD: "Cầu Mây ở đâu") -> Tin LLM
    if (vectorIntent === 'ask_weather' && llmAnalysis.category === 'place') {
        return 'ask_places';
    }

    // RULE 3: Hỏi khoảng cách
    if (llmAnalysis.category === 'distance') {
        return 'ask_distance';
    }

    // RULE 4: Vector bảo Chitchat, nhưng LLM trích xuất được City -> Chuyển sang hỏi thông tin
    if (vectorIntent === 'chitchat' && llmAnalysis.city) {
        return 'ask_details'; 
    }

    return vectorIntent;
}

async function analyzeAsync(message = '') {
  const llmPromise = analyzeWithLLM(message);
  const llmResult = await llmPromise;
  
  const intent = await detectIntentSmart(message, llmResult);

  return {
    original: message,
    normalized: normalize(message),
    intent,
    city: llmResult.city, 
    category: llmResult.category,
    top_n: 10
  };
}

module.exports = { analyzeAsync, normalize };