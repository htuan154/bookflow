'use strict';
const axios = require('axios');
const { fetch } = require('undici');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

const cityMapCache = new Map();

/**
 * PURE AI CITY NORMALIZER
 * Dùng trí tuệ nhân tạo để map địa danh du lịch -> Tên trạm thời tiết chuẩn quốc tế
 */
async function normalizeCityWithAI(rawCity) {
    if (!rawCity) return 'Ho Chi Minh City';
    
    // 1. Check Cache
    const cacheKey = rawCity.toLowerCase().trim();
    if (cityMapCache.has(cacheKey)) {
        return cityMapCache.get(cacheKey);
    }

    // 2. Prompt "Tư duy địa lý" (Geographic Reasoning)
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
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                format: "json",
                options: { temperature: 0.0 } // Temp 0 để đảm bảo nhất quán
            })
        });

        const data = await res.json();
        let stdName = 'Ho Chi Minh City';

        try {
            const json = JSON.parse(data.response);
            stdName = json.city || rawCity;
        } catch (parseError) {
            stdName = data.response.trim().replace(/['"]/g, '');
        }
        
        // Fix lỗi ngu ngơ của AI nếu nó trả về tên có dấu
        stdName = stdName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

        // 3. Update Cache
        cityMapCache.set(cacheKey, stdName);
        console.log(`☁️ [Weather AI] Thinking: "${rawCity}" -> "${stdName}"`);
        return stdName;

    } catch (e) {
        console.error("[Weather AI] Error:", e.message);
        return rawCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    }
}

async function getCurrentWeather(city) {
    if (!city) return { summary: 'Bạn muốn xem thời tiết ở đâu?' };
    
    // Bước 1: Hỏi AI tên chuẩn (Sapa -> Sa Pa, Mũi Né -> Phan Thiet)
    const queryCity = await normalizeCityWithAI(city);

    try {
        // Bước 2: Gọi API
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryCity)},VN&appid=${API_KEY}&units=metric&lang=vi`;
        
        const { data } = await axios.get(url);

        const temp = Math.round(data.main.temp);
        const desc = data.weather[0]?.description || '';
        const hum = data.main.humidity;
        const wind = data.wind?.speed || 0;

        return {
            summary: `Tại ${city} (trạm đo ${data.name}), trời ${desc}. Nhiệt độ ${temp}°C, độ ẩm ${hum}%.`,
            source: 'openweathermap',
            data: { temp, desc, city: data.name, humidity: hum }
        };

    } catch (e) {
        console.error(`[Weather] API Error for "${queryCity}" (Origin: ${city}): ${e.message}`);
        
        // Fallback nhẹ: Nếu AI đoán sai trạm (VD: Con Son lỗi), thử lại bằng tên gốc bỏ dấu
        if (queryCity !== city) {
             console.log('🔄 Retrying with original city name...');
             return getCurrentWeather(city.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        }

        return { 
            summary: `Hiện tại mình không lấy được dữ liệu thời tiết cho khu vực "${city}".`,
            source: 'weather-error'
        };
    }
}

module.exports = { getCurrentWeather };