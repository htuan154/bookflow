'use strict';
const axios = require('axios');
const { fetch } = require('undici');
const API_KEY = process.env.OPENWEATHER_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

// Cache tên thành phố đã chuẩn hóa để không phải hỏi AI liên tục
const cityMapCache = new Map();

/**
 * DÙNG AI ĐỂ CHUẨN HÓA TÊN THÀNH PHỐ
 * Thay vì hard-code 63 tỉnh, ta hỏi AI.
 */
async function normalizeCityWithAI(rawCity) {
    if (!rawCity) return 'Ho Chi Minh City';
    
    // Check cache
    if (cityMapCache.has(rawCity.toLowerCase())) {
        return cityMapCache.get(rawCity.toLowerCase());
    }

    const prompt = `
    Nhiệm vụ: Chuyển đổi tên địa danh Việt Nam "${rawCity}" sang tên tiếng Anh chuẩn dùng cho OpenWeatherMap API.
    Quy tắc: 
    - Bỏ dấu, viết hoa chữ cái đầu.
    - "Hồ Chí Minh" -> "Ho Chi Minh City"
    - "Hà Nội" -> "Hanoi"
    - "Đà Nẵng" -> "Da Nang"
    - "Thừa Thiên Huế" -> "Hue"
    Chỉ trả về duy nhất tên tiếng Anh. Không giải thích.
    `;

    try {
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: { temperature: 0.1 }
            })
        });
        const data = await res.json();
        const stdName = data.response.trim().replace(/['"]/g, '');
        
        // Lưu cache
        cityMapCache.set(rawCity.toLowerCase(), stdName);
        console.log(`[Weather] AI Normalized: "${rawCity}" -> "${stdName}"`);
        return stdName;

    } catch (e) {
        return 'Ho Chi Minh City'; // Fallback
    }
}

async function getCurrentWeather(city) {
    if (!city) return { summary: 'Bạn muốn xem thời tiết ở đâu?' };
    
    // Bước 1: Hỏi AI tên chuẩn
    const queryCity = await normalizeCityWithAI(city);

    try {
        // Bước 2: Gọi API
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryCity)},VN&appid=${API_KEY}&units=metric&lang=vi`;
        const { data } = await axios.get(url);

        const temp = Math.round(data.main.temp);
        const desc = data.weather[0]?.description || '';
        const hum = data.main.humidity;

        return {
            summary: `Tại ${data.name}, trời ${desc}. Nhiệt độ ${temp}°C, độ ẩm ${hum}%.`,
            source: 'openweathermap',
            data: { temp, desc, city: data.name }
        };

    } catch (e) {
        console.error(`[Weather] API Error for ${queryCity}: ${e.message}`);
        return { 
            summary: `Không tìm thấy thời tiết cho "${city}".`,
            source: 'weather-error'
        };
    }
}

module.exports = { getCurrentWeather };