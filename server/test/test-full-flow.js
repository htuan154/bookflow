const axios = require('axios');

const HOST = 'http://localhost:8080';
const AUTH_URL = `${HOST}/api/v1/auth`;
const AI_URL = `${HOST}/ai`;

const CREDENTIALS = { identifier: 'admin', password: 'admin123' };
const SESSION_ID = `test-travel-nhatrang-${Date.now()}`;

// KỊCH BẢN MỚI: NHA TRANG -> ĐÀ LẠT
const SCENARIOS = [
    {
        step: 1,
        desc: "👋 Kích hoạt / Hỏi chung (Nha Trang)",
        msg: "Hè này tôi muốn đi Nha Trang, bạn gợi ý vài địa điểm vui chơi nổi tiếng đi."
    },
    {
        step: 2,
        desc: "🍜 Vector Search (Ẩm thực đặc sản)",
        msg: "Nghe nói ở đây có món Bún sứa rất lạ miệng, quán nào bán ngon?"
    },
    {
        step: 3,
        desc: "🔗 Context Follow-up (Hỏi chi tiết về Entity trước)",
        msg: "Giá một tô ở đó khoảng bao nhiêu tiền?"
    },
    {
        step: 4,
        desc: "⛅ Real-time Weather (Contextual - Thời tiết tại context cũ)",
        msg: "Thời tiết trong đó hôm nay có nắng không?"
    },
    {
        step: 5,
        desc: "🔄 Context Switch (Đổi chủ đề sang Đà Lạt)",
        msg: "Nếu tôi muốn đổi gió lên Đà Lạt check-in Hồ Xuân Hương thì sao?"
    },
    {
        step: 6,
        desc: "⛅ Explicit Weather (Thời tiết địa điểm mới)",
        msg: "Trên đó hiện tại có lạnh không?"
    },
    {
        step: 7,
        desc: "✍️ Auto Typo Correction (Sửa lỗi chính tả địa danh)",
        msg: "duong ham dieu khac o dau vay" 
        // Viết không dấu -> Kỳ vọng AI sửa thành "Đường Hầm Điêu Khắc ở đâu vậy" (Đà Lạt)
    },
    {
        step: 8,
        desc: "🧠 Complex Query (Câu hỏi phức tạp về Context)",
        msg: "Cho tôi biết thêm vài điều thú vị về nó"
        // Context đang là Đường Hầm Điêu Khắc -> Kỳ vọng AI hiểu "nó"
    }
];

async function runTest() {
    try {
        console.log('================================================');
        console.log(`🤖 TEST SUITE: DU LỊCH BIỂN & NÚI (NHA TRANG - ĐÀ LẠT)`);
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

            console.log(`\n🔹 [BƯỚC ${scenario.step}] ${scenario.desc}`);
            console.log(`   🗣️ User: "${scenario.msg}"`);

            const start = Date.now();
            
            try {
                const res = await axios.post(`${AI_URL}/suggest`, { message: scenario.msg }, { headers });
                const latency = Date.now() - start;

                const data = res.data;
                const summary = data.summary ? data.summary.slice(0, 150).replace(/\n/g, ' ') + "..." : "No summary";
                const source = data.source || data.type || 'unknown';
                const context = data.next_context || {};
                const places = data.places || [];

                console.log(`   🤖 Bot: ${summary}`);
                console.log(`   ℹ️ Nguồn: [${source}] | ⏱️ ${latency}ms`);
                
                // Log Context để kiểm tra AI có nhớ bài không
                console.log(`   🧠 Context: City="${context.city || 'N/A'}" | Entity="${context.last_entity_name || 'N/A'}"`);
                
                if (places.length > 0) {
                    console.log(`   📍 Gợi ý Vector: ${places.slice(0, 3).map(p => p.name).join(', ')}`);
                }

            } catch (err) {
                console.error(`   ❌ Lỗi: ${err.message}`);
            }
            
            await new Promise(r => setTimeout(r, 1500));
        }

        console.log("\n=================================================");
        console.log("✅ HOÀN TẤT KIỂM TRA DU LỊCH.");

    } catch (error) {
        console.error('\n❌ LỖI SYSTEM:', error.message);
    }
}

runTest();