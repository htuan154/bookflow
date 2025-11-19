'use strict';

/**
 * Chatbot service — kết hợp NoSQL + Supabase RPC + LLM compose
 * - TẤT CẢ các hàm RPC/search đều nhận thêm tham số tùy chọn `opts` ở cuối:
 *     + opts.llm: boolean (ưu tiên hơn .env USE_LLM)
 *     + opts.context: object (filters/top_n/... chuyển qua composer)
 *     + opts.nlu: object (nếu muốn truyền NLU có sẵn)
 * - Nếu LLM bật -> hàm trả payload từ compose() (summary/sections/source/...)
 * - Nếu LLM tắt -> hàm trả raw data như trước (backward-compatible)
 */

const { analyze, normalize } = require('./nlu.service');
const repo = require('../repositories/province.repo');        // findInText(db, nlu)
const { compose, composeSmallTalk, composeCityFallback } = require('./composer.service');            // LLM composer (guardrails/cache/fallback)
const { supabase } = require('../../../config/supabase');        // điều chỉnh path nếu dự án bạn khác

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';


// ---- IMPROVED Canonical Mapping for tricky provinces ----
// Maps user input variations -> Exact DB Name (as stored in MongoDB)
const CANONICAL_MAP = new Map([
  // Hồ Chí Minh (most common variants)
  ['hcm', 'Thành phố Hồ Chí Minh'],
  ['hochiminh', 'Thành phố Hồ Chí Minh'],
  ['ho chi minh', 'Thành phố Hồ Chí Minh'],
  ['saigon', 'Thành phố Hồ Chí Minh'],
  ['sai gon', 'Thành phố Hồ Chí Minh'],
  ['tphcm', 'Thành phố Hồ Chí Minh'],
  ['tp hcm', 'Thành phố Hồ Chí Minh'],
  ['tp ho chi minh', 'Thành phố Hồ Chí Minh'],
  ['thanh pho ho chi minh', 'Thành phố Hồ Chí Minh'],
  
  // Hà Nội
  ['ha noi', 'Hà Nội'],
  ['hanoi', 'Hà Nội'],
  
  // Huế / Thừa Thiên Huế
  ['hue', 'Huế'],
  ['thua thien hue', 'Huế'],
  ['thuathienhue', 'Huế'],
  
  // Đà Nẵng
  ['da nang', 'Đà Nẵng'],
  ['danang', 'Đà Nẵng'],
  
  // Vũng Tàu / Bà Rịa Vũng Tàu
  ['vung tau', 'Bà Rịa Vũng Tàu'],
  ['vungtau', 'Bà Rịa Vũng Tàu'],
  ['brvt', 'Bà Rịa Vũng Tàu'],
  ['ba ria vung tau', 'Bà Rịa Vũng Tàu'],
  ['bariavungtau', 'Bà Rịa Vũng Tàu'],
  
  // Đắk Lắk (fix critical issue)
  ['dak lak', 'Đắk Lắk'],
  ['daklak', 'Đắk Lắk'],
  ['đak lak', 'Đắk Lắk'],
  ['đaklak', 'Đắk Lắk'],
  
  // Other common variations
  ['can tho', 'Cần Thơ'],
  ['cantho', 'Cần Thơ'],
  ['hai phong', 'Hải Phòng'],
  ['haiphong', 'Hải Phòng'],
  ['nha trang', 'Khánh Hòa'],
  ['khanh hoa', 'Khánh Hòa'],
  ['phu quoc', 'Kiên Giang'],
  ['kien giang', 'Kiên Giang'],
  ['da lat', 'Lâm Đồng'],
  ['dalat', 'Lâm Đồng'],
  ['lam dong', 'Lâm Đồng'],
  ['sa pa', 'Lào Cai'],
  ['sapa', 'Lào Cai'],
  ['lao cai', 'Lào Cai'],
  ['ha long', 'Quảng Ninh'],
  ['halong', 'Quảng Ninh'],
  ['quang ninh', 'Quảng Ninh'],
  ['ninh binh', 'Ninh Bình'],
  ['ninhbinh', 'Ninh Bình'],
  ['phan thiet', 'Bình Thuận'],
  ['mui ne', 'Bình Thuận'],
  ['binh thuan', 'Bình Thuận'],
  ['quy nhon', 'Bình Định'],
  ['binh dinh', 'Bình Định'],
]);

/**
 * Get canonical DB name from user input
 * @param {string} text - User input (already normalized)
 * @returns {string|null} - Exact DB name or null
 */
function canonicalFromText(text) {
  if (!text) return null;
  const normalized = normalize(String(text));
  const noSpace = normalized.replace(/\s/g, '');
  
  // Try exact match first
  if (CANONICAL_MAP.has(normalized)) {
    return CANONICAL_MAP.get(normalized);
  }
  
  // Try no-space variant
  if (CANONICAL_MAP.has(noSpace)) {
    return CANONICAL_MAP.get(noSpace);
  }
  
  return null;
}

