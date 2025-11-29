'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { addDocument } = require('../src/api/v1/services/vector.service'); 
const { fetch } = require('undici');
const { supabase } = require('../src/config/supabase'); 

const MONGO_URI = process.env.MONGO_URI; 
const DB_NAME = process.env.MONGO_DB;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

// 1. Chuẩn hóa tên tỉnh
function standardizeProvince(name) {
  const n = name.toLowerCase();
  if (n.includes('huế')) return 'Thừa Thiên Huế';
  if (n.includes('hồ chí minh') || n.includes('sài gòn')) return 'TP Hồ Chí Minh';
  if (n.includes('đà nẵng')) return 'Đà Nẵng';
  if (n.includes('vũng tàu')) return 'Bà Rịa - Vũng Tàu';
  return name; 
}

// 2. Prompt chuyên biệt (AI Tagging) - ĐÃ CẢI TIẾN
async function generateKeywords(name, province, type) {
  let prompt = "";
  const nameLower = name.toLowerCase();

  if (type === 'dish') {
    // Logic ép cứng từ khóa để tránh nhầm lẫn giữa các món
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
    // Logic ép cứng từ khóa cho địa điểm
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
    return name; 
  }
}

async function syncData() {
  console.log('🚀 Bắt đầu QUY TRÌNH RESET & SYNC TOÀN BỘ DỮ LIỆU...');

  // --- BƯỚC 1: XÓA SẠCH BẢNG VECTOR CŨ ---
  // Lệnh này sẽ xóa toàn bộ dữ liệu trong bảng documents
  console.log('🗑️  Đang xóa toàn bộ dữ liệu cũ trong Supabase...');
  const { error: delErr } = await supabase.from('documents').delete().neq('id', 0); 
  
  if (delErr) {
    console.error('❌ Lỗi khi xóa dữ liệu cũ (có thể bảng trống):', delErr.message);
  } else {
    console.log('✅ Đã dọn sạch Database. Sẵn sàng nạp mới.');
  }

  // --- BƯỚC 2: KẾT NỐI MONGODB & NẠP DATA ---
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  
  const collections = await db.listCollections().toArray();
  let totalProcessed = 0;

  for (const col of collections) {
    const colName = col.name;
    // Bỏ qua các bảng hệ thống
    if (['system', 'admin', 'chat_history', 'conversations', 'messages', 'users', 'notification'].some(x => colName.startsWith(x))) continue;

    const docs = await db.collection(colName).find({}).toArray();

    for (const doc of docs) {
      const rawProvince = doc.name || doc.province || colName;
      const provinceName = standardizeProvince(rawProvince);

      console.log(`\n📂 Đang xử lý tỉnh: ${provinceName}`);

      // Xử lý Places
      const places = Array.isArray(doc.places) ? doc.places : (doc.pois || []);
      for (const p of places) {
          process.stdout.write(`   🏰 [${totalProcessed}] Place: ${p.name}... `);
          const keywords = await generateKeywords(p.name, provinceName, 'place');
          
          const contentToEmbed = `Địa điểm ${p.name} tại ${provinceName}. Đặc điểm: ${keywords}. ${p.description || ''}`;
          
          await addDocument({ 
            content: contentToEmbed, 
            metadata: { name: p.name, type: 'place', province: provinceName } 
          });
          console.log("✅");
          totalProcessed++;
      }
      
      // Xử lý Dishes
      const dishes = Array.isArray(doc.dishes) ? doc.dishes : (doc.foods || []);
      for (const d of dishes) {
          process.stdout.write(`   🍜 [${totalProcessed}] Dish: ${d.name}... `);
          const keywords = await generateKeywords(d.name, provinceName, 'dish');
          
          const contentToEmbed = `Món ăn ${d.name} đặc sản ${provinceName}. Hương vị: ${keywords}.`;
          
          await addDocument({ 
            content: contentToEmbed, 
            metadata: { name: d.name, type: 'dish', province: provinceName } 
          });
          console.log("✅");
          totalProcessed++;
      }
    }
  }

  console.log(`\n🎉 HOÀN TẤT TOÀN BỘ! Tổng cộng ${totalProcessed} mục đã được Vector hóa.`);
  await client.close();
}

syncData();