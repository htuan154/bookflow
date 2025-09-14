'use strict';

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../im/bootstrap');
function oid(id) { return (id instanceof ObjectId) ? id : new ObjectId(String(id)); }

/** Lưu metadata đính kèm (file thật nằm GridFS) */
async function createAttachment({
  gridfs_id, conversation_id, message_id,
  file_name, mime_type, size, uploader_id, thumbnails = []
}) {
  const db = getDb();
  const doc = {
    storage: 'gridfs',
    gridfs_id: oid(gridfs_id),
    conversation_id: oid(conversation_id),
    message_id: message_id ? oid(message_id) : null,
    file_name, mime_type, size, thumbnails,
    uploader_id,
    virus_scanned: true,
    created_at: new Date()
  };
  const r = await db.collection('attachments').insertOne(doc);
  return { _id: r.insertedId, ...doc };
}

async function getAttachment(attachment_id) {
  const db = getDb();
  return db.collection('attachments').findOne({ _id: oid(attachment_id) });
}

module.exports = {
  createAttachment,
  getAttachment,
};