// Move filterDocByProvince outside both functions to share
function filterDocByProvince(doc, target) {
  if (!doc || !target) return doc;
  const norm = (s) => normalize(String(s || ''));
  const targetN = norm(target);

  // tên các tỉnh "khác" nằm trong merged_from/mergedFrom
  const others = new Set(
    (doc.merged_from || doc.mergedFrom || [])
      .map(norm).filter(x => x && x !== targetN)
  );
  if (!others.size) return doc;

  const EXTRA = {
  // Các cặp gộp hay gặp
  'khanh hoa': [
    'khanh hoa','nha trang','cam ranh','van phong','vinh van phong','hon mun','po nagar','yen sao'
  ],
  'ninh thuan': [
    'ninh thuan','phan rang','phan rang thap cham','vinh hy','hang rai','mui dinh','po klong garai','poklong garai'
  ],
  'ca mau': [
    'ca mau','mui ca mau','dat mui','nam can','u minh','rach goc','hon da bac','song trem'
  ],
  'bac lieu': [
    'bac lieu','nha cong tu bac lieu','dien gio bac lieu','bien nha mat','banh tam cay','bun bo cay'
  ],
  'ha giang': [
    'ha giang','dong van','meo vac','ma pi leng','lung cu','nho que','quan ba','pho bang'
  ],
  'tuyen quang': [
    'tuyen quang','na hang','lam binh','tan trao','song gam','ho na hang','atk tan trao'
  ],

  // Big cities / tỉnh phổ biến để loại chéo
  'ho chi minh': [
    'ho chi minh','sai gon','saigon','hcm','tp hcm','ben thanh','nguyen hue','landmark 81'
  ],
  'ha noi': [
    'ha noi','hoan kiem','pho co','van mieu','lang bac','tay ho','my dinh'
  ],
  'da nang': [
    'da nang','son tra','ba na','ba na hills','ngu hanh son','hai van','my khe'
  ],

  // Một số tỉnh du lịch dễ lẫn với hàng xóm
  // EXPANDED: Quảng Nam (hàng xóm của Đà Nẵng - filter out from Da Nang)
  'quang nam': [
    'quang nam','hoi an','hoi-an','pho co hoi an','my son','thanh dia my son',
    'cu lao cham','cau cua dai','rung dua bay mau','vinwonders nam hoi an',
    'an bang','tra que','cam thanh'
  ],
  
  'quang ninh': [
    'quang ninh','ha long','halong','yen tu','co to','quan lan','tuan chau'
  ],
  'kien giang': [
    'kien giang','phu quoc','phuquoc','rach gia','ha tien'
  ],
  'lam dong': [
    'lam dong','da lat','dalat','langbiang','tuyen lam','xuan huong'
  ],
  'binh thuan': [
    'binh thuan','phan thiet','mui ne','bau trang','ta cu'
  ],
  
  // EXPANDED: Bà Rịa Vũng Tàu (hàng xóm của TP.HCM - filter out from HCM)
  'ba ria vung tau': [
    'ba ria vung tau','vung tau','ba ria','long hai','ho tram','ho coc',
    'con dao','condao','bai sau','bai truoc','tuong chua kito','bach dinh',
    'bai dau','binh chau','suoi nuoc nong','dat do'
  ],
  
  // EXPANDED: Bình Dương (hàng xóm của TP.HCM - filter out from HCM)
  'binh duong': [
    'binh duong','kdl dai nam','lac canh dai nam','chua ba thien hau',
    'thanh pho moi','aeon mall binh duong','thu dau mot','di an','thuan an'
  ],
  
  'quang binh': [
    'quang binh','phong nha','ke bang','son doong','thien duong'
  ],
  
  // EXPANDED: Ninh Bình (hàng xóm của Hà Nam)
  'ninh binh': [
    'ninh binh','trang an','tam coc','bich dong','bai dinh','chua bai dinh','hoa lu',
    'thung nham','van long','hang mua','cuc phuong','non nuoc','kenh ga'
  ],
  
  // EXPANDED: Nam Định (hàng xóm của Hà Nam)
  'nam dinh': [
    'nam dinh','den tran','phu day','quat lam','thinh long','xuan thuy',
    'nha tho do','nha tho phu nhai','nha tho keo','hai ly','hai hau','rung tram'
  ],
  
  'thua thien hue': [
    'thua thien hue','hue','kinh thanh hue','thien mu','truong tien','lang tam'
  ],
  
  // EXPANDED: Phú Yên (hàng xóm của Đắk Lắk - filter out from Dak Lak)
  'phu yen': [
    'phu yen','ghenh da dia','ghanh da dia','ghe nh da dia','mui dien',
    'bai xep','vung ro','dam o loan','vuc hom','mat ca ngu','tuy hoa'
  ],
  
  'binh dinh': [
    'binh dinh','quy nhon','ky co','eo gio'
  ],
  'quang ngai': [
    'quang ngai','ly son','dao ly son'
  ],
  'quang tri': [
    'quang tri','cua tung','cua viet','hien luong'
  ],
  'nghe an': [
    'nghe an','cua lo'
  ],
  'thanh hoa': [
    'thanh hoa','sam son','thanh nha ho','pu luong'
  ],
  'phu tho': [
    'phu tho','den hung','hy cuong'
  ],
  'hai phong': [
    'hai phong','do son','cat ba','catba'
  ],
  'tay ninh': [
    'tay ninh','toa thanh tay ninh','nui ba den'
  ],
  'an giang': [
    'an giang','chau doc','tra su','nui cam','nui sam'
  ],
  'dong thap': [
    'dong thap','tram chim','sa dec'
  ],
  'can tho': [
    'can tho','ben ninh kieu','ninh kieu','cai rang'
  ],
  'soc trang': [
    'soc trang','chua doi'
  ],
  
  // EXPANDED: Bến Tre (hàng xóm của Vĩnh Long - filter out from Vinh Long)
  'ben tre': [
    'ben tre','cai mon','con phung','con quy','keo dua','lang be',
    'cho ben tre','rach mieu','chua vinh trang ben tre'
  ],
  
  // EXPANDED: Trà Vinh (hàng xóm của Vĩnh Long - filter out from Vinh Long)
  'tra vinh': [
    'tra vinh','ao ba om','ba om','chua ang','bao tang khmer',
    'bien ba dong','bun nuoc leo','cau ke gac','duyen hai'
  ],
  
  // EXPANDED: Tiền Giang (hàng xóm của Đồng Tháp/Long An - filter out)
  'tien giang': [
    'tien giang','my tho','chua vinh trang','trai ran dong tam',
    'con thoi son','cho noi cai be','tan thanh','go gong','cai be'
  ],
  
  // EXPANDED: Đồng Nai (hàng xóm của Bình Phước)
  'dong nai': [
    'dong nai','bien hoa','kdl buu long','buu long','thac da han','da han',
    'suoi mo dong nai','giang dien','vuon xao la','vuon du lich giang dien',
    'song dong nai','chien khu d','vuon xoai','bo cap vang','nui chua chan',
    'khu du lich tre nguyen','dat do','tan phu','dinh quan'
  ]
};


  const isForeign = (name) => {
    if (!name) return false; // Safety check
    const s = norm(name);
    for (const o of others) {
      if (s.includes(o)) return true;                    // chứa tên tỉnh khác
      const extra = EXTRA[o] || [];
      if (extra.some(k => s.includes(k))) return true;   // chứa city/địa danh đại diện
    }
    return false;
  };

  return {
    ...doc,
    places: (doc.places || [])
      .filter(p => p && (typeof p === 'string' || p.name)) // Ensure valid item
      .filter(p => {
        const name = typeof p === 'string' ? p : p.name;
        return !isForeign(name);
      }),
    dishes: (doc.dishes || [])
      .filter(d => d && (typeof d === 'string' || d.name)) // Ensure valid item
      .filter(d => {
        const name = typeof d === 'string' ? d : d.name;
        return !isForeign(name);
      }),
    tips: (doc.tips || []).filter(t => {
      if (typeof t === 'string') return !isForeign(t);
      if (t && t.name) return !isForeign(t.name);
      return true; // Keep non-string tips without name
    }),
  };
}

