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

/**
 * Hàm sinh từ khóa tự động cho món ăn hoặc địa điểm du lịch bằng AI (Ollama).
 * - Tùy loại (dish/place), ép cứng một số từ khóa đặc trưng để tránh nhầm lẫn.
 * - Sinh prompt chi tiết gửi lên AI, yêu cầu trả về danh sách từ khóa mô tả đặc điểm nổi bật.
 * - Nếu lỗi hoặc AI không trả về, fallback dùng tên gốc.
 *
 * @param {string} name - Tên món ăn hoặc địa điểm
 * @param {string} province - Tên tỉnh/thành
 * @param {string} type - 'dish' hoặc 'place'
 * @returns {string} Chuỗi từ khóa mô tả, cách nhau bởi dấu phẩy
 */
async function generateKeywords(name, province, type) {
  let prompt = "";
  const nameLower = name.toLowerCase();

  if (type === 'dish') {
    // Nếu là món ăn, ép cứng một số từ khóa đặc trưng theo loại món    let extraInstruction = "";
    if (nameLower.includes('bún')) extraInstruction = 'BẮT BUỘC phải có các từ khóa: "bún, nước lèo, sợi bún, món nước".';
    else if (nameLower.includes('bánh')) extraInstruction = 'BẮT BUỘC phải có các từ khóa: "bánh, bột, món ăn nhẹ".';
    else if (nameLower.includes('chè')) extraInstruction = 'BẮT BUỘC phải có các từ khóa: "ngọt, tráng miệng, đường, đá".';
    else if (nameLower.includes('cơm')) extraInstruction = 'BẮT BUỘC phải có các từ khóa: "cơm, no bụng, món chính".';

    // Tạo prompt chi tiết cho AI
    prompt = `
    Đối tượng: Món ăn "${name}" đặc sản ở "${province}".
    
    YÊU CẦU:
    1. ${extraInstruction}
    2. Liệt kê thêm 5 từ khóa về hương vị (cay, ngọt, mặn...), nguyên liệu chính.
    3. Tuyệt đối KHÔNG nhắc đến phong cảnh, sông núi.
    
    Output: Chỉ trả về danh sách từ khóa cách nhau bởi dấu phẩy.
    `;
  } else {
    // Nếu là địa điểm, ép cứng một số từ khóa đặc trưng theo loại địa điểm
    let extraInstruction = "";
    if (nameLower.includes('chùa') || nameLower.includes('đền') || nameLower.includes('lăng') || nameLower.includes('nội')) {
        extraInstruction = 'BẮT BUỘC phải có các từ khóa: "cổ kính, rêu phong, tâm linh, lịch sử, kiến trúc".';
    } else if (nameLower.includes('biển') || nameLower.includes('đảo') || nameLower.includes('vịnh')) {
        extraInstruction = 'BẮT BUỘC phải có các từ khóa: "biển xanh, cát trắng, bơi lội, thiên nhiên".';
    }

    // Tạo prompt chi tiết cho AI
    prompt = `
    Đối tượng: Địa điểm du lịch "${name}" ở "${province}".
    
    YÊU CẦU:
    1. ${extraInstruction}
    2. Liệt kê 5 từ khóa về đặc điểm nổi bật và hoạt động tham quan.
    
    Output: Chỉ trả về danh sách từ khóa cách nhau bởi dấu phẩy.
    `;
  }

  try {
    // Gửi prompt lên Ollama để AI sinh từ khóa
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
    
    // Xử lý kết quả trả về, chuẩn hóa thành chuỗi từ khóa
    const data = await res.json();
    return data.response.trim().replace(/\n/g, ', ').replace(/[.]/g, '');
  } catch (e) {
    // Nếu lỗi, fallback dùng tên gốc
    console.error('[DataService] generateKeywords error:', e.message);
    return name;
  }
}

// ============================================================
// 3. THÊM ĐỊA ĐIỂM (Place)
// ============================================================

/**
 * Thêm hoặc cập nhật địa điểm du lịch vào hệ thống (MongoDB + Vector DB).
 * - Chuẩn hóa tên tỉnh/thành để lưu đúng collection.
 * - Sinh từ khóa mô tả bằng AI (Ollama) cho địa điểm.
 * - Kiểm tra trùng lặp: nếu đã có thì cập nhật, chưa có thì thêm mới.
 * - Nhúng dữ liệu vào hệ thống vector để phục vụ tìm kiếm ngữ nghĩa.
 *
 * @param {object} param0 - { name, province, description }
 * @returns {object} Thông tin địa điểm đã lưu/cập nhật
 */
