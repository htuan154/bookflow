'use strict';

/**
 * Data Service - AI Auto-Tagging & Sync
 * Tái sử dụng logic từ scripts/sync-real-data.js
 */

const { getDb } = require('../../../config/mongodb');
const { addDocument } = require('./vector.service');
const { fetch } = require('undici');

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

// ============================================================
// 1. CHUẨN HÓA TÊN TỈNH (Giữ nguyên logic từ script)
// ============================================================
function standardizeProvince(name) {
  const n = name.toLowerCase();
  if (n.includes('huế')) return 'Thừa Thiên Huế';
  if (n.includes('hồ chí minh') || n.includes('sài gòn')) return 'TP Hồ Chí Minh';
  if (n.includes('đà nẵng')) return 'Đà Nẵng';
  if (n.includes('vũng tàu')) return 'Bà Rịa - Vũng Tàu';
  return name;
}

// ============================================================
// 2. AI AUTO-TAGGING (Giữ nguyên Prompt đã duyệt)
// ============================================================
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
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.2 }
      })
    });
    
    const data = await res.json();
    return data.response.trim().replace(/\n/g, ', ').replace(/[.]/g, '');
  } catch (e) {
    console.error('[DataService] generateKeywords error:', e.message);
    return name; // Fallback: dùng tên gốc
  }
}

// ============================================================
// 3. THÊM ĐỊA ĐIỂM (Place)
// ============================================================
async function addPlace({ name, province, description = '' }) {
  try {
    // Bước 1: Chuẩn hóa tên tỉnh
    const provinceName = standardizeProvince(province);
    
    // Bước 2: Gọi AI sinh keywords
    console.log(`[DataService] Generating keywords for place: ${name}...`);
    const keywords = await generateKeywords(name, provinceName, 'place');
    
    // Bước 3: Lưu vào MongoDB
    const db = getDb();
    const collection = db.collection(provinceName); // Collection theo tên tỉnh
    
    const placeDoc = {
      name,
      description,
      type: 'place',
      province: provinceName,
      keywords,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Kiểm tra trùng lặp (theo tên + tỉnh)
    const existing = await collection.findOne({ 
      name, 
      type: 'place',
      province: provinceName 
    });
    
    if (existing) {
      // Cập nhật nếu đã tồn tại
      await collection.updateOne(
        { _id: existing._id },
        { $set: { description, keywords, updated_at: new Date() } }
      );
      console.log(`[DataService] Updated existing place: ${name}`);
    } else {
      // Thêm mới
      await collection.insertOne(placeDoc);
      console.log(`[DataService] Inserted new place: ${name}`);
    }
    
    // Bước 4: Lưu Vector vào Supabase
    const contentToEmbed = `Địa điểm ${name} tại ${provinceName}. Đặc điểm: ${keywords}. ${description}`;
    
    await addDocument({
      content: contentToEmbed,
      metadata: { name, type: 'place', province: provinceName }
    });
    
    console.log(`[DataService] ✅ Place "${name}" synced successfully`);
    
    return {
      success: true,
      data: {
        name,
        province: provinceName,
        keywords,
        description
      }
    };
  } catch (error) {
    console.error('[DataService] addPlace error:', error);
    throw error;
  }
}

// ============================================================
// 4. THÊM MÓN ĂN (Dish)
// ============================================================
async function addDish({ name, province, description = '' }) {
  try {
    // Bước 1: Chuẩn hóa tên tỉnh
    const provinceName = standardizeProvince(province);
    
    // Bước 2: Gọi AI sinh keywords
    console.log(`[DataService] Generating keywords for dish: ${name}...`);
    const keywords = await generateKeywords(name, provinceName, 'dish');
    
    // Bước 3: Lưu vào MongoDB
    const db = getDb();
    const collection = db.collection(provinceName);
    
    const dishDoc = {
      name,
      description,
      type: 'dish',
      province: provinceName,
      keywords,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Kiểm tra trùng lặp
    const existing = await collection.findOne({ 
      name, 
      type: 'dish',
      province: provinceName 
    });
    
    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        { $set: { description, keywords, updated_at: new Date() } }
      );
      console.log(`[DataService] Updated existing dish: ${name}`);
    } else {
      await collection.insertOne(dishDoc);
      console.log(`[DataService] Inserted new dish: ${name}`);
    }
    
    // Bước 4: Lưu Vector vào Supabase
    const contentToEmbed = `Món ăn ${name} đặc sản ${provinceName}. Hương vị: ${keywords}.`;
    
    await addDocument({
      content: contentToEmbed,
      metadata: { name, type: 'dish', province: provinceName }
    });
    
    console.log(`[DataService] ✅ Dish "${name}" synced successfully`);
    
    return {
      success: true,
      data: {
        name,
        province: provinceName,
        keywords,
        description
      }
    };
  } catch (error) {
    console.error('[DataService] addDish error:', error);
    throw error;
  }
}

module.exports = {
  standardizeProvince,
  generateKeywords,
  addPlace,
  addDish
};
