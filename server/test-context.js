const axios = require('axios');

// CẤU HÌNH PATH
const HOST = 'http://localhost:8080';
const AUTH_URL = `${HOST}/api/v1/auth`; // Auth nằm trong /api/v1
const AI_URL = `${HOST}/ai`;            // AI nằm ở root /ai (theo file index.js của bạn)

const CREDENTIALS = {
  identifier: 'admin', 
  password: 'admin123' // Kiểm tra lại pass của bạn (trong file cũ là 123456, file mới bạn gửi là admin123)
};

const SESSION_ID = 'test-session-' + Date.now();

async function runTest() {
  try {
    console.log('------------------------------------------------');
    console.log(`🔐 Đang đăng nhập với tài khoản: ${CREDENTIALS.identifier}...`);

    // BƯỚC 1: LOGIN (Dùng AUTH_URL)
    let token = null;
    try {
      const loginRes = await axios.post(`${AUTH_URL}/login`, CREDENTIALS);
      const result = loginRes.data.data; 
      token = result.accessToken || result.token || result.access?.token;
      
      if (!token) throw new Error('Không tìm thấy Token');
      console.log('✅ Đăng nhập thành công!');
    } catch (loginErr) {
      console.error('❌ Đăng nhập thất bại:', loginErr.response?.data?.message || loginErr.message);
      // Fallback nếu cần
      if (CREDENTIALS.identifier === 'admin') {
          console.log('⚠️ Thử lại với email...');
          const retryRes = await axios.post(`${AUTH_URL}/login`, { ...CREDENTIALS, identifier: 'admin@bookflow.com' });
          token = retryRes.data.data.accessToken;
          console.log('✅ Đăng nhập lại thành công!');
      } else return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-session-id': SESSION_ID,
      'Authorization': `Bearer ${token}`
    };

    // BƯỚC 2: TEST REVIEW (Dùng AI_URL)
    // URL đúng phải là: http://localhost:8080/ai/suggest
    console.log('\n🔵 [LƯỢT 1] User: "Review Eo Gió"...');
    const res1 = await axios.post(`${AI_URL}/suggest`, 
      { message: "Review Eo Gió" }, 
      { headers }
    );
    console.log(`🤖 Bot: ${res1.data.summary.slice(0, 100)}...`);

    await new Promise(r => setTimeout(r, 1000));

    // BƯỚC 3: TEST HỎI GIÁ (Dùng AI_URL)
    console.log('\n🔵 [LƯỢT 2] User: "Vé bao nhiêu?"...');
    const res2 = await axios.post(`${AI_URL}/suggest`, 
      { message: "Vé bao nhiêu?" }, 
      { headers }
    );
    
    console.log(`🤖 Bot: ${res2.data.summary}`);
    
    const answer = res2.data.summary.toLowerCase();
    if (answer.includes('eo gió') || answer.includes('25.000') || answer.includes('bình định')) {
      console.log('\n🎉 TEST PASS: Bot nhớ ngữ cảnh!');
    } else {
      console.log('\n❌ TEST FAIL: Bot trả lời sai.');
    }

  } catch (error) {
    // Log chi tiết lỗi 404/500 để debug
    console.error('\n❌ LỖI API:', error.response ? `${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}` : error.message);
  }
}

runTest();