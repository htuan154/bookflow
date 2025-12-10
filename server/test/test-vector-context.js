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
    // Thêm 3 câu hỏi mới: 1 vector-search (mô tả), 1 hỏi gợi ý ăn uống (context), 1 hỏi theo dõi (đại từ)

    // Vector test (mô tả một biểu tượng nhưng không nêu tên)
    const vectorQuery1 = "Có cây cầu nào trên sông Hàn mà vào ban đêm có nhiều ánh sáng và thường có màn trình diễn ánh sáng vào cuối tuần không?";
    console.log(`🟣 [LƯỢT 2A - Vector Test] User: "${vectorQuery1}"`);
    const resVector1 = await axios.post(`${AI_URL}/suggest`, { message: vectorQuery1 }, { headers });
    const botAnsVector1 = (resVector1.data.summary || '').toString();
    const places1 = resVector1.data.places || [];
    console.log(`   🤖 Bot: ${botAnsVector1.slice(0, 200)}...`);
    const foundNightBridge = places1.some(p => (p.name || '').toLowerCase().includes('rồng') || (p.description || '').toLowerCase().includes('phun lửa') || (p.description || '').toLowerCase().includes('trình diễn ánh sáng'));
    if (foundNightBridge) {
      console.log('   🎉 PASS (Vector): Có khả năng tìm ra Cầu Rồng / địa danh trình diễn ánh sáng.');
    } else {
      console.log('   ⚠️ FAIL (Vector): Không tìm thấy địa danh phù hợp từ mô tả.');
    }
    console.log('');

    // Context test: yêu cầu gợi ý khu vực ăn uống gần địa danh vừa được nhắc
    const vectorQuery2 = "Nếu tôi muốn tản bộ và ăn hải sản ngon gần đó, bạn gợi ý khu vực nào và quán nào nên thử?";
    console.log(`🟣 [LƯỢT 2B - Context/Recommendations] User: "${vectorQuery2}"`);
    const resVector2 = await axios.post(`${AI_URL}/suggest`, { message: vectorQuery2 }, { headers });
    const botAnsVector2 = (resVector2.data.summary || '').toString();
    console.log(`   🤖 Bot: ${botAnsVector2.slice(0, 240)}...`);
    const mentionsSeafood = botAnsVector2.toLowerCase().includes('hải sản') || botAnsVector2.toLowerCase().includes('quán') || botAnsVector2.toLowerCase().includes('ăn');
    if (mentionsSeafood) {
      console.log('   🎉 PASS (Context): Bot trả lời có gợi ý ăn uống (hải sản/quán/cụm từ liên quan).');
    } else {
      console.log('   ⚠️ INFO (Context): Bot có thể chưa gợi ý ăn uống cụ thể.');
    }
    console.log('');

    // Follow-up test (pronominal reference) - bot should resolve 'Nó' to previously discussed landmark
    const vectorQuery3 = "Nó có dễ tiếp cận bằng phương tiện công cộng không và bến xe gần nhất ở đâu?";
    console.log(`🟣 [LƯỢT 2C - Follow-up / Coref Test] User: "${vectorQuery3}"`);
    const resVector3 = await axios.post(`${AI_URL}/suggest`, { message: vectorQuery3 }, { headers });
    const botAnsVector3 = (resVector3.data.summary || '').toString();
    console.log(`   🤖 Bot: ${botAnsVector3}`);
    if (botAnsVector3.toLowerCase().includes('xe buýt') || botAnsVector3.toLowerCase().includes('bến xe') || botAnsVector3.toLowerCase().includes('trạm')) {
      console.log('   🎉 PASS (Coref): Bot đã hiểu đại từ và trả lời hướng tiếp cận bằng phương tiện công cộng.');
    } else {
      console.log('   ⚠️ INFO (Coref): Kiểm tra xem bot có cần thêm context để liên kết đúng địa danh.');
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ LỖI API:', error.message);
  }
}

runAiTest();