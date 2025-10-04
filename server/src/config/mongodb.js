// src/config/mongodb.js
'use strict';
const { MongoClient, GridFSBucket } = require('mongodb');
require('dotenv').config();

const uri    = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;
const COL    = process.env.MONGO_COLLECTION || 'chatbot_test';

if (!uri || !dbName) {
  throw new Error('Missing MONGO_URI or MONGO_DB in .env');
}

let client;  // giữ client để tái dùng
let db;

async function ensureIndexes(dbase) {
  // Idempotent: gọi nhiều lần cũng không sao
  const col = dbase.collection(COL);
  await Promise.all([
    col.createIndex({ norm: 1 },    { name: 'idx_norm' }),
    col.createIndex({ aliases: 1 }, { name: 'idx_aliases' }),
    // (tuỳ chọn) tìm theo tên có/không dấu:
    // col.createIndex({ name: 1 }, { name: 'idx_name_vi', collation: { locale: 'vi', strength: 1 } }),
  ]);
}

async function connectDB() {
  if (db) return db;

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  });

  await client.connect();
  console.log('✅ Kết nối MongoDB thành công');

  db = client.db(dbName);
  await ensureIndexes(db); // 👉 tạo index ngay khi lần đầu kết nối
  return db;
}

function getDb() {
  if (!db) throw new Error('MongoDB not connected. Call connectDB() first.');
  return db;
}

function getClient() {
  return client;
}
let _client, _db;
async function connectMongo() {
  if (_db) return _db;
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB || 'chat_bot';
  _client = new MongoClient(uri, { maxPoolSize: 20 });
  await _client.connect();
  _db = _client.db(dbName);
  return _db;
}

// TẠO INDEX CHO CÁC COLLECTION CHAT
async function ensureChatIndexes(db) {
  // conversations
  await db.collection('conversations').createIndex({ type: 1, hotel_id: 1, created_at: -1 });
  // DM chỉ 1 đoạn chat duy nhất giữa (admin, owner, hotel)
  await db.collection('conversations').createIndex(
    { type: 1, hotel_id: 1, admin_id: 1, owner_id: 1 },
    { unique: true, partialFilterExpression: { type: 'dm' } }
  );

  // participants
  await db.collection('participants').createIndex(
    { conversation_id: 1, user_id: 1 },
    { unique: true }
  );
  await db.collection('participants').createIndex({ user_id: 1 });

  // messages
  await db.collection('messages').createIndex({ conversation_id: 1, created_at: -1 });
  await db.collection('messages').createIndex({ sender_id: 1, created_at: -1 });

  await db.collection('notificationForContract').createIndex({ receiver_id: 1, created_at: -1 });
  await db.collection('notificationForContract').createIndex({ contract_id: 1 });
  await db.collection('notificationForContract').createIndex({ hotel_id: 1 });
  await db.collection('notificationForContract').createIndex({ is_read: 1 });
  await db.collection('notificationForContract').createIndex({ notification_type: 1, receiver_id: 1 });
}

// BUCKET CHO FILE ĐÍNH KÈM (GridFS)
function getGridFSBucket(db) {
  const bucketName = process.env.GRIDFS_BUCKET || 'chat_files';
  return new GridFSBucket(db, { bucketName });
}

module.exports = { 
  connectDB, 
  getDb, 
  getClient,
  connectMongo,
  ensureChatIndexes,
  getGridFSBucket,

};
