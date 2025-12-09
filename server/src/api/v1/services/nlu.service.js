'use strict';

const { fetch } = require('undici'); 

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

// Hàm chuẩn hóa chuỗi tiếng Việt:
// - Chuyển thành chuỗi (String)
// - Tách dấu (normalize NFD)
// - Xóa toàn bộ dấu tiếng Việt (diacritic)
// - Thay "đ" thành "d"
// - Chuyển về chữ thường
// - Xóa khoảng trắng đầu/cuối
// Kết quả: Chuỗi không dấu, chữ thường, dễ so sánh/tìm kiếm
function normalize(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

// Hàm này gửi prompt mẫu lên Ollama để phân tích câu hỏi người dùng,
// trả về các trường đã chuẩn hóa như search_term, rewritten, city, intent, amenities, time_ref.
// Nếu LLM trả về lỗi hoặc không đúng format thì trả về giá trị mặc định.
async function analyzeWithLLM(text, context = {}) {
    const { last_city, last_entity } = context;

    // Tạo prompt tiếng Việt chi tiết để hướng dẫn LLM phân tích
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
        // Gửi request POST đến API của Ollama với prompt trên
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST', // Phương thức POST
            headers: { 'Content-Type': 'application/json' }, // Header JSON
            body: JSON.stringify({
                model: OLLAMA_MODEL, // Tên model sử dụng
                prompt: prompt, // Prompt đã tạo
                stream: false, // Không dùng stream
                format: "json", // Yêu cầu trả về JSON
                options: { temperature: 0.1 } // Đặt temperature thấp cho kết quả ổn định
            })
        });

        const data = await res.json(); // Parse response JSON từ Ollama
        let result;
        try {
            result = JSON.parse(data.response); // Parse chuỗi JSON trả về từ LLM
        } catch (err) {
            // Nếu lỗi parse, trả về giá trị mặc định
            return { 
                search_term: text,  
                rewritten: text, 
                city: last_city, 
                intent: 'ask_places', 
                amenities: [], 
                time_ref: null 
            };
        }
        // Trả về kết quả đã chuẩn hóa từ LLM (nếu có)
        // Nếu thiếu trường thì dùng giá trị mặc định
        return { 
            search_term: result.search_term || text, // Từ khóa tìm kiếm đã chuẩn hóa
            rewritten: result.rewritten || text,  // Câu hỏi đã viết lại tự nhiên   
            city: result.city || last_city, // Thành phố xác định được
            intent: result.intent || 'ask_places', // Ý định của user
            amenities: Array.isArray(result.amenities) ? result.amenities : [], // Tiện ích
            time_ref: result.time_ref || null // Tham chiếu thời gian
        };

    } catch (e) {
        // Nếu lỗi gọi API, trả về giá trị mặc định
        return { search_term: text, rewritten: text, city: last_city, intent: 'other', amenities: [], time_ref: null };
    }
}

// Hàm phân tích ý định và trích xuất thông tin từ câu hỏi người dùng
// - Gọi analyzeWithLLM để lấy kết quả phân tích từ LLM
// - Kiểm tra lại intent: nếu intent là 'ask_details' mà không có entity hoặc câu hỏi quá ngắn thì chuyển thành 'chitchat'
// - Chuẩn hóa search_term bằng normalize
// - Trả về object gồm các trường đã phân tích và chuẩn hóa
async function analyzeAsync(message = '', contextState = {}) {
  // Gọi LLM để phân tích câu hỏi
  const aiResult = await analyzeWithLLM(message, contextState); 
  
  let finalIntent = aiResult.intent; // Lấy intent từ kết quả LLM
  // Nếu intent là 'ask_details' mà không có entity cuối hoặc câu hỏi quá ngắn thì chuyển thành 'chitchat'
  if (finalIntent === 'ask_details' && !contextState.last_entity && message.length < 4) {
      finalIntent = 'chitchat';
  }

  // Trả về object đã chuẩn hóa gồm các trường cần thiết cho chatbot
  return {
    original: message, // Câu hỏi gốc
    normalized: normalize(aiResult.search_term), // Từ khóa tìm kiếm đã chuẩn hóa
    rewritten: aiResult.rewritten, // Câu hỏi đã viết lại tự nhiên
    search_term: aiResult.search_term, // Từ khóa tìm kiếm gốc
    intent: finalIntent, // Ý định cuối cùng
    city: aiResult.city, // Thành phố
    amenities: aiResult.amenities, // Tiện ích
    time_ref: aiResult.time_ref,   // Tham chiếu thời gian
    category: finalIntent === 'ask_weather' ? 'weather' : 'place' // Phân loại category
  };
}

module.exports = { analyzeAsync, normalize };

// Giải thích về tham số temperature:
// - temperature là tham số điều chỉnh mức độ ngẫu nhiên/kreativity của AI model (Ollama)
// - temperature = 0.0: AI trả về kết quả nhất quán, ít sáng tạo, bám sát hướng dẫn
// - temperature cao hơn (gần 1.0): AI trả về đa dạng, sáng tạo hơn nhưng có thể không ổn định
// - Ở đây để temperature = 0.0 nhằm đảm bảo AI luôn trả về kết quả chuẩn xác, nhất quán khi chuyển đổi tên thành phố