async function addPlace({ name, province, description = '' }) {
  try {
    // Bước 1: Chuẩn hóa tên tỉnh/thành để lưu đúng collection
    const provinceName = standardizeProvince(province);
    
    // Bước 2: Sinh từ khóa mô tả bằng AI cho địa điểm
    console.log(`[DataService] Generating keywords for place: ${name}...`);
    const keywords = await generateKeywords(name, provinceName, 'place');
    
    // Bước 3: Lưu thông tin vào MongoDB (theo collection tỉnh/thành)
    const db = getDb();
    const collection = db.collection(provinceName); // Mỗi tỉnh/thành là một collection
    
    const placeDoc = {
      name,
      description,
      type: 'place',
      province: provinceName,
      keywords,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Kiểm tra trùng lặp (theo tên + tỉnh): nếu đã có thì cập nhật, chưa có thì thêm mới
    const existing = await collection.findOne({ 
      name, 
      type: 'place',
      province: provinceName 
    });
    
    if (existing) {
      // Nếu đã tồn tại, chỉ cập nhật mô tả, từ khóa, thời gian
      await collection.updateOne(
        { _id: existing._id },
        { $set: { description, keywords, updated_at: new Date() } }
      );
      console.log(`[DataService] Updated existing place: ${name}`);
    } else {
      // Nếu chưa có, thêm mới vào collection
      await collection.insertOne(placeDoc);
      console.log(`[DataService] Inserted new place: ${name}`);
    }
    
    // Bước 4: Nhúng dữ liệu vào hệ thống vector để phục vụ tìm kiếm ngữ nghĩa
    const contentToEmbed = `Địa điểm ${name} tại ${provinceName}. Đặc điểm: ${keywords}. ${description}`;
    
    await addDocument({
      content: contentToEmbed,
      metadata: { name, type: 'place', province: provinceName }
    });
    
    console.log(`[DataService] ✅ Place "${name}" synced successfully`);
    
    // Trả về thông tin địa điểm đã lưu/cập nhật
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
    // Nếu lỗi, log ra và throw lại
    console.error('[DataService] addPlace error:', error);
    throw error;
  }
}

// ============================================================
// 4. THÊM MÓN ĂN (Dish)
// ============================================================

/**
 * Thêm hoặc cập nhật món ăn đặc sản vào hệ thống (MongoDB + Vector DB).
 * - Chuẩn hóa tên tỉnh/thành để lưu đúng collection.
 * - Sinh từ khóa mô tả bằng AI (Ollama) cho món ăn.
 * - Kiểm tra trùng lặp: nếu đã có thì cập nhật, chưa có thì thêm mới.
 * - Nhúng dữ liệu vào hệ thống vector để phục vụ tìm kiếm ngữ nghĩa.
 *
 * @param {object} param0 - { name, province, description }
 * @returns {object} Thông tin món ăn đã lưu/cập nhật
 */
async function addDish({ name, province, description = '' }) {
  try {
    // Bước 1: Chuẩn hóa tên tỉnh/thành để lưu đúng collection
    const provinceName = standardizeProvince(province);
    
    // Bước 2: Sinh từ khóa mô tả bằng AI cho món ăn
    console.log(`[DataService] Generating keywords for dish: ${name}...`);
    const keywords = await generateKeywords(name, provinceName, 'dish');
    
    // Bước 3: Lưu thông tin vào MongoDB (theo collection tỉnh/thành)
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
    
    // Kiểm tra trùng lặp (theo tên + tỉnh): nếu đã có thì cập nhật, chưa có thì thêm mới
    const existing = await collection.findOne({ 
      name, 
      type: 'dish',
      province: provinceName 
    });
    
    if (existing) {
      // Nếu đã tồn tại, chỉ cập nhật mô tả, từ khóa, thời gian
      await collection.updateOne(
        { _id: existing._id },
        { $set: { description, keywords, updated_at: new Date() } }
      );
      console.log(`[DataService] Updated existing dish: ${name}`);
    } else {
      // Nếu chưa có, thêm mới vào collection
      await collection.insertOne(dishDoc);
      console.log(`[DataService] Inserted new dish: ${name}`);
    }
    
    // Bước 4: Nhúng dữ liệu vào hệ thống vector để phục vụ tìm kiếm ngữ nghĩa
    const contentToEmbed = `Món ăn ${name} đặc sản ${provinceName}. Hương vị: ${keywords}.`;
    
    await addDocument({
      content: contentToEmbed,
      metadata: { name, type: 'dish', province: provinceName }
    });
    
    console.log(`[DataService] ✅ Dish "${name}" synced successfully`);
    
    // Trả về thông tin món ăn đã lưu/cập nhật
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
    // Nếu lỗi, log ra và throw lại
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
