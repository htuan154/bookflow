'use strict';

const { supabase } = require('../../../config/supabase');
const { generateEmbedding } = require('../../../config/ollama');

/**
 * 1. Tìm kiếm Vector (Semantic Search)
 * @param {string} queryText - Câu hỏi của user
 * @param {number} threshold - Ngưỡng tương đồng (0.0 - 1.0). Nên để 0.5.
 * @param {number} limit - Số lượng kết quả trả về.
 * @param {string|null} filterCity - Tên tỉnh/thành phố để lọc (VD: "Huế"). Nếu null thì tìm toàn cục.
 */
async function searchVector(queryText, threshold = 0.25, limit = 4, filterCity = null) {
  try {
    // Bước A: Tạo vector từ câu hỏi bằng Ollama
    const embedding = await generateEmbedding(queryText);
    if (!embedding) return [];

    // Bước B: Gọi hàm RPC trong Supabase để tìm kiếm
    // Hàm này đã được update SQL để nhận tham số filter_province
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_province: filterCity // [QUAN TRỌNG] Truyền tham số lọc để tránh tìm nhầm tỉnh
    });

    if (error) {
      console.error('[VectorService] RPC Error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[VectorService] Exception:', err.message);
    return [];
  }
}

/**
 * 2. Thêm tài liệu vào Vector DB
 * @param {string} content - Nội dung text để tạo vector (Tên + Mô tả + Từ khóa AI)
 * @param {object} metadata - Các thông tin đi kèm (Tên, Tỉnh, Loại...)
 */
async function addDocument({ content, metadata }) {
  try {
    const embedding = await generateEmbedding(content);
    if (!embedding) return null;

    const { data, error } = await supabase
      .from('documents')
      .insert({
        content,
        metadata,
        embedding
      })
      .select();
      
    if (error) {
      console.error('Insert Vector Error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Insert Vector Exception:', err.message);
    return null;
  }
}

/**
 * 3. [MỚI] Xóa Vector theo Tỉnh
 * Dùng để làm sạch dữ liệu cũ trước khi nạp lại (tránh trùng lặp).
 * @param {string} provinceName - Tên tỉnh cần xóa (VD: "Huế")
 */
async function deleteVectorsByProvince(provinceName) {
  if (!provinceName) return;
  console.log(`   🗑️  Đang dọn dẹp dữ liệu cũ của: "${provinceName}"...`);
  
  try {
    // Xóa các dòng mà cột metadata->>'province' bằng provinceName
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('metadata->>province', provinceName);

    if (error) {
      console.error('   ❌ Delete Error:', error.message);
    } else {
      console.log('   ✅ Đã xóa sạch dữ liệu cũ.');
    }
  } catch (err) {
    console.error('   ❌ Delete Exception:', err.message);
  }
}

module.exports = { 
  searchVector, 
  addDocument, 
  deleteVectorsByProvince 
};