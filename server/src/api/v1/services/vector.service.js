'use strict';

const { supabase } = require('../../../config/supabase');
const { generateEmbedding } = require('../../../config/ollama');

/**
 * 1. Tìm kiếm Vector (Semantic Search)
 * FIX: Đã thêm logic mapping để chatbot.service.js đọc được (item, score).
 */
async function searchVector(queryText, threshold = 0.25, limit = 4, filterCity = null) {
  try {
    // Bước A: Tạo vector từ câu hỏi bằng Ollama
    const embedding = await generateEmbedding(queryText);
    if (!embedding) return [];

    // Bước B: Gọi hàm RPC trong Supabase để tìm kiếm
    // Lưu ý: RPC 'match_documents' trả về cột: content, metadata, similarity
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_province: filterCity 
    });

    if (error) {
      console.error('[VectorService] RPC Error:', error);
      return [];
    }

    // 🔥 FIX QUAN TRỌNG: Map dữ liệu sang chuẩn Chatbot
    // Chatbot cần: { item: metadata, score: similarity }
    if (!data || !Array.isArray(data)) return [];

    return data.map(record => ({
        item: record.metadata || {},   // Chuyển metadata thành item
        score: record.similarity || 0, // Chuyển similarity thành score
        doc: record.content || ''      // Nội dung text gốc
    }));

  } catch (err) {
    console.error('[VectorService] Exception:', err.message);
    return [];
  }
}

/**
 * 2. Thêm tài liệu vào Vector DB
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
 * 3. Xóa Vector theo Tỉnh
 */
async function deleteVectorsByProvince(provinceName) {
  if (!provinceName) return;
  console.log(`   🗑️  Đang dọn dẹp dữ liệu cũ của: "${provinceName}"...`);
  
  try {
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