const pickTop = (arr, n = 7) => (Array.isArray(arr) ? arr.slice(0, n) : []);

function wantLLM(opts) {
  if (opts && typeof opts.llm === 'boolean') return opts.llm;
  return USE_LLM;
}

// Chuẩn hóa 1 mảng "rows" trước khi đưa sang compose() để luôn có .name và không có phần tử null
function normalizeRows(rows, tag = '') {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(Boolean)
    .map((x) => {
      if (typeof x === 'string') return { name: x, _raw: x, _tag: tag };
      if (!x || typeof x !== 'object') return null;
      const name =
        x.name ||
        x.title ||
        x.hotel_name ||
        x.promotion_name ||
        x.code ||
        x.place ||
        x.dish ||
        x.city ||
        x.id ||
        null;
      return name ? { ...x, name } : null;
    })
    .filter(Boolean);
}

async function composeFromSQL(tag, params, rows, opts = {}) {
  const safeRows = normalizeRows(rows, tag);
  const payload = await compose({
    sql: [{ name: tag, tag, params, rows: safeRows }],
    nlu: opts.nlu || null,
    filters: opts.context?.filters || {},
    user_ctx: opts.context || {},
  });
  payload.source = payload.source || 'sql+llm';
  return payload;
}

// ====== Supabase RPC wrappers (LLM-enabled) ======

async function getTopHotels(city, limit = 10, opts = undefined) {
  console.log('[getTopHotels] Calling RPC with:', { city, limit });
  
  // Try original city name first
  let { data, error } = await supabase.rpc('top_hotels_by_city', {
    p_city: city, p_limit: limit,
  });
  console.log('[getTopHotels] RPC result (original):', { rowCount: data?.length || 0, error: error?.message });
  
  // If no data and city contains "Hồ Chí Minh", try "TP Hồ Chí Minh"
  if ((!data || data.length === 0) && /h[oồ]\s*ch[ií]\s*minh/i.test(city)) {
    console.log('[getTopHotels] Trying alternate name: TP Hồ Chí Minh');
    const alt = await supabase.rpc('top_hotels_by_city', {
      p_city: 'TP Hồ Chí Minh', p_limit: limit,
    });
    console.log('[getTopHotels] RPC result (alternate):', { rowCount: alt.data?.length || 0, error: alt.error?.message });
    if (!alt.error && alt.data && alt.data.length > 0) {
      data = alt.data;
      error = null;
    }
  }
  
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('top_hotels_by_city', { city, limit }, data, opts);
}

async function getHotelsByAmenities(city, amenities = [], limit = 10, opts = undefined) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_amenities', {
    p_city: city, p_amenities: amenities, p_limit: limit,
  });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotels_by_city_with_amenities', { city, amenities, limit }, data, opts);
}

async function getPromotionsInMonth(year, month, limit = 20, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_in_month', {
    p_year: year, p_month: month, p_limit: limit,
  });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_in_month', { year, month, limit }, data, opts);
}

async function getPromotionsInMonthByCity(city, year, month, limit = 20, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_in_month_by_city', {
    p_city: city, p_year: year, p_month: month, p_limit: limit,
  });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_in_month_by_city', { city, year, month, limit }, data, opts);
}

