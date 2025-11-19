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

/** true nếu msg chứa bất kỳ từ khoá nào trong danh sách (đã normalize) */
function hasAny(normalized = '', kws = []) {
  return kws.some(k => normalized.includes(k));
}

/** true nếu là câu xã giao/chitchat (không liên quan dữ liệu) */
function isChitchat(normalized = '', city = null) {
  const toks = tokensOf(normalized);
  if (!normalized) return true; // câu trống/blank vẫn xem là chitchat
  if (!city && hasAny(normalized, CHITCHAT_KWS)) return true;
  if (!city && toks.length <= 4 && !hasAny(normalized, FOOD_KWS) && !hasAny(normalized, PLACE_KWS)) return true;
  return false;
}

/** Phân loại intent dựa trên chuỗi đã normalize */
function detectIntent(message = '', city = null) {
  const msg = normalize(message);
  const wantFood  = hasAny(msg, FOOD_KWS);
  const wantPlace = hasAny(msg, PLACE_KWS);
  if (hasAny(msg, WEATHER_KWS)) return 'ask_weather';
  if (isChitchat(msg, city)) return 'chitchat';
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

/** Rút số lượng top-N nếu người dùng chỉ định (mặc định 5) */



function extractTopN(normalized = '', fallback = 5) {
  const m1 = normalized.match(/top\s*(\d{1,2})/);
  if (m1) return Math.max(1, Math.min(20, Number(m1[1])));
  const m2 = normalized.match(/\b(\d{1,2})\s*(mon|dia danh|dia diem|diem|noi)\b/);
  if (m2) return Math.max(1, Math.min(20, Number(m2[1])));
  return fallback;
}

/** Trích filters cơ bản cho LLM (hoặc để sort) */
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

/** Alias 63 tỉnh/thành (không dấu → tên chuẩn có dấu) */
const CITY_ALIASES = {
  // TP trực thuộc TW
  'ha noi': 'Hà Nội', 'hanoi': 'Hà Nội',
  'ho chi minh': 'Hồ Chí Minh', 'hcm': 'Hồ Chí Minh', 'sai gon': 'Hồ Chí Minh', 'saigon': 'Hồ Chí Minh', 'tp hcm': 'Hồ Chí Minh',
  'da nang': 'Đà Nẵng', 'danang': 'Đà Nẵng',
  'can tho': 'Cần Thơ', 'cantho': 'Cần Thơ',
  'hai phong': 'Hải Phòng', 'haiphong': 'Hải Phòng',
  // Tỉnh
  'an giang': 'An Giang', 'ba ria vung tau': 'Bà Rịa - Vũng Tàu', 'brvt': 'Bà Rịa - Vũng Tàu',
  'bac giang': 'Bắc Giang', 'bac kan': 'Bắc Kạn', 'bac lieu': 'Bạc Liêu', 'bac ninh': 'Bắc Ninh',
  'ben tre': 'Bến Tre', 'binh dinh': 'Bình Định', 'binh duong': 'Bình Dương', 'binh phuoc': 'Bình Phước',
  'binh thuan': 'Bình Thuận', 'ca mau': 'Cà Mau', 'cao bang': 'Cao Bằng',
  'dak lak': 'Đắk Lắk', 'daklak': 'Đắk Lắk', 'dak nong': 'Đắk Nông',
  'dien bien': 'Điện Biên', 'dong nai': 'Đồng Nai', 'dong thap': 'Đồng Tháp',
  'gia lai': 'Gia Lai', 'ha giang': 'Hà Giang', 'ha nam': 'Hà Nam', 'ha tinh': 'Hà Tĩnh',
  'hai duong': 'Hải Dương', 'hau giang': 'Hậu Giang', 'hoa binh': 'Hòa Bình', 'hung yen': 'Hưng Yên',
  'khanh hoa': 'Khánh Hòa', 'kien giang': 'Kiên Giang', 'kon tum': 'Kon Tum',
  'lai chau': 'Lai Châu', 'lam dong': 'Lâm Đồng', 'lang son': 'Lạng Sơn', 'lao cai': 'Lào Cai',
  'long an': 'Long An', 'nam dinh': 'Nam Định', 'nghe an': 'Nghệ An',
  'ninh binh': 'Ninh Bình', 'ninh thuan': 'Ninh Thuận',
  'phu tho': 'Phú Thọ', 'phu yen': 'Phú Yên', 'quang binh': 'Quảng Bình',
  'quang nam': 'Quảng Nam', 'quang ngai': 'Quảng Ngãi', 'quang ninh': 'Quảng Ninh', 'quang tri': 'Quảng Trị',
  'soc trang': 'Sóc Trăng', 'son la': 'Sơn La', 'tay ninh': 'Tây Ninh',
  'thai binh': 'Thái Bình', 'thai nguyen': 'Thái Nguyên', 'thanh hoa': 'Thanh Hóa',
  'thua thien hue': 'Thừa Thiên Huế', 'hue': 'Thừa Thiên Huế',
  'tien giang': 'Tiền Giang', 'tra vinh': 'Trà Vinh', 'tuyen quang': 'Tuyên Quang',
  'vinh long': 'Vĩnh Long', 'vinh phuc': 'Vĩnh Phúc', 'yen bai': 'Yên Bái',
};

/** Nhận diện tỉnh/thành (trên chuỗi đã normalize) */
function detectCity(normalized = '') {
  const ns = normalized.replace(/\s/g, '');
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (normalized.includes(alias)) return city;                    // có khoảng
    const aliasNs = alias.replace(/\s/g, '');
    if (ns.includes(aliasNs)) return city;                          // dính liền
  }
  return null;
}

/** Hàm analyze DUY NHẤT (có city) */
function analyze(message = '') {
  const normalized = normalize(message);
  const city = detectCity(normalized);
  return {
    normalized,
    intent: detectIntent(normalized, city),
    region: detectRegion(normalized),
    city,
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
  detectCity,
  analyze,
};
