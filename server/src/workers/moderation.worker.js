// src/workers/moderation.worker.js
const blogCommentRepository = require('../api/v1/repositories/blogComment.repository');
const aiModerationService = require('../api/v1/services/aiModeration.service');
const blogRepository = require('../api/v1/repositories/blog.repository'); // Giả định mày đã có file này

async function processPendingComments() {
    console.log('WORKER: Bắt đầu quét các bình luận đang chờ...');
    const pendingComments = await blogCommentRepository.findPendingComments();

    if (pendingComments.length === 0) {
        console.log('WORKER: Không có bình luận nào cần quét.');
        return;
    }
    console.log(`WORKER: Tìm thấy ${pendingComments.length} bình luận cần xử lý.`);

    for (const comment of pendingComments) {
        const classification = await aiModerationService.classifyComment(comment.content);
        let newStatus;

        switch (classification) {
            case 'SẠCH':
                newStatus = 'approved';
                break;
            case 'CHỬI BỚI':
            case 'KÍCH ĐỘNG':
                newStatus = 'rejected';
                break;
            case 'SPAM':
                newStatus = 'hidden';
                break;
            default: // AI lỗi hoặc trả về nhãn lạ
                console.log(`WORKER: Bỏ qua comment ID ${comment.commentId} do AI trả về '${classification}'`);
                continue; 
        }

        const updatedComment = await blogCommentRepository.updateStatus(comment.commentId, newStatus);
        console.log(`WORKER: Đã cập nhật comment ID ${comment.commentId} thành status: ${newStatus}`);

        // Nếu duyệt thành công thì tăng comment_count cho bài blog
        if (newStatus === 'approved' && updatedComment) {
            await blogRepository.updateCommentCount(updatedComment.blog_id, +1);
        }
    }
    console.log('WORKER: Hoàn thành quét.');
}

module.exports = { processPendingComments };