async function getPromotionsByCity(city, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_by_city', { p_city: city });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_by_city', { city }, data, opts);
}

// ====== SQL search helpers (LLM-enabled) ======

async function searchHotels(q = '', city = '', limit = 20, opts = undefined) {
  const { data, error } = await supabase.rpc('search_hotels', {
    p_city: city, p_q: q, p_limit: limit,
  });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('search_hotels', { q, city, limit }, data, opts);
}

async function getHotelsByAnyAmenities(city, amenities = [], limit = 10, opts = undefined) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_any_amenities', {
    p_city: city, p_amenities: amenities, p_limit: limit,
  });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotels_by_city_with_any_amenities', { city, amenities, limit }, data, opts);
}

async function getHotelFull(hotelId, opts = undefined) {
  const { data, error } = await supabase.rpc('hotel_full', { p_hotel_id: hotelId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('hotel_full', { hotelId }, row ? [row] : [], opts);
}

async function getPromotionsValidToday(limit = 50, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_valid_today', { p_limit: limit });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_valid_today', { limit }, data, opts);
}

async function getPromotionsValidTodayByCity(city, limit = 50, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_valid_today_by_city', {
    p_city: city, p_limit: limit,
  });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_valid_today_by_city', { city, limit }, data, opts);
}

async function getPromotionsByKeywordCityMonth(q = null, city = '', year, month, limit = 50, opts = undefined) {
  const { data, error } = await supabase.rpc('promotions_by_keyword_city_month', {
    p_city: city, p_kw: q, p_year: year, p_month: month, p_limit: limit,
  });
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('promotions_by_keyword_city_month', { q, city, year, month, limit }, data, opts);
}

async function promoCheckApplicability(code, userId, bookingAmount, whenTs = null, opts = undefined) {
  const args = {
    p_code: code,
    p_user: userId,
    p_booking_amount: bookingAmount,
  };
  if (whenTs) args.p_when = whenTs;
  const { data, error } = await supabase.rpc('promo_check_applicability', args);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('promo_check_applicability', { code, userId, bookingAmount, whenTs }, row ? [row] : [], opts);
}

