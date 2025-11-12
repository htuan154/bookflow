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
const { compose } = require('./composer.service');            // LLM composer (guardrails/cache/fallback)
const { supabase } = require('../../../config/supabase');        // điều chỉnh path nếu dự án bạn khác

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';


// ---- Canonical VN provinces - rút gọn tên chuẩn để đối chiếu ----
const VN_PROVINCES = [
  'An Giang','Bà Rịa Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh',
  'Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau',
  'Cần Thơ','Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên','Đồng Nai',
  'Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Nội','Hà Tĩnh','Hải Dương',
  'Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên','Khánh Hòa','Kiên Giang',
  'Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Long An','Nam Định',
  'Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình',
  'Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La',
  'Tây Ninh','Thái Bình','Thái Nguyên','Thanh Hóa','Thừa Thiên Huế','Tiền Giang',
  'TP Hồ Chí Minh','Hồ Chí Minh','Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái'
];

const PROV_CANON = new Map(
  VN_PROVINCES.map(n => [normalize(n), n])
);

function canonicalFromText(text) {
  if (!text) return null;
  const q = normalize(String(text));
  const qNo = q.replace(/\s/g,'');
  for (const [norm, name] of PROV_CANON) {
    if (q === norm || qNo === norm.replace(/\s/g,'')) return name;
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
  'quang nam': [
    'quang nam','hoi an','hoi-an','my son','thanh dia my son','cu lao cham'
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
  'ba ria vung tau': [
    'ba ria vung tau','vung tau','ba ria','long hai','binh chau','con dao','condao'
  ],
  'quang binh': [
    'quang binh','phong nha','ke bang','son doong','thien duong'
  ],
  'ninh binh': [
    'ninh binh','trang an','tam coc','bai dinh','van long'
  ],
  'thua thien hue': [
    'thua thien hue','hue','kinh thanh hue','thien mu','truong tien','lang tam'
  ],
  'phu yen': [
    'phu yen','ghenh da dia','ghe nh da dia','dam o loan','vuc hom'
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
  'ben tre': [
    'ben tre','cai mon'
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

/* ========== REPLACED findProvinceDoc (repo-based, no file JSON fallback) ========== */
async function findProvinceDoc(db, nlu, firstDoc, queryText) {
  // 1) Doc tìm theo toàn câu (hoặc doc song song đã có)
  let doc = firstDoc || await repo.findInText(db, nlu).catch(() => null);

  // 2) Luôn đoán city từ câu hỏi (ưu tiên hơn NLU nếu mâu thuẫn)
  let targetCity = nlu.city;
  let guess = null;
  if (queryText) {
    const msgN = normalize(String(queryText));
    const byNorm  = await repo.findByNorm(db, msgN).catch(() => null);
    const byAlias = byNorm ? null : await repo.findByAlias(db, msgN).catch(() => null);
    guess = byNorm || byAlias || (repo.findByProvinceExact
      ? await repo.findByProvinceExact(db, msgN).catch(() => null)
      : null);
  }
  if (!targetCity && guess?.name) {
    targetCity = guess.name;
  } else if (targetCity && guess?.name && !sameProvince(targetCity, guess)) {
    targetCity = guess.name;
  } else if (!guess) {
    // Nếu không match NoSQL, thử ép theo canonical 63 tỉnh
    const canon = canonicalFromText(queryText);
    if (canon) {
      targetCity = canon;
    }
  }

  // 3) Refetch chỉ theo targetCity nếu chưa có hoặc lệch
  if (targetCity && (!doc || (doc?.name && !sameProvince(targetCity, doc)))) {
    const nluCityOnly = analyze(targetCity);
    doc = await repo.findInText(db, nluCityOnly).catch(() => null);
  }

  // 4) Fallback exact (name / aliases / merged_from)
  if (targetCity && (!doc || (doc?.name && !sameProvince(targetCity, doc))) && repo.findByProvinceExact) {
    const exact = await repo.findByProvinceExact(db, targetCity).catch(() => null);
    if (exact) doc = exact;
  }

  // 5) Nếu vẫn lệch -> skeleton đúng tỉnh
  if (targetCity && doc?.name && !sameProvince(targetCity, doc)) {
    doc = { name: targetCity, places: [], dishes: [], tips: [] };
  }

  // 6) Không tìm thấy gì nhưng có targetCity
  if (!doc && targetCity) {
    doc = { name: targetCity, places: [], dishes: [], tips: [] };
  }

  return doc;
}

// ================= PATCH USE: suggest =================
async function suggest(db, { message, context = {} }) {
  const started = Date.now();
  const nlu = analyze(message);
  const { top_n = context.top_n || 10, filters = {} } = nlu;

  // SỬA 2: Ưu tiên match đúng tỉnh/thành theo tên/alias trước
  const targetCity = nlu?.city || null;
  let doc = null;
  if (targetCity) {
    doc = await repo.findByProvinceExact(db, targetCity).catch(() => null);
  }
  doc = doc || await repo.findInText(db, nlu).catch(() => null);

  // 2) Nếu có city nhưng doc KHÔNG chứa city qua name/alias/merged → refetch chỉ với city
  if (nlu.city && doc?.name && !sameProvince(nlu.city, doc)) {
    console.warn('[suggest] mismatch -> refetch city only', { query: message, nlu_city: nlu.city, doc_name: doc.name });
    const nluCityOnly = analyze(nlu.city);
    doc = await repo.findInText(db, nluCityOnly).catch(() => null);
    // 3) Nếu vẫn lệch thật sự mới ép skeleton rỗng cho đúng tỉnh
    if (doc?.name && !sameProvince(nlu.city, doc)) {
      doc = { name: nlu.city, places: [], dishes: [], tips: [] };
    }
  }
  // 4) Không tìm thấy gì nhưng user nêu city → skeleton
  if (!doc && nlu.city) {
    doc = { name: nlu.city, places: [], dishes: [], tips: [] };
  }

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
  const { intent, top_n = context.top_n || 10, filters = {}, city } = nlu;

  const nosqlTask = repo.findInText(db, nlu).catch(() => null);

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

  const doc = await findProvinceDoc(db, nlu, docFirst, message);
  const safeDoc = extractProvinceDoc(doc);
  const cityFinal = (nlu.city && sameProvince(nlu.city, safeDoc))
    ? nlu.city
    : (safeDoc?.name || nlu.city);

  const safeSql = sqlDatasets.length
    ? sqlDatasets.map(ds => ({
        ...ds,
        rows: normalizeRows(ds.rows, ds.tag || ds.name || 'dataset')
      }))
    : [];

  const payload = await compose({
    doc: safeDoc,
    sql: safeSql,
    nlu,
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
