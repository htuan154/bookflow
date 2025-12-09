'use strict';
const axios = require('axios');
const { fetch } = require('undici');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

const cityMapCache = new Map();

/**
 * Hàm dùng AI để chuyển tên địa danh du lịch Việt Nam sang tên thành phố chuẩn quốc tế
 * cho API thời tiết (OpenWeatherMap). Có cache để tăng tốc.
 *
 * Bước xử lý:
 * 1. Nếu không có tên thành phố, trả về "Ho Chi Minh City" mặc định
 * 2. Kiểm tra cache, nếu đã có thì trả về luôn
 * 3. Tạo prompt tiếng Anh hướng dẫn AI chuyển đổi tên địa danh
 * 4. Gửi prompt lên Ollama, nhận về kết quả JSON
 * 5. Parse kết quả, chuẩn hóa tên (bỏ dấu, về chữ thường)
 * 6. Lưu vào cache và trả về tên thành phố chuẩn
 * 7. Nếu lỗi, trả về tên đã bỏ dấu
 */
async function normalizeCityWithAI(rawCity) {
    if (!rawCity) return 'Ho Chi Minh City'; // Nếu không có tên, trả về mặc định
    
    // Kiểm tra cache
    const cacheKey = rawCity.toLowerCase().trim(); // Tạo key cache từ tên thành phố
    if (cityMapCache.has(cacheKey)) {
        return cityMapCache.get(cacheKey); // Nếu đã có trong cache, trả về luôn
    }

    // Tạo prompt hướng dẫn AI chuyển đổi tên địa danh
    // Dạy AI xử lý các case đặc biệt: Địa danh du lịch -> Thành phố trực thuộc
    const prompt = `
    Task: Convert the Vietnamese location "${rawCity}" into the standard English City Name used by OpenWeatherMap API.
    
    LOGIC RULES (Think like a local travel expert):
    
    1. **Tourist Hotspots (Map to nearest Weather Station):**
       - "Sapa" / "Sa Pa" -> "Sa Pa"
       - "Mũi Né" -> "Phan Thiet"
       - "Hội An" -> "Hoi An"
       - "Phú Quốc" -> "Phu Quoc"
       - "Côn Đảo" -> "Con Son"
       - "Bà Nà" -> "Da Nang"
       - "Hạ Long" -> "Ha Long"
       - "Tràng An" / "Ninh Bình" -> "Ninh Binh"
       - "Phong Nha" -> "Dong Hoi"

    2. **Province Names (Map to Capital):**
       - "Lâm Đồng" -> "Dalat"
       - "Quảng Nam" -> "Tam Ky" (or "Hoi An" if closer context, but usually Tam Ky)
       - "Khánh Hòa" -> "Nha Trang"
       - "Điện Biên" -> "Dien Bien Phu"
       - "Kiên Giang" -> "Rach Gia"

    3. **General Rule:** Remove accents, Capitalize first letters.
    
    OUTPUT FORMAT: JSON ONLY.
    Example: { "city": "Dalat" }
    `;

    try {
        // Gửi prompt lên Ollama để AI xử lý
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST', // Gửi POST request
            headers: { 'Content-Type': 'application/json' }, // Header JSON
            body: JSON.stringify({
                model: OLLAMA_MODEL, // Model sử dụng
                prompt: prompt, // Prompt đã tạo
                stream: false, // Không dùng stream
                format: "json", // Yêu cầu trả về JSON
                options: { temperature: 0.0 } // Đặt nhiệt độ thấp cho kết quả nhất quán
            })
        });

        const data = await res.json(); // Parse response JSON từ Ollama
        let stdName = 'Ho Chi Minh City'; // Tên thành phố chuẩn mặc định

        try {
            const json = JSON.parse(data.response); // Parse chuỗi JSON trả về từ AI
            stdName = json.city || rawCity; // Lấy tên thành phố từ kết quả
        } catch (parseError) {
            stdName = data.response.trim().replace(/['"]/g, ''); // Nếu lỗi parse, lấy nguyên chuỗi trả về
        }
        
        // Chuẩn hóa tên: bỏ dấu, thay "đ" thành "d"
        stdName = stdName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

        // Lưu vào cache
        cityMapCache.set(cacheKey, stdName);
        console.log(`☁️ [Weather AI] Thinking: "${rawCity}" -> "${stdName}"`);
        return stdName;

    } catch (e) {
        // Nếu lỗi, trả về tên đã bỏ dấu
        console.error("[Weather AI] Error:", e.message);
        return rawCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    }
}

/**
 * Hàm lấy thông tin thời tiết hiện tại cho một thành phố Việt Nam.
 * - B1: Chuẩn hóa tên thành phố bằng AI (normalizeCityWithAI)
 * - B2: Gọi API OpenWeatherMap lấy dữ liệu thời tiết (nhiệt độ, độ ẩm, mô tả...)
 * - Nếu lỗi, thử lại với tên gốc đã bỏ dấu hoặc trả về thông báo lỗi.
 *
 * @param {string} city - Tên thành phố do người dùng nhập
 * @returns {Promise<object>} Thông tin thời tiết hoặc thông báo lỗi
 */
async function getCurrentWeather(city) {
    if (!city) return { summary: 'Bạn muốn xem thời tiết ở đâu?' };
    
    // Chuẩn hóa tên thành phố bằng AI (ví dụ: Sapa -> Sa Pa, Mũi Né -> Phan Thiet)
    const queryCity = await normalizeCityWithAI(city);

    try {
        // Gọi API OpenWeatherMap lấy dữ liệu thời tiết
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryCity)},VN&appid=${API_KEY}&units=metric&lang=vi`;
        
        const { data } = await axios.get(url);

        const temp = Math.round(data.main.temp); // Nhiệt độ làm tròn
        const desc = data.weather[0]?.description || ''; // Mô tả thời tiết
        const hum = data.main.humidity; // Độ ẩm
        const wind = data.wind?.speed || 0; // Tốc độ gió

        // Trả về kết quả thời tiết chuẩn hóa
        return {
            summary: `Tại ${city} (trạm đo ${data.name}), trời ${desc}. Nhiệt độ ${temp}°C, độ ẩm ${hum}%.`,
            source: 'openweathermap',
            data: { temp, desc, city: data.name, humidity: hum }
        };

    } catch (e) {
        // Nếu lỗi API, thử lại với tên gốc đã bỏ dấu (fallback)
        console.error(`[Weather] API Error for "${queryCity}" (Origin: ${city}): ${e.message}`);
        
        // Fallback nhẹ: Nếu AI đoán sai trạm (VD: Con Son lỗi), thử lại bằng tên gốc bỏ dấu
        if (queryCity !== city) {
             console.log('🔄 Retrying with original city name...');
             return getCurrentWeather(city.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        }

        // Nếu vẫn lỗi, trả về thông báo lỗi
        return { 
            summary: `Hiện tại mình không lấy được dữ liệu thời tiết cho khu vực "${city}".`,
            source: 'weather-error'
        };
    }
}

module.exports = { getCurrentWeather };

// Giải thích về tham số temperature:
// - temperature là tham số điều chỉnh mức độ ngẫu nhiên/kreativity của AI model (Ollama)
// - temperature = 0.0: AI trả về kết quả nhất quán, ít sáng tạo, bám sát hướng dẫn
// - temperature cao hơn (gần 1.0): AI trả về đa dạng, sáng tạo hơn nhưng có thể không ổn định
// - Ở đây để temperature = 0.0 nhằm đảm bảo AI luôn trả về kết quả chuẩn xác, nhất quán khi chuyển đổi tên thành phố
