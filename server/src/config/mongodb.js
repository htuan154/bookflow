// src/config/mongodb.js
'use strict';

const { MongoClient } = require('mongodb');
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

module.exports = { connectDB, getDb, getClient };
