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

/** * Alias 63 tỉnh/thành + CÁC QUẬN/HUYỆN/ĐỊA DANH NỔI TIẾNG 
 * (Giúp AI tự nhận diện tỉnh khi user chỉ nói tên địa danh)
 */
const CITY_ALIASES = {
  // TP trực thuộc TW
  'ha noi': 'Hà Nội', 'hanoi': 'Hà Nội', 'hoan kiem': 'Hà Nội', 'tay ho': 'Hà Nội', 'pho co': 'Hà Nội',
  'ho chi minh': 'Thành phố Hồ Chí Minh', 'hcm': 'Thành phố Hồ Chí Minh', 'sai gon': 'Thành phố Hồ Chí Minh', 'saigon': 'Thành phố Hồ Chí Minh', 'tphcm': 'Thành phố Hồ Chí Minh', 'quan 1': 'Thành phố Hồ Chí Minh', 'ben thanh': 'Thành phố Hồ Chí Minh',
  'da nang': 'Đà Nẵng', 'danang': 'Đà Nẵng', 'ba na': 'Đà Nẵng', 'son tra': 'Đà Nẵng', 'my khe': 'Đà Nẵng',
  'can tho': 'Cần Thơ', 'cantho': 'Cần Thơ', 'ninh kieu': 'Cần Thơ', 'cai rang': 'Cần Thơ',
  'hai phong': 'Hải Phòng', 'haiphong': 'Hải Phòng', 'do son': 'Hải Phòng', 'cat ba': 'Hải Phòng',
  
  // Miền Tây (Fix mạnh khu vực này)
  'an giang': 'An Giang', 'chau doc': 'An Giang', 'long xuyen': 'An Giang', 'nui sam': 'An Giang', 'nui cam': 'An Giang', 'tra su': 'An Giang',
  'kien giang': 'Kiên Giang', 'phu quoc': 'Kiên Giang', 'ha tien': 'Kiên Giang', 'rach gia': 'Kiên Giang', 'nam du': 'Kiên Giang',
  'ca mau': 'Cà Mau', 'nam can': 'Cà Mau', 'dat mui': 'Cà Mau', 'u minh': 'Cà Mau',
  'bac lieu': 'Bạc Liêu', 'soc trang': 'Sóc Trăng', 'hau giang': 'Hậu Giang', 'vinh long': 'Vĩnh Long', 'tra vinh': 'Trà Vinh', 'ben tre': 'Bến Tre', 'tien giang': 'Tiền Giang', 'my tho': 'Tiền Giang', 'dong thap': 'Đồng Tháp', 'sa dec': 'Đồng Tháp', 'long an': 'Long An',

  // Các điểm du lịch hot khác
  'ba ria vung tau': 'Bà Rịa - Vũng Tàu', 'vung tau': 'Bà Rịa - Vũng Tàu', 'con dao': 'Bà Rịa - Vũng Tàu', 'ho tram': 'Bà Rịa - Vũng Tàu',
  'binh thuan': 'Bình Thuận', 'phan thiet': 'Bình Thuận', 'mui ne': 'Bình Thuận',
  'lam dong': 'Lâm Đồng', 'da lat': 'Lâm Đồng', 'dalat': 'Lâm Đồng', 'bao loc': 'Lâm Đồng',
  'khanh hoa': 'Khánh Hòa', 'nha trang': 'Khánh Hòa', 'cam ranh': 'Khánh Hòa',
  'quang nam': 'Quảng Nam', 'hoi an': 'Quảng Nam', 'my son': 'Quảng Nam',
  'quang ninh': 'Quảng Ninh', 'ha long': 'Quảng Ninh', 'halong': 'Quảng Ninh', 'co to': 'Quảng Ninh', 'yen tu': 'Quảng Ninh',
  'lao cai': 'Lào Cai', 'sa pa': 'Lào Cai', 'sapa': 'Lào Cai', 'fansipan': 'Lào Cai',
  'ninh binh': 'Ninh Bình', 'trang an': 'Ninh Bình', 'tam coc': 'Ninh Bình', 'bai dinh': 'Ninh Bình',

  // Các tỉnh còn lại
  'bac giang': 'Bắc Giang', 'bac kan': 'Bắc Kạn', 'bac ninh': 'Bắc Ninh', 'binh dinh': 'Bình Định', 'binh duong': 'Bình Dương', 'binh phuoc': 'Bình Phước', 'cao bang': 'Cao Bằng', 'dak lak': 'Đắk Lắk', 'daklak': 'Đắk Lắk', 'dak nong': 'Đắk Nông', 'dien bien': 'Điện Biên', 'dong nai': 'Đồng Nai', 'gia lai': 'Gia Lai', 'ha giang': 'Hà Giang', 'ha nam': 'Hà Nam', 'ha tinh': 'Hà Tĩnh', 'hai duong': 'Hải Dương', 'hoa binh': 'Hòa Bình', 'hung yen': 'Hưng Yên', 'kon tum': 'Kon Tum', 'lai chau': 'Lai Châu', 'lang son': 'Lạng Sơn', 'nam dinh': 'Nam Định', 'nghe an': 'Nghệ An', 'ninh thuan': 'Ninh Thuận', 'phu tho': 'Phú Thọ', 'phu yen': 'Phú Yên', 'quang binh': 'Quảng Bình', 'quang ngai': 'Quảng Ngãi', 'quang tri': 'Quảng Trị', 'son la': 'Sơn La', 'tay ninh': 'Tây Ninh', 'thai binh': 'Thái Bình', 'thai nguyen': 'Thái Nguyên', 'thanh hoa': 'Thanh Hóa', 'thua thien hue': 'Thừa Thiên Huế', 'hue': 'Huế', 'tuyen quang': 'Tuyên Quang', 'vinh phuc': 'Vĩnh Phúc', 'yen bai': 'Yên Bái'
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