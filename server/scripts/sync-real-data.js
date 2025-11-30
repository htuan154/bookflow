'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { addDocument } = require('../src/api/v1/services/vector.service'); 
const { fetch } = require('undici');
const { supabase } = require('../src/config/supabase'); 

const MONGO_URI = process.env.MONGO_URI; 
const DB_NAME = process.env.MONGO_DB;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

function standardizeProvince(name) {
  const n = name.toLowerCase();
  if (n.includes('huế')) return 'Thừa Thiên Huế';
  if (n.includes('hồ chí minh') || n.includes('sài gòn')) return 'TP Hồ Chí Minh';
  if (n.includes('đà nẵng')) return 'Đà Nẵng';
  if (n.includes('vũng tàu')) return 'Bà Rịa - Vũng Tàu';
  return name; 
}

// HÀM GỌI AI VỚI CƠ CHẾ RETRY
async function callAI(prompt, retries = 1) {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: { temperature: 0.4 } // Tăng nhẹ để văn phong tự nhiên hơn
            })
        });
        const data = await res.json();
        return data.response.trim().replace(/['"]/g, '');
    } catch (e) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000)); // Nghỉ 1s rồi thử lại
            return callAI(prompt, retries - 1);
        }
        throw e;
    }
}

// TẠO NỘI DUNG GIÀU Ý NGHĨA (RICH CONTENT)
async function generateRichContent(name, province, type) {
  let prompt = "";
  
  if (type === 'dish') {
    prompt = `
    Bạn là chuyên gia ẩm thực và văn hóa Việt Nam. Hãy viết một đoạn mô tả hấp dẫn (khoảng 3-4 câu) về món "${name}" ở "${province}".
    
    Yêu cầu nội dung:
    1. Hương vị đặc trưng (cay, mặn, ngọt, thanh...).
    2. Nguyên liệu chính và cách ăn (kèm rau sống, chấm mắm...).
    3. Tại sao nó lại nổi tiếng hoặc là "hồn cốt" của vùng đất này.
    
    Ví dụ Output: "Mì Quảng là tinh hoa ẩm thực Đà Nẵng với sợi mì gạo dày, mềm dai và nước dùng đậm đà được ninh từ tôm thịt. Món ăn này thường được ăn kèm với bánh tráng nướng giòn rụm và rau sống tươi ngon, tạo nên hương vị khó quên cho du khách."
    `;
  } else {
    prompt = `
    Bạn là hướng dẫn viên du lịch chuyên nghiệp. Hãy viết một đoạn giới thiệu lôi cuốn (khoảng 3-4 câu) về địa điểm "${name}" tại "${province}".
    
    Yêu cầu nội dung:
    1. Loại hình (chùa cổ, bãi biển, chợ, di tích...).
    2. Điểm nổi bật nhất (kiến trúc, cảnh quan, ý nghĩa lịch sử).
    3. Các từ khóa quan trọng: "biểu tượng", "lâu đời", "nổi tiếng", "check-in" (nếu phù hợp).
    
    Ví dụ Output: "Cầu Rồng là biểu tượng hiện đại và độc đáo nhất của thành phố Đà Nẵng với thiết kế mô phỏng con rồng thời Lý đang vươn mình ra biển. Cây cầu nổi tiếng với khả năng phun lửa và phun nước vào mỗi tối cuối tuần, thu hút hàng ngàn du khách đến chiêm ngưỡng."
    `;
  }

  try {
    return await callAI(prompt);
  } catch (e) {
    console.warn(`\n⚠️ Lỗi AI khi tạo content cho ${name}: ${e.message}`);
    return `${type === 'place' ? 'Địa điểm' : 'Món ăn'} ${name} nổi tiếng tại ${province}.`; 
  }
}

async function syncData() {
  console.log('🚀 Bắt đầu AUTO-ENRICHMENT DATA (Làm giàu dữ liệu tự động)...');

  // 1. Xóa dữ liệu cũ
  console.log('🗑️  Dọn dẹp Database Vector cũ...');
  await supabase.from('documents').delete().neq('id', 0); 

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  
  const collections = await db.listCollections().toArray();
  
  // 2. Tính tổng số lượng cần xử lý trước
  let totalItems = 0;
  let allItems = []; // Lưu tạm vào mảng để xử lý tuần tự có index

  for (const col of collections) {
    const colName = col.name;
    if (['system', 'admin', 'chat_history', 'conversations', 'messages', 'users', 'notification', 'system_intents'].some(x => colName.startsWith(x))) continue;

    const docs = await db.collection(colName).find({}).toArray();
    for (const doc of docs) {
        const rawProvince = doc.name || doc.province || colName;
        const provinceName = standardizeProvince(rawProvince);
        
        const places = Array.isArray(doc.places) ? doc.places : (doc.pois || []);
        places.forEach(p => allItems.push({ ...p, type: 'place', province: provinceName }));
        
        const dishes = Array.isArray(doc.dishes) ? doc.dishes : (doc.foods || []);
        dishes.forEach(d => allItems.push({ ...d, type: 'dish', province: provinceName }));
    }
  }
  
  totalItems = allItems.length;
  console.log(`📊 Tìm thấy tổng cộng: ${totalItems} mục cần xử lý.\n`);

  // 3. Bắt đầu xử lý từng mục
  for (let i = 0; i < totalItems; i++) {
      const item = allItems[i];
      const indexStr = `[${i + 1}/${totalItems}]`;
      const icon = item.type === 'place' ? '🏰' : '🍜';
      
      process.stdout.write(`${indexStr} ${icon} Đang viết về: ${item.name} (${item.province})... `);
      
      // Gọi AI viết mô tả
      const richContent = await generateRichContent(item.name, item.province, item.type);
      
      // Lưu vào Vector DB
      await addDocument({ 
        content: `${item.name}. ${richContent}`,
        metadata: { name: item.name, type: item.type, province: item.province } 
      });
      
      process.stdout.write(`✅ Xong\n`);
  }

  console.log(`\n🎉 HOÀN TẤT! Đã nâng cấp ${totalItems} mục với trí tuệ nhân tạo.`);
  await client.close();
}

syncData();