'use strict';

const { connectMongo, ensureChatIndexes, getGridFSBucket } = require('../config/mongodb');

let _db = null;
let _bucket = null;
let _inited = false;

/** Khởi tạo IM: kết nối Mongo, tạo index chat, mở GridFS bucket */
async function initIM() {
  if (_inited) return { db: _db, bucket: _bucket };
  const db = await connectMongo();
  await ensureChatIndexes(db);
  _bucket = getGridFSBucket(db);
  _db = db;
  _inited = true;
  return { db, bucket: _bucket };
}

function getDb() {
  if (!_db) throw new Error('IM not initialized. Call initIM() at app start.');
  return _db;
}
function getBucket() {
  if (!_bucket) throw new Error('IM not initialized. Call initIM() at app start.');
  return _bucket;
}

module.exports = { initIM, getDb, getBucket };
