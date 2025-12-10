'use strict';

const { supabase } = require('../../../config/supabase');
const { generateEmbedding } = require('../../../config/ollama');

/**
 * Tìm kiếm các tài liệu liên quan đến câu hỏi của người dùng dựa trên ý nghĩa (semantic search).
 * Quy trình:
 * 1. Chuyển câu hỏi thành vector embedding bằng AI (Ollama)
 * 2. Gửi embedding lên Supabase để tìm các tài liệu có độ tương đồng cao (RPC 'match_documents')
 * 3. Map kết quả trả về thành dạng chatbot cần: { item, score, doc }
 * 4. Nếu có lỗi hoặc không có dữ liệu, trả về mảng rỗng
 *
 * @param {string} queryText - Câu hỏi của người dùng
 * @param {number} threshold - Ngưỡng điểm tương đồng tối thiểu
 * @param {number} limit - Số lượng kết quả trả về tối đa
 * @param {string|null} filterCity - Tên tỉnh/thành để lọc kết quả (nếu có)
 * @returns {Promise<Array>} Danh sách kết quả tìm kiếm phù hợp
 */
async function searchVector(queryText, threshold = 0.25, limit = 4, filterCity = null) {
  try {
    // Tạo embedding vector từ câu hỏi bằng AI Ollama
    const embedding = await generateEmbedding(queryText);
    if (!embedding) return []; // Nếu không tạo được embedding thì trả về mảng rỗng

    // Gọi hàm RPC 'match_documents' trong Supabase để tìm kiếm các tài liệu tương đồng
    // RPC này trả về các trường: content (nội dung), metadata (thông tin), similarity (điểm tương đồng)
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_province: filterCity 
    });

    if (error) {
      // Nếu có lỗi từ RPC, log lỗi và trả về mảng rỗng
      console.error('[VectorService] RPC Error:', error);
      return [];
    }

    // Map dữ liệu trả về sang chuẩn chatbot cần
    // Chatbot cần: { item: metadata, score: similarity, doc: content }
    if (!data || !Array.isArray(data)) return [];

    // Duyệt qua từng record và chuyển đổi thành object chuẩn
    return data.map(record => ({
        item: record.metadata || {},   // Thông tin metadata của tài liệu
        score: record.similarity || 0, // Điểm số tương đồng với câu hỏi
        doc: record.content || ''      // Nội dung gốc của tài liệu
    }));

  } catch (err) {
    // Nếu có exception, log lỗi và trả về mảng rỗng
    console.error('[VectorService] Exception:', err.message);
    return [];
  }
}

/**
 * Thêm một tài liệu mới vào Vector DB để phục vụ cho việc tìm kiếm semantic search sau này.
 * Quy trình:
 * 1. Chuyển nội dung tài liệu thành vector embedding bằng AI Ollama
 * 2. Lưu nội dung, metadata và embedding vào bảng 'documents' trong Supabase
 * 3. Nếu có lỗi, trả về null
 * 4. Nếu thành công, trả về dữ liệu vừa thêm
 *
 * @param {object} param0 - Đối tượng chứa content (nội dung) và metadata (thông tin phụ)
 * @returns {Promise<object|null>} Dữ liệu vừa thêm hoặc null nếu lỗi
 */
async function addDocument({ content, metadata }) {
  try {
    // Tạo embedding vector từ nội dung tài liệu bằng AI Ollama
    const embedding = await generateEmbedding(content);
    if (!embedding) return null; // Nếu không tạo được embedding thì trả về null

    // Thêm tài liệu vào bảng 'documents' của Supabase
    // Lưu cả nội dung, metadata và embedding để phục vụ tìm kiếm semantic search
    const { data, error } = await supabase
      .from('documents')
      .insert({
        content, // Nội dung gốc tài liệu
        metadata, // Thông tin phụ (VD: tỉnh, loại, v.v.)
        embedding // Vector embedding của nội dung
      })
      .select();
      
    if (error) {
      // Nếu có lỗi khi thêm, log lỗi và trả về null
      console.error('Insert Vector Error:', error.message);
      return null;
    }
    // Nếu thành công, trả về dữ liệu vừa thêm
    return data;
  } catch (err) {
    // Nếu có exception, log lỗi và trả về null
    console.error('Insert Vector Exception:', err.message);
    return null;
  }
}

/**
 * Xóa toàn bộ các tài liệu/vector trong database thuộc về một tỉnh/thành cụ thể.
 * Quy trình:
 * 1. Nhận vào tên tỉnh/thành (provinceName)
 * 2. Nếu không có tên tỉnh thì dừng luôn
 * 3. Gọi Supabase để xóa tất cả các record trong bảng 'documents' mà trường metadata->>province trùng với tên tỉnh
 * 4. Nếu xóa thành công thì log ra thông báo đã xóa sạch, nếu lỗi thì log ra lỗi
 *
 * @param {string} provinceName - Tên tỉnh/thành cần xóa dữ liệu vector
 */
async function deleteVectorsByProvince(provinceName) {
  if (!provinceName) return; // Nếu không có tên tỉnh thì dừng luôn
  console.log(`   🗑️  Đang dọn dẹp dữ liệu cũ của: "${provinceName}"...`);
  
  try {
    // Gọi Supabase để xóa các record có metadata->>province trùng với provinceName
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('metadata->>province', provinceName);

    if (error) {
      // Nếu có lỗi khi xóa, log lỗi
      console.error('   ❌ Delete Error:', error.message);
    } else {
      // Nếu xóa thành công, log thông báo đã xóa sạch
      console.log('   ✅ Đã xóa sạch dữ liệu cũ.');
    }
  } catch (err) {
    // Nếu có exception, log lỗi
    console.error('   ❌ Delete Exception:', err.message);
  }
}

module.exports = { 
  searchVector, 
  addDocument, 
  deleteVectorsByProvince 
};