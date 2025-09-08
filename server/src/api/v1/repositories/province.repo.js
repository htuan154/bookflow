'use strict';

const COL = process.env.MONGO_COLLECTION || 'chatbot_test';
const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  const grams = Array.isArray(nluOrNormalized?.ngrams)
    ? nluOrNormalized.ngrams
    : String(nluOrNormalized || '').split(/\s+/);

  // kiểm tra n-gram dài trước (3 từ -> 1 từ)
  const sorted = [...grams].sort((a, b) => b.length - a.length);

  for (const g of sorted) {
    const hit = await db.collection(COL).findOne(
      { $or: [{ norm: g }, { aliases: g }] },
      { projection: { _id: 0, type: 1, name: 1, places: 1, dishes: 1, tips: 1 } }
    );
    if (hit && hit.type !== 'region') return hit; // chỉ nhận province/city
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

module.exports = {
  findByNorm,
  findByAlias,
  findInText,     // ← export thêm
  autocomplete,
  countAll,
  findRegionByKey, // ← export thêm

  __COLLECTION__: COL,
};
