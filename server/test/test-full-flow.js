const axios = require('axios');

const HOST = 'http://localhost:8080';
const AUTH_URL = `${HOST}/api/v1/auth`;
const AI_URL = `${HOST}/ai`;

const CREDENTIALS = { identifier: 'admin', password: 'admin123' };
const SESSION_ID = `test-full-flow-${Date.now()}`;

// KỊCH BẢN TEST FULL LUỒNG (UPDATED: TP. HỒ CHÍ MINH)
const SCENARIOS = [
    {
        step: 1,
        desc: "👋 Kich hoat / Chitchat",
        msg: "Xin chào, bạn biết gì về Thành phố Hồ Chí Minh?"
    },
    {
        step: 2,
        desc: "🧠 Vector Search (Override Intent)",
        msg: "Ngôi chợ nào là biểu tượng lâu đời nhất ở đây?"
        // Kỳ vọng: Tìm ra "Chợ Bến Thành"
    },
    {
        step: 3,
        desc: "🔗 Context Follow-up (Hỏi nối tiếp)",
        msg: "Nó nằm ở quận nào?"
        // Kỳ vọng: Bot hiểu "Nó" là Chợ Bến Thành -> Trả lời "Quận 1"
    },
    {
        step: 4,
        desc: "⛅ Real-time Weather (Thời tiết)",
        msg: "Thời tiết ở đó hôm nay thế nào?"
        // Kỳ vọng: Gọi OpenWeatherMap cho TP.HCM
    },
    {
        step: 4,
        desc: "Giới thiệu về Eo gió",
        msg: "Giới thiệu về Eo gió"
    },
    {
        step: 5,
        desc: "⛅ Real-time Weather (Thời tiết)",
        msg: "Thời tiết Hà Nội hôm nay thế nào?"
        // Kỳ vọng: Gọi OpenWeatherMap cho Hà Nội
    }
];

async function runTest() {
    try {
        console.log('================================================');
        console.log(`🤖 TEST SUITE: FULL LUỒNG AI (TP.HCM)`);
        console.log(`🔑 Session ID: ${SESSION_ID}`);
        console.log('================================================');

        // 1. LOGIN
        let token = null;
        try {
            const loginRes = await axios.post(`${AUTH_URL}/login`, CREDENTIALS);
            token = loginRes.data.data.accessToken || loginRes.data.data.token;
            console.log('✅ Login OK.\n');
        } catch (e) {
            const retryRes = await axios.post(`${AUTH_URL}/login`, { ...CREDENTIALS, identifier: 'admin@bookflow.com' });
            token = retryRes.data.data.accessToken;
            console.log('✅ Login OK (Fallback).\n');
        }

        const headers = {
            'Content-Type': 'application/json',
            'x-session-id': SESSION_ID,
            'Authorization': `Bearer ${token}`
        };

        // CHẠY CÁC KỊCH BẢN
        for (const scenario of SCENARIOS) {
            console.log(`\n🔹 [BƯỚC ${scenario.step}] ${scenario.desc}`);
            console.log(`   🗣️ User: "${scenario.msg}"`);

            const start = Date.now();
            
            try {
                const res = await axios.post(`${AI_URL}/suggest`, { message: scenario.msg }, { headers });
                const latency = Date.now() - start;

                const data = res.data;
                const summary = data.summary ? data.summary.slice(0, 150) + "..." : "No summary";
                const source = data.source || data.type || 'unknown';
                const context = data.next_context || {};
                const places = data.places || [];

                console.log(`   🤖 Bot: ${summary}`);
                console.log(`   ℹ️ Nguồn: [${source}] | ⏱️ ${latency}ms`);
                console.log(`   🧠 Context: Entity="${context.entity_name || 'N/A'}" | City="${context.city || 'N/A'}"`);
                
                if (places.length > 0) {
                    console.log(`   📍 Places: ${places.slice(0, 3).map(p => p.name).join(', ')}`);
                }

            } catch (err) {
                console.error(`   ❌ Lỗi: ${err.message}`);
                if (err.response) {
                    console.error(`   ❌ API Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
                }
            }
            
            // Delay giữa các request
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("\n=================================================");
        console.log("✅ HOÀN TẤT KIỂM TRA FULL FLOW.");

    } catch (error) {
        console.error('\n❌ LỖI:', error.message);
    }
}

runTest();