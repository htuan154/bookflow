'use strict';

const COL = process.env.MONGO_COLLECTION || 'chatbot_test';
const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const { normalize } = require('../services/nlu.service'); // ensure this is present

async function findByNorm(db, q) {
  if (!q) return null;
  return db.collection(COL).findOne({ norm: q });
}

async function findByAlias(db, q) {
  if (!q) return null;
  const qNo = q.replace(/\s/g, '');
  return db.collection(COL).findOne({ aliases: { $in: [q, qNo] } });
}

/** tạo n-gram từ câu: ưu tiên cụm dài trước (3 -> 1) + phiên bản bỏ khoảng */
function grams(text, maxLen = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const out = [];
  for (let len = Math.min(maxLen, words.length); len >= 1; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const g = words.slice(i, i + len).join(' ');
      out.push(g);
    }
  }
  // thêm biến thể không khoảng
  return [...new Set(out.flatMap(g => [g, g.replace(/\s/g, '')]))];
}


/** Autocomplete: norm trước, không được thì alias (kể cả alias bỏ khoảng) */
async function autocomplete(db, prefix, limit = 5) {
  if (!prefix) return [];
  const col = db.collection(COL);
  const rx   = new RegExp('^' + escapeRegex(prefix));
  const rxNo = new RegExp('^' + escapeRegex(prefix.replace(/\s/g, '')));
  const proj = { projection: { _id: 0, name: 1, norm: 1 } };

  const byNorm = await col.find({ norm: rx }, proj).limit(limit).toArray();
  if (byNorm.length) return byNorm;

  return col.find({ aliases: { $in: [rx, rxNo] } }, proj).limit(limit).toArray();
}

async function countAll(db) {
  return db.collection(COL).countDocuments();
}
async function findInText(db, nluOrNormalized) {
  // Lấy danh sách grams
  const baseList = Array.isArray(nluOrNormalized?.ngrams)
    ? nluOrNormalized.ngrams             // từ NLU (1..3-gram, có khoảng)
    : grams(String(nluOrNormalized || '')); // từ chuỗi tự do (đã có biến thể bỏ khoảng)

  // BỔ SUNG biến thể bỏ khoảng cho case dùng NLU
  const withNoSpace = baseList.flatMap(g => [g, g.replace(/\s/g, '')]);
  // Ưu tiên chuỗi dài hơn trước, loại trùng
  const sorted = [...new Set(withNoSpace)].sort((a, b) => b.length - a.length);

  for (const g of sorted) {
    const hit = await db.collection(COL).findOne(
      { $or: [{ norm: g }, { aliases: g }] },
      { projection: { _id: 0, type: 1, name: 1, places: 1, dishes: 1, tips: 1, aliases: 1, merged_from: 1, province: 1, title: 1 } }
    );
    if (hit && hit.type !== 'region') return hit;
  }
  return null;
}
async function findRegionByKey(db, key) {
  if (!key) return null;
  return db.collection(COL).findOne(
    { type: 'region', $or: [{ norm: key }, { aliases: key }] },
    { projection: { _id: 0, name: 1, members: 1 } }
  );
}

/**
 * Tìm chính xác 1 province/city bằng:
 *  - norm (tên chuẩn hoá)
 *  - aliases (kể cả bản bỏ khoảng)
 *  - merged_from / mergedFrom (tỉnh gộp)
 */
async function findByProvinceExact(db, city) {
  if (!city) return null;
  const q = normalize(String(city));
  const qNo = q.replace(/\s/g, '');
  const col = db.collection(COL);
  const proj = {
    projection: {
      _id: 0, type: 1, name: 1,
      places: 1, dishes: 1, tips: 1,
      aliases: 1, merged_from: 1, mergedFrom: 1, province: 1, title: 1
    }
  };

  // 1) Ưu tiên match theo tên (norm)
  let hit = await col.findOne({ type: { $ne: 'region' }, norm: q }, proj);
  if (hit) return hit;

  // 2) Rồi đến alias (kể cả alias bỏ khoảng)
  hit = await col.findOne({ type: { $ne: 'region' }, aliases: { $in: [q, qNo] } }, proj);
  if (hit) return hit;

  // 3) Cuối cùng mới đến merged_from / mergedFrom
  return await col.findOne({
    type: { $ne: 'region' },
    $or: [
      { merged_from: { $in: [q, qNo] } },
      { mergedFrom: { $in: [q, qNo] } }
    ]
  }, proj);
}

module.exports = {
  findByNorm,
  findByAlias,
  findInText,
  autocomplete,
  countAll,
  findRegionByKey,
  findByProvinceExact,
  grams,
  __COLLECTION__: COL,
};
