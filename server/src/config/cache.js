'use strict';

// Hỗ trợ cả v10+ (LRUCache) lẫn v6 (constructor default)
let LRUCache;
try {
  // v10+
  ({ LRUCache } = require('lru-cache'));
} catch (e) {
  // v6 fallback: module export là constructor luôn
  LRUCache = require('lru-cache');
}

const cache = new LRUCache({
  max: parseInt(process.env.CACHE_MAX || '500', 10),
  // lru-cache v10 TTL tính bằng ms, v6 cũng OK khi dùng ms
  ttl: parseInt(process.env.CACHE_TTL_MS || '300000', 10),
});

const makeKey = ({ province, intent, filters, doc_key, city, sql_tags, user_ctx }) =>
  [
    'v2',
    doc_key || province || '-',
    city || '-',
    sql_tags || '-',
    intent || '-',
    JSON.stringify(filters || {}),
    JSON.stringify(user_ctx || {})
  ].join('|');

module.exports = { cache, makeKey };
