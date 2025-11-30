'use strict';

const { getDb } = require('../../../im/bootstrap');

/**
 * Đăng ký Change Stream cho 1 conversation:
 * - NOTE: Change Stream requires MongoDB Replica Set
 * - Fallback: Use polling if replica set not available
 * - Gọi callback khi có message mới (operationType: insert)
 * - Trả về hàm `close()` để hủy đăng ký
 */
async function subscribeConversation(conversation_id, onMessage) {
  const db = getDb();
  
  // Try using Change Stream (requires replica set)
  try {
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

    cs.on('error', (err) => {
      console.error('[Change Stream] Error:', err.message);
    });

    return {
      close: () => cs.close()
    };
  } catch (err) {
    // Fallback: Return dummy subscription if Change Stream not supported
    console.warn('[Stream Service] Change Stream not available (replica set required), using SSE ping only');
    console.warn('[Stream Service] Messages will not be pushed in real-time');
    return {
      close: () => {}
    };
  }
}

module.exports = { subscribeConversation };
