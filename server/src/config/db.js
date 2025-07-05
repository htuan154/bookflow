// src/config/db.js

const { Pool } = require('pg');
// Cấu hình dotenv để nó có thể tìm thấy file .env ở thư mục gốc của server
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// Kiểm tra xem DATABASE_URL đã được thiết lập chưa
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the .env file');
}

// Khởi tạo connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  ssl: {
    rejectUnauthorized: false,
  },
});


pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;