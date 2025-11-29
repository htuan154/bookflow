'use strict';

/**
 * NLU Service - Fixed City Alias & Intent Logic
 */

/**
 * Chuẩn hoá: bỏ dấu, đ->d, thường hoá, loại ký tự đặc biệt, gom khoảng trắng
 */
function normalize(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')   // bỏ toàn bộ dấu
    .replace(/đ/gi, 'd')              // đ -> d
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')     // bỏ ký tự đặc biệt
    .replace(/\s+/g, ' ')
    .trim();
}

function tokensOf(normalized = '') {
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

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

// --- TỪ KHÓA NHẬN DIỆN ---
const FOOD_KWS  = ['an','mon','dac san','dac trung','am thuc','an gi','an vat','quan','com','bun','pho','mi','ngon'];
const PLACE_KWS = ['di dau','choi','tham quan','dia danh','dia diem','diem den','check in','checkin','chup anh','tham thien','leo nui','bien','vinh','canh dep'];

// [QUAN TRỌNG] Từ khóa Khách sạn
const HOTEL_KWS = ['khach san','hotel','nha nghi','resort','homestay','luu tru','phong','booking'];

// [QUAN TRỌNG] Từ khóa Khuyến mãi (Đã XÓA chữ 'top' để tránh nhầm lẫn)
const PROMO_KWS = ['khuyen mai','giam gia','voucher','uu dai','sale','ma giam','code','hot deal']; 

const CHITCHAT_KWS = [
  'hom nay','hom nay','hom nay troi','troi mua','troi nang','troi mat','troi lanh',
  'gio may gio','may gio','gioi thieu','ban la ai','ten gi','chao','hello','hi','how are you','toi dang choi','tam trang'
];
const WEATHER_KWS = ['thoi tiet','thời tiết','troi mua','troi nang','troi lanh','troi mat','du bao','thang nay','mua kho'];

const REGION_DICT = [
  { code: 'DBSCL', name: 'Miền Tây (ĐBSCL)', keys: ['mien tay','dbscl','dong bang song cuu long'] },
  { code: 'MTR',   name: 'Miền Trung',        keys: ['mien trung'] },
  { code: 'DNB',   name: 'Đông Nam Bộ',       keys: ['dong nam bo'] },
  { code: 'DBSH',  name: 'Đồng bằng sông Hồng', keys: ['dong bang song hong','dbsh','song hong'] },
  { code: 'TNM',   name: 'Tây Nguyên',        keys: ['tay nguyen'] },
  { code: 'DB',    name: 'Đông Bắc',          keys: ['dong bac'] },
  { code: 'TB',    name: 'Tây Bắc',           keys: ['tay bac'] },
];

function hasAny(normalized = '', kws = []) {
  return kws.some(k => normalized.includes(k));
}

function isChitchat(normalized = '', city = null) {
  const toks = tokensOf(normalized);
  if (!normalized) return true;
  if (!city && hasAny(normalized, CHITCHAT_KWS)) return true;
  // Nếu câu ngắn và không chứa từ khóa nghiệp vụ nào -> chitchat
  if (!city && toks.length <= 4 && !hasAny(normalized, [...FOOD_KWS, ...PLACE_KWS, ...HOTEL_KWS, ...PROMO_KWS])) return true;
  return false;
}

/**
 * Phân loại intent (Logic đã tối ưu)
 */
function detectIntent(message = '', city = null) {
  const msg = normalize(message);

  // 1. Check Hotel trước (Ưu tiên cao nhất nếu có từ 'khách sạn')
  const wantHotel = hasAny(msg, HOTEL_KWS);
  if (wantHotel) return 'ask_hotels';

  // 2. Check Promo
  const wantPromo = hasAny(msg, PROMO_KWS);
  if (wantPromo) return 'ask_promotions';

  // 3. Check Other Intents
  if (hasAny(msg, WEATHER_KWS)) return 'ask_weather';
  if (isChitchat(msg, city)) return 'chitchat';

  const wantFood  = hasAny(msg, FOOD_KWS);
  const wantPlace = hasAny(msg, PLACE_KWS);

  // Phân loại Vector Intent
  if (wantFood && !wantPlace) return 'ask_dishes';
  if (!wantFood && wantPlace) return 'ask_places';
  
  // Mặc định fallback về ask_details nếu câu hỏi chung chung (giá, ở đâu)
  if (msg.includes('gia') || msg.includes('bao nhieu') || msg.includes('o dau')) return 'ask_details';

  return 'ask_both'; 
}

function detectQueryType(normalized = '') {
  const specificIndicators = /\b(review|danh gia|mo ta|chi tiet|thong tin ve|gioi thieu|noi ve|la gi|co tot khong|ngon khong|ngon ko|the nao|ra sao|nhu nao|ntn|hay khong|hay ko|tot khong|tot ko|dep khong|dep ko|tuyet khong)\b/;
  const overviewIndicators = /\b(dac san|di choi|tham quan|du lich|co gi|mon gi|dia danh nao|an gi|choi gi|danh sach|goi y|nhung mon|nhung dia danh|cac mon|cac dia danh)\b/;
  
  if (specificIndicators.test(normalized)) return 'specific';
  if (overviewIndicators.test(normalized)) return 'overview';
  
  const tokens = tokensOf(normalized);
  if (tokens.length >= 1 && tokens.length <= 5 && !overviewIndicators.test(normalized)) return 'specific';
  
  return 'unknown';
}

function detectRegion(normalized = '') {
  for (const r of REGION_DICT) {
    if (hasAny(normalized, r.keys)) return { code: r.code, name: r.name, key: r.keys[0] };
  }
  return null;
}

function extractTopN(normalized = '', fallback = 5) {
  const m1 = normalized.match(/top\s*(\d{1,2})/);
  if (m1) return Math.max(1, Math.min(20, Number(m1[1])));
  const m2 = normalized.match(/\b(\d{1,2})\s*(mon|dia danh|dia diem|diem|noi|khuyen mai|voucher)\b/);
  if (m2) return Math.max(1, Math.min(20, Number(m2[1])));
  return fallback;
}

function extractFilters(normalized = '') {
  const f = {};
  if (/\bsang\b/.test(normalized)) f.meal = 'sang';
  else if (/\btrua\b/.test(normalized)) f.meal = 'trua';
  else if (/\btoi\b/.test(normalized)) f.meal = 'toi';
  else if (/\bdem\b/.test(normalized)) f.meal = 'dem';
  if (/\bit cay\b/.test(normalized)) f.spice = 'less';
  if (/\bkhong cay\b/.test(normalized)) f.spice = 'none';
  if (/\bchay\b/.test(normalized)) f.veg = true;
  if (/\bhai san\b/.test(normalized)) f.seafood = true;
  if (/\btrong nha\b/.test(normalized)) f.indoor = true;
  if (/\bngoai troi\b/.test(normalized)) f.outdoor = true;
  if (/\btre em\b/.test(normalized)) f.kids = true;
  if (/\bgia dinh\b/.test(normalized)) f.family = true;
  if (/\bre\b|\bbinh dan\b|\btiet kiem\b/.test(normalized)) f.price = 'low';
  if (/\bcao cap\b|\bsang trong\b/.test(normalized)) f.price = 'high';
  return f;
}

const CITY_ALIASES = {
  'ha noi': 'Hà Nội', 'hanoi': 'Hà Nội', 'hoan kiem': 'Hà Nội', 'tay ho': 'Hà Nội', 'pho co': 'Hà Nội',
  
  // [SỬA LỖI TẠI ĐÂY] Đổi 'Thành phố Hồ Chí Minh' -> 'TP Hồ Chí Minh' để khớp DB
  'ho chi minh': 'TP Hồ Chí Minh', 'hcm': 'TP Hồ Chí Minh', 'sai gon': 'TP Hồ Chí Minh', 'saigon': 'TP Hồ Chí Minh', 'tphcm': 'TP Hồ Chí Minh', 'quan 1': 'TP Hồ Chí Minh', 'ben thanh': 'TP Hồ Chí Minh',
  
  'da nang': 'Đà Nẵng', 'danang': 'Đà Nẵng', 'ba na': 'Đà Nẵng', 'son tra': 'Đà Nẵng', 'my khe': 'Đà Nẵng', 'cau rong': 'Đà Nẵng',
  'hue': 'Thừa Thiên Huế', 'thua thien hue': 'Thừa Thiên Huế',
  'hoi an': 'Quảng Nam', 'quang nam': 'Quảng Nam',
  'nha trang': 'Khánh Hòa', 'khanh hoa': 'Khánh Hòa',
  'da lat': 'Lâm Đồng', 'lam dong': 'Lâm Đồng', 'dalat': 'Lâm Đồng',
  'phu quoc': 'Kiên Giang', 'kien giang': 'Kiên Giang',
  'quy nhon': 'Bình Định', 'binh dinh': 'Bình Định',
  'tuyen quang': 'Tuyên Quang'
};

function detectCity(normalized = '') {
  const ns = normalized.replace(/\s/g, '');
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (normalized.includes(alias)) return city;
    const aliasNs = alias.replace(/\s/g, '');
    if (ns.includes(aliasNs)) return city;
  }
  return null;
}

function analyze(message = '') {
  const normalized = normalize(message);
  const city = detectCity(normalized);
  const queryType = detectQueryType(normalized);
  
  return {
    normalized,
    intent: detectIntent(normalized, city),
    region: detectRegion(normalized),
    city,
    queryType,
    top_n: extractTopN(normalized, 7),
    filters: extractFilters(normalized),
    tokens: tokensOf(normalized),
    ngrams: ngrams(normalized, 3),
  };
}

module.exports = {
  normalize, tokensOf, ngrams, detectIntent, detectQueryType, 
  detectRegion, extractTopN, extractFilters, detectCity, analyze,
};