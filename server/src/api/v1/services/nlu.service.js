'use strict';

/**
 * Chuẩn hoá: bỏ dấu, đ->d, thường hoá, loại ký tự đặc biệt, gom khoảng trắng
 * Ví dụ: "Miền -tây đi đâu?" -> "mien tay di dau"
 */
function normalize(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')   // bỏ toàn bộ dấu
    .replace(/đ/gi, 'd')              // đ -> d
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')     // bỏ ký tự đặc biệt (.,-_/…)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokenize đơn giản trên chuỗi đã normalize */
function tokensOf(normalized = '') {
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

/** Sinh n-gram 1..3 từ tokens (để repo dò alias/norm nhanh) */
function ngrams(normalized = '', maxN = 3) {
  const toks = tokensOf(normalized);
  const out = [];
  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i + n <= toks.length; i++) {
      out.push(toks.slice(i, i + n).join(' '));
    }
  }
  return out;
}

/** Từ khoá (đã normalize) */
const FOOD_KWS  = ['an','mon','dac san','dac trung','am thuc','an gi','an vat','quan','com','bun','pho','mi'];
const PLACE_KWS = ['di dau','choi','tham quan','dia danh','dia diem','diem den','check in','checkin','chup anh','tham thien','leo nui','bien','vinh'];
const REGION_DICT = [
  { code: 'DBSCL', name: 'Miền Tây (ĐBSCL)', keys: ['mien tay','dbscl','dong bang song cuu long'] },
  { code: 'MTR',   name: 'Miền Trung',        keys: ['mien trung'] },
  { code: 'DNB',   name: 'Đông Nam Bộ',       keys: ['dong nam bo'] },
  { code: 'DBSH',  name: 'Đồng bằng sông Hồng', keys: ['dong bang song hong','dbsh','song hong'] },
  { code: 'TNM',   name: 'Tây Nguyên',        keys: ['tay nguyen'] },
  { code: 'DB',    name: 'Đông Bắc',          keys: ['dong bac'] },
  { code: 'TB',    name: 'Tây Bắc',           keys: ['tay bac'] },
];

/** true nếu msg chứa bất kỳ từ khoá nào trong danh sách (đã normalize) */
function hasAny(normalized = '', kws = []) {
  return kws.some(k => normalized.includes(k));
}

/** Phân loại intent dựa trên chuỗi đã normalize */
function detectIntent(message = '') {
  const msg = normalize(message);
  const wantFood  = hasAny(msg, FOOD_KWS);
  const wantPlace = hasAny(msg, PLACE_KWS);
  if (wantFood && !wantPlace) return 'ask_dishes';
  if (!wantFood && wantPlace) return 'ask_places';
  return 'ask_both';
}

/** Nhận diện vùng/miền trong câu (đã normalize) */
function detectRegion(normalized = '') {
  for (const r of REGION_DICT) {
    if (hasAny(normalized, r.keys)) return { code: r.code, name: r.name, key: r.keys[0] };
  }
  return null;
}

/** Rút số lượng top-N nếu người dùng chỉ định (mặc định 7) */
function extractTopN(normalized = '', fallback = 7) {
  // match: "top 5", "top5", hoặc "5 mon / 5 dia danh"
  const m1 = normalized.match(/top\s*(\d{1,2})/);
  if (m1) return Math.max(1, Math.min(20, Number(m1[1])));
  const m2 = normalized.match(/\b(\d{1,2})\s*(mon|dia danh|dia diem|diem|noi)\b/);
  if (m2) return Math.max(1, Math.min(20, Number(m2[1])));
  return fallback;
}

/** Trích filters cơ bản cho LLM (hoặc để sort) */
function extractFilters(normalized = '') {
  const f = {};
  // bữa
  if (/\bsang\b/.test(normalized)) f.meal = 'sang';
  else if (/\btrua\b/.test(normalized)) f.meal = 'trua';
  else if (/\btoi\b/.test(normalized)) f.meal = 'toi';
  else if (/\bdem\b/.test(normalized)) f.meal = 'dem';

  // vị cay/không cay
  if (/\bit cay\b/.test(normalized)) f.spice = 'less';
  if (/\bkhong cay\b/.test(normalized)) f.spice = 'none';

  // chế độ ăn
  if (/\bchay\b/.test(normalized)) f.veg = true;
  if (/\bhai san\b/.test(normalized)) f.seafood = true;

  // môi trường
  if (/\btrong nha\b/.test(normalized)) f.indoor = true;
  if (/\bngoai troi\b/.test(normalized)) f.outdoor = true;

  // đối tượng
  if (/\btre em\b/.test(normalized)) f.kids = true;
  if (/\bgia dinh\b/.test(normalized)) f.family = true;

  // ngân sách (rất thô)
  if (/\bre\b|\bbinh dan\b|\btiet kiem\b/.test(normalized)) f.price = 'low';
  if (/\bcao cap\b|\bsang trong\b/.test(normalized)) f.price = 'high';

  return f;
}

/**
 * Trả về thông tin NLU cho chatbot:
 * - normalized: câu đã chuẩn hoá
 * - intent: ask_dishes | ask_places | ask_both
 * - region: {code,name} nếu phát hiện "miền/vùng" (để clarify)
 * - top_n: số lượng mục muốn lấy (mặc định 7)
 * - filters: {meal, spice, veg, seafood, indoor, outdoor, kids, family, price}
 * - tokens: mảng token
 * - ngrams: mảng n-gram 1..3 (để repo dò alias/norm)
 */
function analyze(message = '') {
  const normalized = normalize(message);
  return {
    normalized,
    intent: detectIntent(normalized),
    region: detectRegion(normalized),     // null nếu không có
    top_n: extractTopN(normalized, 7),
    filters: extractFilters(normalized),
    tokens: tokensOf(normalized),
    ngrams: ngrams(normalized, 3),
  };
}

module.exports = {
  normalize,
  tokensOf,
  ngrams,
  detectIntent,
  detectRegion,
  extractTopN,
  extractFilters,
  analyze,
};
