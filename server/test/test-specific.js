const axios = require('axios');

// CẤU HÌNH SERVER
const HOST = 'http://localhost:8080';
const AUTH_URL = `${HOST}/api/v1/auth`;
const AI_URL = `${HOST}/ai`;

// TÀI KHOẢN ADMIN (Hoặc user có sẵn trong DB của bạn)
const CREDENTIALS = { identifier: 'admin', password: 'admin123' };
const SESSION_ID = `test-sql-routing-${Date.now()}`;

// 3 CÂU HỎI TEST LOGIC
const SCENARIOS = [
    {
        step: 1,
        desc: "🎁 [SQL] Tìm khuyến mãi theo tháng",
        msg: "Top 5 phiếu khuyến mãi tháng 12",
        expected: "Intent: ask_promotions | Time: month | Gọi hàm: promotions_by_keyword_city_month"
    },
    {
        step: 2,
        desc: "🏨 [SQL] Tìm Top khách sạn (Cơ bản)",
        msg: "Top 5 khách sạn Hồ Chí Minh",
        expected: "Intent: ask_hotels | Amenities: [] | Gọi hàm: top_hotels_by_city"
    },
    {
        step: 3,
        desc: "🏊 [SQL] Tìm khách sạn theo tiện ích (Hồ bơi)",
        msg: "Khách sạn có hồ bơi ở Hồ Chí Minh",
        expected: "Intent: ask_hotels | Amenities: ['hồ bơi'] | Gọi hàm: hotels_by_city_with_amenities"
    }
];

async function runTest() {
    try {
        console.log('================================================');
        console.log(`🧪 TEST SUITE: KIỂM TRA SQL ROUTING`);
        console.log(`🔑 Session ID: ${SESSION_ID}`);
        console.log('================================================');

        // 1. LOGIN
        let token = null;
        try {
            const loginRes = await axios.post(`${AUTH_URL}/login`, CREDENTIALS);
            token = loginRes.data.data.accessToken || loginRes.data.data.token;
            console.log('✅ Login thành công.\n');
        } catch (e) {
            // Fallback login
            try {
                const retryRes = await axios.post(`${AUTH_URL}/login`, { ...CREDENTIALS, identifier: 'admin@bookflow.com' });
                token = retryRes.data.data.accessToken;
                console.log('✅ Login thành công (Fallback).\n');
            } catch (err2) {
                console.error('❌ Login thất bại. Kiểm tra lại server/db:', err2.message);
                return;
            }
        }

        const headers = {
            'Content-Type': 'application/json',
            'x-session-id': SESSION_ID,
            'Authorization': `Bearer ${token}`
        };

        // 2. CHẠY TEST
        for (const scenario of SCENARIOS) {
            console.log(`\n🔹 [TEST ${scenario.step}] ${scenario.desc}`);
            console.log(`   🗣️ User: "${scenario.msg}"`);
            console.log(`   🎯 Kỳ vọng: ${scenario.expected}`);

            const start = Date.now();
            
            try {
                const res = await axios.post(`${AI_URL}/suggest`, { message: scenario.msg }, { headers });
                const latency = Date.now() - start;
                const data = res.data;
                
                // Phân tích kết quả trả về
                const source = data.source || 'unknown';
                const summary = data.summary ? data.summary.slice(0, 100).replace(/\n/g, ' ') + "..." : "No summary";
                
                // Kiểm tra payload để xem có data SQL không
                const replyPayload = data.replyPayload || {};
                const hotels = replyPayload.hotels || data.hotels || [];
                const promotions = replyPayload.promotions || data.promotions || [];

                console.log(`   🤖 Bot trả lời: "${summary}"`);
                console.log(`   ℹ️ Nguồn dữ liệu: [${source}] | ⏱️ ${latency}ms`);

                if (hotels.length > 0) {
                    console.log(`   ✅ Đã tìm thấy ${hotels.length} khách sạn.`);
                    console.log(`      VD: ${hotels[0].name} (${hotels[0].city || 'N/A'})`);
                } else if (promotions.length > 0) {
                    console.log(`   ✅ Đã tìm thấy ${promotions.length} khuyến mãi.`);
                    console.log(`      VD: Code [${promotions[0].code}] - ${promotions[0].name || promotions[0].description || ''}`);
                } else {
                    console.log(`   ⚠️ Không tìm thấy dữ liệu SQL (Check lại DB hoặc Logic NLU).`);
                }

            } catch (err) {
                console.error(`   ❌ Lỗi API: ${err.message}`);
            }
            
            // Nghỉ 1 chút giữa các request
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("\n=================================================");
        console.log("✅ HOÀN TẤT.");

    } catch (error) {
        console.error('\n❌ LỖI HỆ THỐNG:', error.message);
    }
}

runTest();