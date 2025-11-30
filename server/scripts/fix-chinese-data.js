'use strict';
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { fetch } = require('undici');

// Cấu hình
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';

// Hàm check Tiếng Trung/Nhật/Hàn
function hasChineseChars(str) {
    return /[\u3400-\u9FBF\u3040-\u309F\u30A0-\u30FF]/.test(str);
}

// 1. Hàm sinh nội dung mới (Strict Vietnamese)
async function regenerateContent(name, province, type) {
    const prompt = `
    Bạn là chuyên gia Việt Nam.
    Nhiệm vụ: Viết lại đoạn mô tả ngắn (2-3 câu) về ${type === 'place' ? 'địa điểm' : 'món ăn'} "${name}" tại "${province}".
    
    YÊU CẦU NGHIÊM NGẶT:
    1. TUYỆT ĐỐI CHỈ DÙNG TIẾNG VIỆT. KHÔNG ĐƯỢC CÓ MỘT CHỮ TIẾNG TRUNG/NHẬT/ANH NÀO.
    2. Nêu bật đặc điểm chính và sự hấp dẫn.
    
    Output mẫu: "${name} là một trong những điểm đến nổi tiếng nhất tại ${province} với vẻ đẹp hoang sơ và..."
    `;

    try {
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: { temperature: 0.1 } // Nhiệt độ thấp để AI nghiêm túc
            })
        });
        const data = await res.json();
        return data.response.trim().replace(/['"]/g, '');
    } catch (e) {
        console.error(`❌ Lỗi AI gen text: ${e.message}`);
        return `${name} là đặc sản nổi tiếng tại ${province}.`; // Fallback an toàn
    }
}

// 2. Hàm tạo Vector Embedding (Cần thiết để update lại khả năng tìm kiếm)
async function generateEmbedding(text) {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'nomic-embed-text', // Hoặc model bạn đang dùng để embed
                prompt: text
            })
        });
        const data = await res.json();
        return data.embedding;
    } catch (e) {
        console.error(`❌ Lỗi tạo Vector: ${e.message}`);
        return null;
    }
}

async function fixErrors() {
    console.log('🚑 Bắt đầu quy trình sửa lỗi dữ liệu...');

    // Lấy toàn bộ data
    const { data: docs, error } = await supabase.from('documents').select('*');
    if (error) { console.error(error); return; }

    let fixedCount = 0;

    for (const doc of docs) {
        // Chỉ xử lý dòng có tiếng Trung
        if (hasChineseChars(doc.content)) {
            console.log(`\n🔧 Đang sửa: [${doc.metadata.name}]...`);
            
            // A. Sinh nội dung mới
            const newDesc = await regenerateContent(doc.metadata.name, doc.metadata.province, doc.metadata.type);
            const finalContent = `${doc.metadata.name}. ${newDesc}`;
            
            if (hasChineseChars(finalContent)) {
                console.warn('⚠️ Cảnh báo: AI vẫn sinh ra tiếng Trung. Bỏ qua mục này.');
                continue;
            }

            console.log(`   📝 Mới: "${finalContent.substring(0, 60)}..."`);

            // B. Tạo Vector mới
            const newEmbedding = await generateEmbedding(finalContent);
            
            if (newEmbedding) {
                // C. Update vào DB
                const { error: updateErr } = await supabase
                    .from('documents')
                    .update({ content: finalContent, embedding: newEmbedding })
                    .eq('id', doc.id);

                if (!updateErr) {
                    console.log('   ✅ Đã cập nhật thành công.');
                    fixedCount++;
                } else {
                    console.error('   ❌ Lỗi Update DB:', updateErr.message);
                }
            }
        }
    }

    console.log(`\n🎉 HOÀN TẤT! Đã sửa xong ${fixedCount} mục lỗi.`);
}

fixErrors();