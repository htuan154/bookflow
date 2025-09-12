'use strict';

const { Readable } = require('stream');
const { getBucket } = require('../../../im/bootstrap');

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 20);
const ALLOWED = String(process.env.ALLOWED_MIME || '')
  .split(',').map(s => s.trim()).filter(Boolean);

/** Validate MIME & size */
function validateFile({ mime_type, size }) {
  if (ALLOWED.length && !ALLOWED.includes(mime_type)) {
    const e = new Error('UNSUPPORTED_MIME');
    e.status = 415; throw e;
  }
  if (size > MAX_UPLOAD_MB * 1024 * 1024) {
    const e = new Error('PAYLOAD_TOO_LARGE');
    e.status = 413; throw e;
  }
}

/** Lưu buffer vào GridFS -> trả gridfs_id + metadata */
async function saveBufferToGridFS({ buffer, file_name, mime_type }) {
  validateFile({ mime_type, size: buffer.length });
  const bucket = getBucket();
  const stream = Readable.from(buffer);
  const upload = bucket.openUploadStream(file_name, {
    contentType: mime_type,
    metadata: { source: 'im' }
  });
  await new Promise((resolve, reject) => {
    stream.pipe(upload).on('finish', resolve).on('error', reject);
  });
  return {
    gridfs_id: upload.id,
    file_name,
    mime_type,
    size: buffer.length
  };
}

/** Lưu từ stream (nếu bạn nhận file dạng stream) */
async function saveStreamToGridFS({ stream, file_name, mime_type, size }) {
  validateFile({ mime_type, size });
  const bucket = getBucket();
  const upload = bucket.openUploadStream(file_name, {
    contentType: mime_type,
    metadata: { source: 'im' }
  });
  await new Promise((resolve, reject) => {
    stream.pipe(upload).on('finish', resolve).on('error', reject);
  });
  return {
    gridfs_id: upload.id,
    file_name,
    mime_type,
    size
  };
}

module.exports = {
  saveBufferToGridFS,
  saveStreamToGridFS,
};
