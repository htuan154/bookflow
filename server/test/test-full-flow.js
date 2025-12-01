const axios = require('axios');

const HOST = 'http://localhost:8080';
const AUTH_URL = `${HOST}/api/v1/auth`;
const AI_URL = `${HOST}/ai`;

const CREDENTIALS = { identifier: 'admin', password: 'admin123' };
const SESSION_ID = `test-full-flow-${Date.now()}`;

// KỊCH BẢN TEST FULL LUỒNG (UPDATED: THÊM PROMOTION)
const SCENARIOS = [
    {
        step: 1,
        desc: "👋 Kích hoạt / Hỏi chung (Đà Nẵng)",
        msg: "Sắp tới tôi định đi du lịch Đà Nẵng, bạn gợi ý vài địa điểm nổi tiếng được không?"
    },
    {
        step: 2,
        desc: "🍜 Vector Search (Ẩm thực đặc sản)",
        msg: "Nghe nói ở đây có món Mì Quảng ếch rất ngon, quán nào bán món này?"
    },
    {
        step: 3,
        desc: "🔗 Context Follow-up (Hỏi chi tiết về Entity trước)",
        msg: "Giá một phần ăn ở đó khoảng bao nhiêu?"
    },
    {
        step: 4,
        desc: "⛅ Real-time Weather (Contextual - Thời tiết tại context cũ)",
        msg: "Thời tiết ngoài đó hôm nay có mưa không?"
    },
    {
        step: 5,
        desc: "🔄 Context Switch (Đổi chủ đề sang Huế)",
        msg: "Nếu tôi muốn ra Huế tham quan Đại Nội thì sao?"
    },
    {
        step: 6,
        desc: "⛅ Explicit Weather (Thời tiết địa điểm mới)",
        msg: "Thời tiết ở Huế hiện tại thế nào?"
    },
    {
        step: 7,
        desc: "🎁 Promotion Search (Tìm mã giảm giá theo thời gian)",
        msg: "Có mã giảm giá nào cho tháng 12 không?" 
        // Kỳ vọng: Intent ask_promotions, lọc theo tháng 12
    },
    {
        step: 8,
        desc: "🏨 SQL Query (Tìm khách sạn)",
        msg: "Top 5 khách sạn Thành phố Hồ Chí Minh" 
    },
    {
        step: 9,
        desc: "✍️ Auto Typo Correction (Viết sai chính tả & Teencode)",
        msg: "dia chi chua thien mu o cho nao" 
    }
];

async function runTest() {
    try {
        console.log('================================================');
        console.log(`🤖 TEST SUITE: FULL LUỒNG AI (CÓ PROMOTION)`);
        console.log(`🔑 Session ID: ${SESSION_ID}`);
        console.log('================================================');

        // 1. LOGIN
        let token = null;
        try {
            const loginRes = await axios.post(`${AUTH_URL}/login`, CREDENTIALS);
            token = loginRes.data.data.accessToken || loginRes.data.data.token;
            console.log('✅ Login OK.\n');
        } catch (e) {
            try {
                const retryRes = await axios.post(`${AUTH_URL}/login`, { ...CREDENTIALS, identifier: 'admin@bookflow.com' });
                token = retryRes.data.data.accessToken;
                console.log('✅ Login OK (Fallback).\n');
            } catch (err2) {
                console.error('❌ Login Failed:', err2.message);
                return;
            }
        }

        const headers = {
            'Content-Type': 'application/json',
            'x-session-id': SESSION_ID,
            'Authorization': `Bearer ${token}`
        };

        // CHẠY CÁC KỊCH BẢN
        for (const scenario of SCENARIOS) {
            if (!scenario || !scenario.step) continue; 

            console.log(`\n🔹 [BƯỚC ${scenario.step}] ${scenario.desc || 'No description'}`);
            console.log(`   🗣️ User: "${scenario.msg}"`);

            const start = Date.now();
            
            try {
                const res = await axios.post(`${AI_URL}/suggest`, { message: scenario.msg }, { headers });
                const latency = Date.now() - start;

                const data = res.data;
                const summary = data.summary ? data.summary.slice(0, 150).replace(/\n/g, ' ') + "..." : "No summary";
                const source = data.source || data.type || 'unknown';
                const context = data.next_context || {};
                const places = data.places || []; // Hoặc promotions nếu có

                console.log(`   🤖 Bot: ${summary}`);
                console.log(`   ℹ️ Nguồn: [${source}] | ⏱️ ${latency}ms`);
                console.log(`   🧠 Context State: Entity="${context.last_entity_name || context.entity_name || 'N/A'}" | City="${context.city || 'N/A'}"`);
                
                // Hiển thị thêm thông tin nếu là Promotion
                if (data.replyPayload && data.replyPayload.promotions && data.replyPayload.promotions.length > 0) {
                     console.log(`   🎟️ Tìm thấy ${data.replyPayload.promotions.length} mã giảm giá.`);
                } else if (places.length > 0) {
                    console.log(`   📍 Gợi ý: ${places.slice(0, 3).map(p => p.name).join(', ')}`);
                }

            } catch (err) {
                console.error(`   ❌ Lỗi: ${err.message}`);
                if (err.response) {
                    console.error(`   ❌ API Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
                }
            }
            
            await new Promise(r => setTimeout(r, 1500));
        }

        console.log("\n=================================================");
        console.log("✅ HOÀN TẤT KIỂM TRA FULL FLOW.");

    } catch (error) {
        console.error('\n❌ LỖI SYSTEM:', error.message);
    }
}

runTest();