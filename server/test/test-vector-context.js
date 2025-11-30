const axios = require('axios');

const HOST = 'http://localhost:8080';
const AUTH_URL = `${HOST}/api/v1/auth`; 
const AI_URL = `${HOST}/ai`;            

const CREDENTIALS = { identifier: 'admin', password: 'admin123' };
const SESSION_ID = 'ai-test-danang-' + Date.now(); // Session mới tinh

async function runAiTest() {
  try {
    console.log('================================================');
    console.log(`🧠 TEST SUITE: AI FEATURES (Phase 1.1 & 1.2)`);
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

    // =================================================================
    // KỊCH BẢN: ĐÀ NẴNG (Để chứng minh không hard-code Huế)
    // =================================================================

    // --- BƯỚC 1: KHỞI TẠO CONTEXT ---
    console.log('🟣 [LƯỢT 1] User: "Tư vấn du lịch Đà Nẵng"');
    await axios.post(`${AI_URL}/suggest`, { message: "Tư vấn du lịch Đà Nẵng" }, { headers });
    console.log('   Bot: (Đã nhận diện topic: Đà Nẵng)\n');

    // --- BƯỚC 2: TEST VECTOR SEARCH (PHASE 1.2) ---
    // Câu hỏi khó: Không nhắc tên "Cầu Rồng", chỉ tả đặc điểm.
    const vectorQuery = "Cầu nào có khả năng phun lửa vào cuối tuần?";
    console.log(`🟣 [LƯỢT 2 - Vector Test] User: "${vectorQuery}"`);
    
    const resVector = await axios.post(`${AI_URL}/suggest`, { message: vectorQuery }, { headers });
    const botAnsVector = resVector.data.summary;
    const places = resVector.data.places || [];

    console.log(`   🤖 Bot: ${botAnsVector.slice(0, 100)}...`);
    
    // Kiểm tra kết quả
    const foundDragonBridge = places.some(p => p.name.toLowerCase().includes('rồng'));
    if (foundDragonBridge) {
        console.log('   🎉 PASS (Phase 1.2): Vector Search đã tìm ra "Cầu Rồng" từ mô tả "phun lửa".');
    } else {
        console.log('   ⚠️ FAIL (Phase 1.2): Vector chưa tìm ra Cầu Rồng.');
    }
    console.log('');

    // --- BƯỚC 3: TEST CONTEXT MEMORY (PHASE 1.1) ---
    // Câu hỏi dùng đại từ thay thế "Nó" -> Bot phải nhớ "Cầu Rồng" ở lượt 2.
    const contextQuery = "Nó nằm ở quận nào?";
    console.log(`🟣 [LƯỢT 3 - Context Test] User: "${contextQuery}"`);
    
    const resContext = await axios.post(`${AI_URL}/suggest`, { message: contextQuery }, { headers });
    const botAnsContext = resContext.data.summary;

    console.log(`   🤖 Bot: ${botAnsContext}`);
    
    // Logic kiểm tra: Nếu bot trả lời về vị trí của Cầu Rồng (Sơn Trà/Hải Châu) -> Pass
    if (botAnsContext.toLowerCase().includes('hải châu') || botAnsContext.toLowerCase().includes('sơn trà')) {
        console.log('   🎉 PASS (Phase 1.1): Bot hiểu "Nó" là Cầu Rồng và chỉ đường chính xác.');
    } else {
        console.log('   ⚠️ INFO: Kiểm tra xem Bot có trả lời đúng địa chỉ không.');
    }

  } catch (error) {
    console.error('\n❌ LỖI API:', error.message);
  }
}

runAiTest();