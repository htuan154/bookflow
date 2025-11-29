'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { addDocument } = require('../src/api/v1/services/vector.service'); 
const { fetch } = require('undici');

const MONGO_URI = process.env.MONGO_URI; 
const DB_NAME = process.env.MONGO_DB;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

// Danh sách các items bị lỗi (lấy từ log của bạn)
const FAILED_ITEMS = [
  { name: 'Cao nguyên Sìn Hồ', type: 'place', province: 'Lai Châu' },
  { name: 'Nhà thờ Đức Bà', type: 'place', province: 'TP Hồ Chí Minh' }
];

// Chuẩn hóa tên tỉnh
function standardizeProvince(name) {
  const n = name.toLowerCase();
  if (n.includes('huế')) return 'Thừa Thiên Huế';
  if (n.includes('hồ chí minh') || n.includes('sài gòn')) return 'TP Hồ Chí Minh';
  if (n.includes('đà nẵng')) return 'Đà Nẵng';
  if (n.includes('vũng tàu')) return 'Bà Rịa - Vũng Tàu';
  return name; 
}

// Generate keywords
async function generateKeywords(name, province, type) {
  let prompt = "";
  const nameLower = name.toLowerCase();

  if (type === 'dish') {
    let extraInstruction = "";
    if (nameLower.includes('bún')) extraInstruction = 'BẮT BUỘC phải có các từ khóa: "bún, nước lèo, sợi bún, món nước".';
    else if (nameLower.includes('bánh')) extraInstruction = 'BẮT BUỘC phải có các từ khóa: "bánh, bột, món ăn nhẹ".';
    else if (nameLower.includes('chè')) extraInstruction = 'BẮT BUỘC phải có các từ khóa: "ngọt, tráng miệng, đường, đá".';
    else if (nameLower.includes('cơm')) extraInstruction = 'BẮT BUỘC phải có các từ khóa: "cơm, no bụng, món chính".';

    prompt = `
    Đối tượng: Món ăn "${name}" đặc sản ở "${province}".
    
    YÊU CẦU:
    1. ${extraInstruction}
    2. Liệt kê thêm 5 từ khóa về hương vị (cay, ngọt, mặn...), nguyên liệu chính.
    3. Tuyệt đối KHÔNG nhắc đến phong cảnh, sông núi.
    
    Output: Chỉ trả về danh sách từ khóa cách nhau bởi dấu phẩy.
    `;
  } else {
    let extraInstruction = "";
    if (nameLower.includes('chùa') || nameLower.includes('đền') || nameLower.includes('lăng') || nameLower.includes('nội')) {
        extraInstruction = 'BẮT BUỘC phải có các từ khóa: "cổ kính, rêu phong, tâm linh, lịch sử, kiến trúc".';
    } else if (nameLower.includes('biển') || nameLower.includes('đảo') || nameLower.includes('vịnh')) {
        extraInstruction = 'BẮT BUỘC phải có các từ khóa: "biển xanh, cát trắng, bơi lội, thiên nhiên".';
    }

    prompt = `
    Đối tượng: Địa điểm du lịch "${name}" ở "${province}".
    
    YÊU CẦU:
    1. ${extraInstruction}
    2. Liệt kê 5 từ khóa về đặc điểm nổi bật và hoạt động tham quan.
    
    Output: Chỉ trả về danh sách từ khóa cách nhau bởi dấu phẩy.
    `;
  }

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct',
        prompt: prompt,
        stream: false,
        options: { temperature: 0.2 }
      })
    });
    
    const data = await res.json();
    return data.response.trim().replace(/\n/g, ', ').replace(/[.]/g, ''); 
  } catch (e) {
    console.error(`   ⚠️  Lỗi khi generate keywords: ${e.message}`);
    return name; 
  }
}

async function retryFailedItems() {
  console.log('🔄 Bắt đầu RETRY các items bị lỗi...\n');

  let successCount = 0;
  let failCount = 0;

  for (const item of FAILED_ITEMS) {
    try {
      console.log(`🔧 Đang retry: [${item.type}] ${item.name} (${item.province})...`);
      
      const keywords = await generateKeywords(item.name, item.province, item.type);
      
      let contentToEmbed;
      if (item.type === 'place') {
        contentToEmbed = `Địa điểm ${item.name} tại ${item.province}. Đặc điểm: ${keywords}.`;
      } else {
        contentToEmbed = `Món ăn ${item.name} đặc sản ${item.province}. Hương vị: ${keywords}.`;
      }
      
      await addDocument({ 
        content: contentToEmbed, 
        metadata: { name: item.name, type: item.type, province: item.province } 
      });
      
      console.log(`   ✅ Thành công!\n`);
      successCount++;
      
      // Delay nhỏ để tránh quá tải
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Thất bại: ${error.message}\n`);
      failCount++;
    }
  }

  console.log('\n📊 KẾT QUẢ RETRY:');
  console.log(`   ✅ Thành công: ${successCount}/${FAILED_ITEMS.length}`);
  console.log(`   ❌ Thất bại: ${failCount}/${FAILED_ITEMS.length}`);
}

retryFailedItems().catch(console.error);
