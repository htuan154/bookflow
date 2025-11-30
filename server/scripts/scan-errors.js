'use strict';
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Cấu hình Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Hàm kiểm tra ký tự Tiếng Trung
function hasChineseChars(str) {
    // Dải Unicode phổ biến của CJK (Chinese-Japanese-Korean)
    return /[\u3400-\u9FBF\u3040-\u309F\u30A0-\u30FF]/.test(str);
}

// Hàm kiểm tra lỗi nội dung (Quá ngắn hoặc chứa từ khóa lỗi)
function isSuspiciousContent(content) {
    if (!content || content.length < 20) return true; // Nội dung quá ngắn (< 20 ký tự)
    const errorKeywords = ['lỗi ai', 'error', 'undefined', 'null', 'không thể tạo'];
    return errorKeywords.some(kw => content.toLowerCase().includes(kw));
}

async function scanData() {
    console.log('🔍 Đang quét toàn bộ dữ liệu Vector (Documents)...');

    // Lấy toàn bộ dữ liệu (Lưu ý: Supabase giới hạn 1000 dòng/lần, cần loop nếu data lớn)
    // Ở đây giả định data < 1000 dòng. Nếu nhiều hơn cần phân trang.
    const { data: docs, error } = await supabase
        .from('documents')
        .select('id, content, metadata');

    if (error) {
        console.error('❌ Lỗi kết nối Supabase:', error.message);
        return;
    }

    console.log(`📊 Tổng số bản ghi: ${docs.length}`);
    console.log('--------------------------------------------------');

    const chineseErrors = [];
    const contentErrors = [];

    docs.forEach(doc => {
        const content = doc.content || '';
        const name = doc.metadata?.name || 'Unknown';

        // Check Tiếng Trung
        if (hasChineseChars(content)) {
            chineseErrors.push({ id: doc.id, name, content_preview: content.substring(0, 50) + '...' });
        }
        // Check nội dung rác/ngắn
        else if (isSuspiciousContent(content)) {
            contentErrors.push({ id: doc.id, name, content_preview: content });
        }
    });

    // --- BÁO CÁO KẾT QUẢ ---

    if (chineseErrors.length > 0) {
        console.log(`\n🇨🇳 PHÁT HIỆN ${chineseErrors.length} MỤC CHỨA TIẾNG TRUNG/NHẬT:`);
        chineseErrors.forEach(e => {
            console.log(`   [ID: ${e.id}] ${e.name} -> "${e.content_preview}"`);
        });
    } else {
        console.log('\n✅ Không tìm thấy ký tự tiếng Trung.');
    }

    if (contentErrors.length > 0) {
        console.log(`\n⚠️ PHÁT HIỆN ${contentErrors.length} MỤC NỘI DUNG NGẮN/LỖI:`);
        contentErrors.forEach(e => {
            console.log(`   [ID: ${e.id}] ${e.name} -> "${e.content_preview}"`);
        });
    } else {
        console.log('\n✅ Không tìm thấy nội dung rác/ngắn.');
    }

    console.log('\n--------------------------------------------------');
    const totalIssues = chineseErrors.length + contentErrors.length;
    if (totalIssues === 0) {
        console.log('🎉 DỮ LIỆU SẠCH SẼ! KHÔNG CẦN FIX.');
    } else {
        console.log(`💡 Đề xuất: Bạn có thể dùng script "fix-chinese-data.js" để sửa tự động ${totalIssues} mục này.`);
    }
}

scanData();