async function promoUsageStats(promotionId, opts = undefined) {
  const { data, error } = await supabase.rpc('promo_usage_stats', { p_promotion_id: promotionId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] || null : data;
  if (!wantLLM(opts)) return row;
  return composeFromSQL('promo_usage_stats', { promotionId }, row ? [row] : [], opts);
}

async function listHotelCities(opts = undefined) {
  const { data, error } = await supabase.rpc('hotel_cities');
  if (error) throw error;
  if (!wantLLM(opts)) return data;
  return composeFromSQL('hotel_cities', {}, data, opts);
}

// ====== NoSQL / LLM compose ======

/**
 * suggest(): NoSQL + (optional) LLM — giữ nguyên hành vi cũ
 */
// async function suggest(db, { message, context = {} }) {
//   const started = Date.now();
//   const nlu = analyze(message);
//   const { top_n = context.top_n || 10, filters = {} } = nlu;

//   // 1) Tìm doc theo toàn câu
//   let doc = await repo.findInText(db, nlu).catch(() => null);

//   // 2) Nếu có city nhưng doc KHÔNG chứa city qua name/alias/merged → refetch chỉ với city
//   if (nlu.city && doc?.name && !sameProvince(nlu.city, doc)) {
//     console.warn('[suggest] mismatch -> refetch city only', { query: message, nlu_city: nlu.city, doc_name: doc.name });
//     const nluCityOnly = analyze(nlu.city);
//     doc = await repo.findInText(db, nluCityOnly).catch(() => null);
//     // 3) Nếu vẫn lệch thật sự mới ép skeleton rỗng cho đúng tỉnh
//     if (doc?.name && !sameProvince(nlu.city, doc)) {
//       doc = { name: nlu.city, places: [], dishes: [], tips: [] };
//     }
//   }
//   // 4) Không tìm thấy gì nhưng user nêu city → skeleton
//   if (!doc && nlu.city) {
//     doc = { name: nlu.city, places: [], dishes: [], tips: [] };
//   }

//   const llmOn = true; // luôn dùng LLM

//   let safeDoc = extractProvinceDoc(doc);
//   const cityFinal = nlu.city || safeDoc?.name;
//   safeDoc = filterDocByProvince(safeDoc, cityFinal);

//   const payload = await compose({
//     doc: safeDoc,
//     nlu,
//     filters: { ...(filters || {}), ...(context.filters || {}) },
//     user_ctx: { top_n, ...context, city: nlu.city }
//   });

//   // Ghi chú dữ liệu gộp
//   if (safeDoc && Array.isArray(safeDoc.merged_from) && safeDoc.merged_from.length) {
//     const mergedNote = ` (dữ liệu gộp: ${safeDoc.merged_from.join(' + ')})`;
//     if (!payload.summary) {
//       payload.summary = `Gợi ý cho ${nlu.city || safeDoc.name}${mergedNote}`;
//     } else if (!payload.summary.includes('dữ liệu gộp')) {
//       payload.summary += mergedNote;
//     }
//   }

//   payload.source = payload.source || 'nosql+llm';
//   payload.latency_ms = Date.now() - started;
//   payload.province = safeDoc?.name || null;
//   return payload;
// }

// /* =================== FINAL suggestHybrid() ===================== */
// async function suggestHybrid(db, { message, context = {} }) {
//   const started = Date.now();
//   const nlu = analyze(message);
//   const { intent, top_n = context.top_n || 10, filters = {}, city } = nlu;

//   // NoSQL fetch song song (docFirst sẽ truyền vào helper để tiết kiệm 1 lần gọi)
//   const nosqlTask = repo.findInText(db, nlu).catch(() => null);

//   // SQL tasks (intent + keyword fallback)
//   const sqlTasks = [];
//   const raw = String(message || '').toLowerCase()
//     .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
//   const wantPromo = /\bkhuyen\s*mai\b|\bkhuyen mai\b|\bvoucher\b|\bphieu\b|\bphi[eê]u\b|\bma\s*giam\b|\bm[aãă]\s*gi[aá]m\b|\buu\s*dai\b|\buu dai\b|\bpromo\b|\bdiscount\b|\bgiam\s*gia\b/.test(raw);
//   const wantHotel = /khach\s*san|kh[aá]ch\s*s[aạ]n|\bks\b|hotel|resort/.test(raw);
//   const wrap = (tag, p) =>
//     p.then(rows => ({ tag, name: tag, params: {}, rows }))
//      .catch(e => { console.error('[suggestHybrid] RPC fail', tag, e.message); return { tag, name: tag, params: {}, rows: [] }; });

//   if ((intent === 'hotels_top' || wantHotel) && city)
//     sqlTasks.push(wrap('hotels_top', getTopHotels(city, top_n, { llm: false })));
//   if ((intent === 'hotels_by_amenities' || (wantHotel && (filters?.amenities || context.filters?.amenities))) && city) {
//     const amenities = context.filters?.amenities || filters?.amenities || [];
//     sqlTasks.push(wrap('hotels_by_amenities', getHotelsByAmenities(city, amenities, top_n, { llm: false })));
//   }
//   const year = context.year ?? nlu?.time?.year ?? new Date().getFullYear();
//   const month = context.month ?? nlu?.time?.month ?? (new Date().getMonth() + 1);
//   if (intent === 'promotions_in_month' || (wantPromo && !city))
//     sqlTasks.push(wrap('promotions_in_month', getPromotionsInMonth(year, month, top_n, { llm: false })));
//   if ((intent === 'promotions_in_month_by_city' || (wantPromo && !!city)) && city)
//     sqlTasks.push(wrap('promotions_in_month_by_city', getPromotionsInMonthByCity(city, year, month, top_n, { llm: false })));
//   if ((intent === 'promotions_by_city' || (wantPromo && !!city)) && city)
//     sqlTasks.push(wrap('promotions_by_city', getPromotionsByCity(city, { llm: false })));

//   // Await
//   const [docFirst, ...sqlDatasets] = await Promise.all([nosqlTask, ...sqlTasks]);

//   // Hợp nhất logic tìm doc (bao gồm alias/merged + quét toàn KB)
//   const doc = await findProvinceDoc(db, nlu, docFirst);

//   let safeDoc = extractProvinceDoc(doc);
//   const cityFinal = (nlu.city && sameProvince(nlu.city, safeDoc))
//     ? nlu.city
//     : (safeDoc?.name || nlu.city);
//   safeDoc = filterDocByProvince(safeDoc, cityFinal);

//   const safeSql = sqlDatasets.length
//     ? sqlDatasets.map(ds => ({
//         ...ds,
//         rows: normalizeRows(ds.rows, ds.tag || ds.name || 'dataset')
//       }))
//     : [];

//   const payload = await compose({
//     doc: safeDoc,
//     sql: safeSql,
//     nlu,
//     filters: { ...(filters || {}), ...(context.filters || {}) },
//     user_ctx: { city: cityFinal, top_n, ...context }
//   });

//   if (safeDoc && Array.isArray(safeDoc.merged_from) && safeDoc.merged_from.length) {
//     const mergedNote = ` (dữ liệu gộp: ${safeDoc.merged_from.join(' + ')})`;
//     if (!payload.summary) payload.summary = `Gợi ý cho ${cityFinal}${mergedNote}`;
//     else if (!payload.summary.includes('dữ liệu gộp')) payload.summary += mergedNote;
//   }

//   payload.source = payload.source ||
//     (safeDoc && safeSql.length ? 'sql+nosql+llm'
//       : safeSql.length ? 'sql+llm'
//       : 'nosql+llm');
//   payload.latency_ms = Date.now() - started;
//   payload.province = safeDoc?.name || null;
//   return payload;
// }

/* ========== MULTI-STRATEGY SEARCH: Fix "Hồ Chí Minh" and "Đắk Lắk" failures ========== */
async function findProvinceDoc(db, nlu, firstDoc, queryText) {
  console.log('[findProvinceDoc] START - Input:', {
    nluCity: nlu?.city,
    queryText,
    hasFirstDoc: !!firstDoc
  });

  // 1) Use firstDoc if provided (from parallel query)
  let doc = firstDoc;
  let targetCity = nlu?.city;

  // 2) STRATEGY 1: Canonical Mapping (most reliable for tricky names)
  const inputText = queryText || nlu?.city || '';
  const canonicalName = canonicalFromText(inputText);
  
  if (canonicalName) {
    console.log('[findProvinceDoc] STRATEGY 1 (Canonical): Found mapping:', {
      input: inputText,
      canonical: canonicalName
    });
    
    targetCity = canonicalName;
    
    // Search by exact canonical name
    const canonN = normalize(canonicalName);
    doc = await repo.findByNorm(db, canonN).catch(() => null);
    
    if (!doc) {
      // Try findByProvinceExact (checks name + aliases + merged_from)
      doc = await repo.findByProvinceExact(db, canonN).catch(() => null);
    }
    
    if (doc) {
      console.log('[findProvinceDoc] ✓ Found via Canonical:', doc.name);
      return doc;
    }
  }

  // 3) STRATEGY 2: Direct norm field match
  if (!doc && queryText) {
    const msgN = normalize(String(queryText));
    console.log('[findProvinceDoc] STRATEGY 2 (Norm): Searching for:', msgN);
    
    doc = await repo.findByNorm(db, msgN).catch(() => null);
    
    if (doc) {
      console.log('[findProvinceDoc] ✓ Found via Norm:', doc.name);
      targetCity = doc.name;
      return doc;
    }
  }

  // 4) STRATEGY 3: Aliases array search (with/without spaces)
  if (!doc && queryText) {
    const msgN = normalize(String(queryText));
    const msgNNo = msgN.replace(/\s/g, '');
    
    console.log('[findProvinceDoc] STRATEGY 3 (Aliases):', { msgN, msgNNo });
    
    // Try with spaces
    doc = await repo.findByAlias(db, msgN).catch(() => null);
    
    // Try without spaces
    if (!doc) {
      doc = await repo.findByAlias(db, msgNNo).catch(() => null);
    }
    
    if (doc) {
      console.log('[findProvinceDoc] ✓ Found via Aliases:', doc.name);
      targetCity = doc.name;
      return doc;
    }
  }

  // 5) STRATEGY 4: Province Exact (comprehensive: name + aliases + merged_from)
  if (!doc && (queryText || nlu?.city)) {
    const searchText = queryText || nlu?.city;
    const normalized = normalize(String(searchText));
    
    console.log('[findProvinceDoc] STRATEGY 4 (ProvinceExact):', normalized);
    
    if (repo.findByProvinceExact) {
      doc = await repo.findByProvinceExact(db, normalized).catch(() => null);
      
      if (doc) {
        console.log('[findProvinceDoc] ✓ Found via ProvinceExact:', doc.name);
        targetCity = doc.name;
        return doc;
      }
    }
  }

  // 6) STRATEGY 5: Full-text search using NLU (last resort)
  if (!doc) {
    console.log('[findProvinceDoc] STRATEGY 5 (FullText): Using repo.findInText');
    
    doc = await repo.findInText(db, nlu).catch(() => null);
    
    if (doc) {
      console.log('[findProvinceDoc] ✓ Found via FullText:', doc.name);
      
      // Verify the doc matches the target city
      if (targetCity && !sameProvince(targetCity, doc)) {
        console.warn('[findProvinceDoc] FullText mismatch:', {
          targetCity,
          foundDoc: doc.name
        });
        
        // Trust targetCity over full-text result
        doc = { name: targetCity, places: [], dishes: [], tips: [] };
      } else {
        targetCity = doc.name;
      }
      
      return doc;
    }
  }

  // 7) FALLBACK: Create skeleton if we have targetCity but no doc
  if (!doc && targetCity) {
    console.log('[findProvinceDoc] ✗ No doc found. Creating skeleton for:', targetCity);
    doc = { name: targetCity, places: [], dishes: [], tips: [] };
    return doc;
  }

  // 8) FINAL FALLBACK: Try canonical on NLU city as last attempt
  if (!doc && nlu?.city) {
    const finalCanon = canonicalFromText(nlu.city);
    if (finalCanon) {
      console.log('[findProvinceDoc] Final attempt with canonical from NLU city:', finalCanon);
      targetCity = finalCanon;
      doc = { name: finalCanon, places: [], dishes: [], tips: [] };
      return doc;
    }
  }

  console.log('[findProvinceDoc] END - Result:', {
    found: !!doc,
    docName: doc?.name,
    targetCity
  });

  return doc;
}

// ================= IMPROVED suggest: Better aliases matching =================
async function suggest(db, { message, context = {} }) {
  const started = Date.now();
  const nlu = analyze(message);
  const { top_n = context.top_n || 10, filters = {} } = nlu;

  // Use improved findProvinceDoc for better alias matching
  const doc = await findProvinceDoc(db, nlu, null, message);

  const llmOn = typeof context.use_llm === 'boolean' ? context.use_llm : USE_LLM;
  // SỬA 1: Khi LLM tắt, vẫn trả đủ places + dishes + tips
  if (!llmOn) {
    const safe = extractProvinceDoc(doc) || { places: [], dishes: [], tips: [] };
    const top = (arr) => (Array.isArray(arr) ? arr.slice(0, top_n) : []);
    return {
      promotions: [],
      hotels: [],
      places: top(safe.places),
      dishes: top(safe.dishes),
      tips: Array.isArray(safe.tips) ? safe.tips : [],
      province: safe.name || nlu.city || null,
      source: 'nosql',
      latency_ms: Date.now() - started
    };
  }

  const safeDoc = extractProvinceDoc(doc);
  const cityFinal = (nlu.city && sameProvince(nlu.city, safeDoc))
    ? nlu.city
    : (safeDoc?.name || nlu.city);

  const payload = await compose({
    doc: safeDoc,
    nlu,
    filters: { ...(filters || {}), ...(context.filters || {}) },
    user_ctx: { top_n, ...context, city: cityFinal }
  });

  if (safeDoc && safeDoc.merged_from?.length) {
    const mergedNote = ` (dữ liệu gộp: ${safeDoc.merged_from.join(' + ')})`;
    if (!payload.summary) payload.summary = `Gợi ý cho ${cityFinal}${mergedNote}`;
    else if (!payload.summary.includes('dữ liệu gộp')) payload.summary += mergedNote;
  } else if (!payload.summary) {
    payload.summary = `Gợi ý cho ${cityFinal}`;
  }

  payload.source = payload.source || 'nosql+llm';
  payload.latency_ms = Date.now() - started;
  payload.province = safeDoc?.name || cityFinal || null;
  return payload;
}

// ================= PATCH USE: suggestHybrid =================
async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now();
  const nlu = analyze(message);
  const history = Array.isArray(context.history) ? context.history : [];
  const historyCity = history.find(t => t?.nlu?.city)?.nlu?.city || null;
  const monthMatch = String(message || '').match(/th[aá]ng\s*(\d{1,2})/i);
  const askedMonth = monthMatch ? Math.max(1, Math.min(12, Number(monthMatch[1]))) : null;
  const nluCtx = { ...nlu, city: nlu.city || historyCity, month: askedMonth };
  const { intent, top_n = context.top_n || 10, filters = {}, city } = nluCtx;

  if (intent === 'chitchat') {
    const payload = await composeSmallTalk({ message, nlu: nluCtx, history });
    payload.latency_ms = Date.now() - started;
    payload.province = null;
    return payload;
  }

  if (intent === 'ask_weather') {
    const cityTarget = nluCtx.city || historyCity || null;
    let safeDoc = null;
    if (cityTarget) {
      try {
        const docRaw = await findProvinceDoc(db, { ...nluCtx, city: cityTarget }, null, message);
        const extracted = extractProvinceDoc(docRaw);
        safeDoc = filterDocByProvince(extracted, cityTarget);
      } catch (err) {
        console.warn('[suggestHybrid] weather doc fetch failed:', err?.message || err);
      }
    }
    const payload = await composeCityFallback({
      city: cityTarget,
      intent,
      message,
      history,
      month: askedMonth,
      doc: safeDoc
    });
    payload.latency_ms = Date.now() - started;
    payload.province = safeDoc?.name || cityTarget || null;
    return payload;
  }

  const nosqlTask = repo.findInText(db, nluCtx).catch(() => null);

  const sqlTasks = [];
  const raw = String(message || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const wantPromo = /\bkhuyen\s*mai\b|\bkhuyen mai\b|\bvoucher\b|\bphieu\b|\bphi[eê]u\b|\bma\s*giam\b|\bm[aãă]\s*gi[aá]m\b|\buu\s*dai\b|\buu dai\b|\bpromo\b|\bdiscount\b|\bgiam\s*gia\b/.test(raw);
  const wantHotel = /khach\s*san|kh[aá]ch\s*s[aạ]n|\bks\b|hotel|resort/.test(raw);
  const wrap = (tag, p) =>
    p.then(rows => ({ tag, name: tag, params: {}, rows }))
     .catch(e => { console.error('[suggestHybrid] RPC fail', tag, e.message); return { tag, name: tag, params: {}, rows: [] }; });

  console.log('[suggestHybrid] Query analysis:', { city, intent, wantHotel, wantPromo, top_n });
  
  if ((intent === 'hotels_top' || wantHotel) && city)
    sqlTasks.push(wrap('hotels_top', getTopHotels(city, top_n, { llm: false })));
  if ((intent === 'hotels_by_amenities' || (wantHotel && (filters?.amenities || context.filters?.amenities))) && city) {
    const amenities = context.filters?.amenities || filters?.amenities || [];
    sqlTasks.push(wrap('hotels_by_amenities', getHotelsByAmenities(city, amenities, top_n, { llm: false })));
  }
  const year = context.year ?? nlu?.time?.year ?? new Date().getFullYear();
  const month = context.month ?? nlu?.time?.month ?? (new Date().getMonth() + 1);
  if (intent === 'promotions_in_month' || (wantPromo && !city))
    sqlTasks.push(wrap('promotions_in_month', getPromotionsInMonth(year, month, top_n, { llm: false })));
  if ((intent === 'promotions_in_month_by_city' || (wantPromo && !!city)) && city)
    sqlTasks.push(wrap('promotions_in_month_by_city', getPromotionsInMonthByCity(city, year, month, top_n, { llm: false })));
  if ((intent === 'promotions_by_city' || (wantPromo && !!city)) && city)
    sqlTasks.push(wrap('promotions_by_city', getPromotionsByCity(city, { llm: false })));

  console.log('[suggestHybrid] SQL tasks count:', sqlTasks.length);
  const [docFirst, ...sqlDatasets] = await Promise.all([nosqlTask, ...sqlTasks]);
  console.log('[suggestHybrid] SQL datasets received:', sqlDatasets.map(ds => ({ tag: ds.tag, rowCount: ds.rows?.length || 0 })));

  const doc = await findProvinceDoc(db, nluCtx, docFirst, message);
  const safeDoc = extractProvinceDoc(doc);
  const cityFinal = (nluCtx.city && sameProvince(nluCtx.city, safeDoc))
    ? nluCtx.city
    : (safeDoc?.name || nluCtx.city);

  const safeSql = sqlDatasets.length
    ? sqlDatasets.map(ds => ({
        ...ds,
        rows: normalizeRows(ds.rows, ds.tag || ds.name || 'dataset')
      }))
    : [];

  const payload = await compose({
    doc: safeDoc,
    sql: safeSql,
    nlu: nluCtx,
    filters: { ...(filters || {}), ...(context.filters || {}) },
    user_ctx: { city: cityFinal, top_n, ...context }
  });

  if (safeDoc && safeDoc.merged_from?.length) {
    const mergedNote = ` (dữ liệu gộp: ${safeDoc.merged_from.join(' + ')})`;
    if (!payload.summary) payload.summary = `Gợi ý cho ${cityFinal}${mergedNote}`;
    else if (!payload.summary.includes('dữ liệu gộp')) payload.summary += mergedNote;
  } else if (!payload.summary) {
    payload.summary = `Gợi ý cho ${cityFinal}`;
  }

  payload.source = payload.source ||
    (safeDoc && safeSql.length ? 'sql+nosql+llm'
      : safeSql.length ? 'sql+llm'
      : 'nosql+llm');
  payload.latency_ms = Date.now() - started;
  payload.province = safeDoc?.name || cityFinal || null;
  return payload;
}

// ==== ADD MISSING HELPERS (prevent ReferenceError: sameProvince is not defined) ====
// Avoid redefining if hot-reloaded
if (typeof sameProvince !== 'function') {
  function sameProvince(userCity, doc) {
    if (!userCity || !doc) return false;
    const q = normalize(String(userCity));
    const names = new Set();
    const add = v => { if (v) names.add(normalize(String(v))); };

    add(doc.name); add(doc.province); add(doc.title);

    const aliasFields = ['aliases','alias','aka','aka_list','alt_names'];
    aliasFields.forEach(k => (Array.isArray(doc[k]) ? doc[k] : []).forEach(add));

    const mergedFields = ['merged_from','mergedFrom','merged','merge_from'];
    mergedFields.forEach(k => (Array.isArray(doc[k]) ? doc[k] : []).forEach(add));

    return names.has(q);
  }
  // expose (optional)
  global.sameProvince = sameProvince;
}
if (typeof extractProvinceDoc !== 'function') {
  const _asArray = x => (Array.isArray(x) ? x : []);
  const _toNameItems = arr =>
    _asArray(arr)
      .map(i => {
        if (!i) return null; // null/undefined
        if (typeof i === 'string') return { name: i };
        if (typeof i === 'object' && i.name) return i; // Already has .name
        return null; // Invalid object without .name
      })
      .filter(Boolean);

  const uniqBy = (arr, keyFn) => {
    const seen = new Set();
    return (arr || []).filter(x => {
      const k = keyFn(x);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  const normKey = v => normalize(String(v || ''));

  function extractProvinceDoc(raw) {
    if (!raw) return null;

    try {
      // giữ bản gốc để fallback nếu lọc hết
      const rawPlaces = _toNameItems(
        raw.places || raw.pois || raw.locations || raw.sites || raw['dia_danh'] || raw['địa_danh']
      );
      const rawDishes = _toNameItems(
        raw.dishes || raw.foods || raw.specialties || raw.specialities || raw['mon_an'] || raw['món_ăn']
      );
      const rawTips = _asArray(raw.tips);

    // dedupe mềm: giữ bản đầu tiên theo key đã chuẩn hoá
    let places = uniqBy(rawPlaces, x => x && x.name ? normKey(x.name) : null).filter(Boolean);
    let dishes = uniqBy(rawDishes, x => x && x.name ? normKey(x.name) : null).filter(Boolean);
    let tips   = uniqBy(rawTips, x => {
      if (typeof x === 'string') return normKey(x);
      if (x && x.name) return normKey(x.name);
      return x ? normKey(JSON.stringify(x)) : null;
    }).filter(Boolean);

    // Fallback: nếu vì lý do nào đó lọc thành rỗng -> trả về bản gốc (để không "mất dữ liệu")
    if (places.length === 0 && rawPlaces.length) places = rawPlaces;
    if (dishes.length === 0 && rawDishes.length) dishes = rawDishes;

    console.log(`[extractProvinceDoc] ${raw.name}: ${places.length} places, ${dishes.length} dishes, ${tips.length} tips`);

    return {
      name: raw.name || raw.title || raw.province || 'unknown',
      places,
      dishes,
      tips,
      aliases: raw.aliases || [],
      merged_from: raw.merged_from || raw.mergedFrom || []
    };
    } catch (err) {
      console.error('[extractProvinceDoc] Error:', err.message, 'Doc:', raw?._id || raw?.name);
      return {
        name: raw?.name || raw?.title || 'unknown',
        places: [],
        dishes: [],
        tips: [],
        aliases: raw?.aliases || [],
        merged_from: raw?.merged_from || raw?.mergedFrom || []
      };
    }
  }
  global.extractProvinceDoc = extractProvinceDoc;
}

module.exports = {
  // SQL search helpers
  searchHotels,
  getHotelsByAnyAmenities,
  getHotelFull,
  getPromotionsValidToday,
  getPromotionsValidTodayByCity,
  getPromotionsByKeywordCityMonth,
  promoCheckApplicability,
  promoUsageStats,
  listHotelCities,

  // NoSQL/LLM compose
  suggest,
  suggestHybrid,

  // Supabase RPC wrappers
  getTopHotels,
  getHotelsByAmenities,
  getPromotionsInMonth,
  getPromotionsInMonthByCity,
  getPromotionsByCity,
};
