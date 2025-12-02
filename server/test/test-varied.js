const axios = require('axios');

const HOST = 'http://localhost:8080';
const AI_URL = `${HOST}/ai`;
const AUTH_URL = `${HOST}/api/v1/auth`;

// Session ID mới toanh để không bị dính context cũ
const SESSION_ID = `test-varied-${Date.now()}`;
const CREDENTIALS = { identifier: 'admin', password: 'admin123' };

const SCENARIOS = [
    // 1. Test Typo cực nặng + Địa danh nổi tiếng (Sapa)
    {
        desc: "Kiểm tra Typo & Weather Logic (Sapa)",
        msg: "thoi tiet tren dinh phan xi pang hom nay the nao"
        // Kỳ vọng: Sửa thành "đỉnh Fansipan", Weather tìm "Sa Pa" (Lào Cai)
    },
    // 2. Test Context Flow (Hỏi ăn gì ở đó)
    {
        desc: "Hỏi ẩm thực theo Context cũ (Sapa)",
        msg: "Lên đó thì nên ăn món gì cho ấm bụng?"
        // Kỳ vọng: Gợi ý "Thắng cố" hoặc lẩu (Dựa trên data Lào Cai)
    },
    // 3. Test Switch Context sang Biển (Nha Trang) - Hỏi tự nhiên
    {
        desc: "Đổi chủ đề sang biển (Nha Trang)",
        msg: "Thôi lạnh lắm, tôi thích đi biển hơn. Ponagar có gì hay không?"
        // Kỳ vọng: Nhận diện "Ponagar" -> Khánh Hòa -> Giới thiệu Tháp Bà
    },
    // 4. Test Query "Bún sứa" (Đã nạp data)
    {
        desc: "Tìm món ăn cụ thể (Đã fix lỗi cũ)",
        msg: "Tôi thèm bún sứa, bạn biết chỗ nào chuẩn vị không?"
        // Kỳ vọng: Tìm ra "Bún sứa Nha Trang" (Không bịa ra món khác nữa)
    },
    // 5. Test Địa điểm cụ thể ở Đà Lạt (Đã fix lỗi cũ)
    {
        desc: "Hỏi địa điểm cụ thể (Đà Lạt)",
        msg: "Cuối tuần lên Đà Lạt thì đường hầm đất sét có mở cửa không?"
        // Kỳ vọng: Tìm ra "Đường Hầm Điêu Khắc" (Lâm Đồng) chính xác.
    },
    // 6. Test Câu hỏi trừu tượng/Cảm xúc
    {
        desc: "Câu hỏi dựa trên cảm xúc (Vibe)",
        msg: "Chỗ nào ở đó chill chill để ngắm hoàng hôn?"
        // Kỳ vọng: Tìm trong vector Đà Lạt (Hồ Xuân Hương/Langbiang)
    }
];

async function runTest() {
    console.log('================================================');
    console.log(`🌍 TEST SUITE: DU LỊCH ĐA DẠNG (PURE AI)`);
    console.log(`🔑 Session: ${SESSION_ID}`);
    console.log('================================================');

    // Login lấy token
    let token;
    try {
        const res = await axios.post(`${AUTH_URL}/login`, CREDENTIALS);
        token = res.data.data.accessToken || res.data.data.token;
    } catch(e) { console.error("Login lỗi:", e.message); return; }

    const headers = { 
        'Content-Type': 'application/json', 
        'x-session-id': SESSION_ID,
        'Authorization': `Bearer ${token}`
    };

    for (const s of SCENARIOS) {
        console.log(`\n🔹 ${s.desc}`);
        console.log(`   🗣️ "${s.msg}"`);
        
        try {
            const start = Date.now();
            const res = await axios.post(`${AI_URL}/suggest`, { message: s.msg }, { headers });
            
            const d = res.data;
            const summary = d.summary ? d.summary.slice(0, 120) + "..." : "No summary";
            const ctx = d.next_context || {};
            
            console.log(`   🤖 ${summary}`);
            console.log(`   ⏱️ ${Date.now() - start}ms | 🧠 City: ${ctx.city} | Entity: ${ctx.last_entity_name}`);
            
            if (d.places && d.places.length > 0) {
                console.log(`   📍 Gợi ý: ${d.places.map(p => p.name).join(', ')}`);
            }
        } catch (e) {
            console.error(`   ❌ Lỗi: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

runTest();