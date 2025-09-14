'use strict';

const { getDb } = require('../../../im/bootstrap');

/**
 * Đăng ký Change Stream cho 1 conversation:
 * - Gọi callback khi có message mới (operationType: insert)
 * - Trả về hàm `close()` để hủy đăng ký
 */
async function subscribeConversation(conversation_id, onMessage) {
  const db = getDb();
  const pipeline = [
    { $match: { operationType: 'insert', 'fullDocument.conversation_id': conversation_id } }
  ];
  const cs = db.collection('messages').watch(pipeline, { fullDocument: 'updateLookup' });

  cs.on('change', (change) => {
    try {
      const doc = change.fullDocument;
      onMessage?.({
        type: 'message.new',
        conversation_id,
        message: doc
      });
    } catch (e) {
      // nuốt lỗi callback để stream không crash
      console.error('stream callback error:', e?.message || e);
    }
  });

  return {
    close: () => cs.close()
  };
}

module.exports = { subscribeConversation };
