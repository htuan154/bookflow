'use strict';

/**
 * Chatbot service — kết hợp NoSQL + Supabase RPC + LLM compose
 * - TẤT CẢ các hàm RPC/search đều nhận thêm tham số tùy chọn `opts` ở cuối:
 * + opts.llm: boolean (ưu tiên hơn .env USE_LLM)
 * + opts.context: object (filters/top_n/... chuyển qua composer)
 * + opts.nlu: object (nếu muốn truyền NLU có sẵn)
 * - Nếu LLM bật -> hàm trả payload từ compose() (summary/sections/source/...)
 * - Nếu LLM tắt -> hàm trả raw data như trước (backward-compatible)
 */

const { analyze, normalize } = require('./nlu.service');
const repo = require('../repositories/province.repo');        // findInText(db, nlu)
const { compose, composeSmallTalk, composeCityFallback } = require('./composer.service');            // LLM composer (guardrails/cache/fallback)
const { supabase } = require('../../../config/supabase');        // điều chỉnh path nếu dự án bạn khác

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';


// ---- IMPROVED Canonical Mapping for tricky provinces ----


// ---- LOGIC LỌC DYNAMIC (DỰA TRÊN DATA JSON, KHÔNG HARD-CODE) ----
function filterDocByProvince(doc, target) {
  if (!doc) return doc;
  const norm = (s) => normalize(String(s || ''));
  
  // 1. Tự động lấy danh sách tỉnh hợp lệ từ chính document
  // Ví dụ: Doc Gia Lai có merged_from: ["Bình Định", "Gia Lai"] -> Code tự hiểu 2 tên này là "người nhà"
  const validRegions = new Set(
    (doc.merged_from || doc.mergedFrom || [])
      .map(norm)
      .filter(Boolean)
  );
  // Luôn thêm tên chính của doc (vd: "gia lai")
  validRegions.add(norm(doc.name));
  
  // 2. Logic kiểm tra: Item có hợp lệ không?
  const isValidItem = (name) => {
    if (!name) return false;
    const s = norm(name);

    // RULE A: Nếu tên item chứa tên của bất kỳ vùng hợp lệ nào -> GIỮ LẠI
    // VD: "Eo Gió (Bình Định)" chứa "binh dinh" (có trong merged_from) -> OK
    for (const region of validRegions) {
      if (s.includes(region)) return true;
    }
    
    // RULE B: Nếu không chứa tên tỉnh nào cả (VD: "Tháp Đôi") -> Mặc định GIỮ LẠI
    // (Trừ khi bạn muốn làm chặt hơn thì thêm blacklist, nhưng hiện tại hãy để thoáng cho AI xử lý)
    return true; 
  };

  // 3. Thực hiện lọc
  return {
    ...doc,
    places: (doc.places || [])
      .filter(p => p && (typeof p === 'string' || p.name))
      .filter(p => isValidItem(typeof p === 'string' ? p : p.name)),
      
    dishes: (doc.dishes || [])
      .filter(d => d && (typeof d === 'string' || d.name))
      .filter(d => isValidItem(typeof d === 'string' ? d : d.name)),
      
    tips: (doc.tips || []) // Tips thường chung chung, giữ nguyên
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

/* ========== MULTI-STRATEGY SEARCH (DATA-DRIVEN VERSION) ========== */
async function findProvinceDoc(db, nlu, firstDoc, queryText) {
  console.log('[findProvinceDoc] START - Input:', {
    nluCity: nlu?.city,
    queryText,
    hasFirstDoc: !!firstDoc
  });

  // 1) Use firstDoc if provided (from parallel query)
  let doc = firstDoc;
  let targetCity = nlu?.city; // Tên city gốc từ NLU

  // 2) STRATEGY 1: Tìm kiếm chính xác bằng Alias trong DB (Mạnh nhất cho Data Gộp)
  // VD: Khách nói "Quy Nhơn" -> Repo tìm trong mảng aliases -> Ra doc "Gia Lai"
  if (!doc && (queryText || targetCity)) {
    const q = normalize(queryText || targetCity);
    const qNoSpace = q.replace(/\s/g, '');
    
    console.log('[findProvinceDoc] STRATEGY 1 (DB Aliases): searching for', q);
    
    // Tìm có dấu cách
    doc = await repo.findByAlias(db, q).catch(() => null);
    
    // Tìm không dấu cách (dính liền)
    if (!doc) {
       doc = await repo.findByAlias(db, qNoSpace).catch(() => null);
    }
    
    if (doc) {
      console.log('[findProvinceDoc] ✓ Found via DB Alias:', doc.name);
      return doc; 
    }
  }

  // 3) STRATEGY 2: Province Exact Match
  if (!doc && targetCity) {
    const normalized = normalize(String(targetCity));
    if (repo.findByProvinceExact) {
      doc = await repo.findByProvinceExact(db, normalized).catch(() => null);
      if (doc) {
        console.log('[findProvinceDoc] ✓ Found via ProvinceExact:', doc.name);
        return doc;
      }
    }
  }

  // 4) STRATEGY 3: Full-text search (Last resort)
  if (!doc) {
    console.log('[findProvinceDoc] STRATEGY 3 (FullText): Using repo.findInText');
    doc = await repo.findInText(db, nlu).catch(() => null);
    
    if (doc) {
      console.log('[findProvinceDoc] ✓ Found via FullText:', doc.name);
      // Logic kiểm tra mismatch
      if (targetCity && !sameProvince(targetCity, doc)) {
         // Nếu NLU detect là Hà Nội mà TextSearch ra Sài Gòn -> Có vấn đề, ưu tiên NLU
         console.warn('[findProvinceDoc] FullText mismatch. Trusting NLU target over FullText.');
         doc = { name: targetCity, places: [], dishes: [], tips: [] };
      }
      return doc;
    }
  }

  // 5) FALLBACK: Create skeleton
  if (!doc && targetCity) {
    console.log('[findProvinceDoc] ✗ No doc found. Creating skeleton for:', targetCity);
    doc = { name: targetCity, places: [], dishes: [], tips: [] };
  }

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

// --- [PHIÊN BẢN SUPER CLEAN v5.3] FIX LỖI MẤT DẤU (Accent Preservation) ---
// Khắc phục: "Phở bò Hà Nội" -> giữ "Phở bò" (có dấu) để khớp DB
async function scanItemInDB(db, message, nluCity = null) {
  if (!message || message.length < 2) return null;

  // 1. Danh sách từ khóa rác
  const stopWords = [
    'cho tôi biết về', 'cho tôi biết', 'tìm hiểu về', 'giới thiệu về',
    'mô tả', 'chi tiết', 'thông tin', 'giới thiệu', 'là gì', 'ở đâu', 
    'review', 'đánh giá', 'có tốt không', 'có ngon không', 'ngon không', 'đẹp không',
    'thế nào', 'ra sao', 'như thế nào', 'ntn', 'cho hỏi', 'tìm hiểu',
    'món', 'địa danh', 'địa điểm', 'có gì', 'ăn gì', 'chơi gì',
    'nổi tiếng', 'nhất', 'lắm', 'tại', 'trong', 'ngoài', 'hay', 'tuyệt', 'có', 'ở',
    'đi', 'ăn', 'mua', 'bán', 'xem', 'biết'
  ];

  const pattern = stopWords.map(w => w.replace(/\s+/g, '\\s+')).join('|');
  const keywordsRegex = new RegExp(`\\b(${pattern})\\b`, 'gi');
  
  // Bước 1: Xóa từ khóa rác (Giữ nguyên dấu)
  let cleanQuery = message.replace(keywordsRegex, ' ').trim();
  cleanQuery = cleanQuery.replace(/[?!.,;:"'()]/g, '').replace(/\s+/g, ' ').trim();
  
  if (cleanQuery.length < 2) cleanQuery = message.replace(/[?!.,;]/g, '').trim();

  // 2. Tạo các biến thể tìm kiếm
  const searchVariations = [cleanQuery]; 
  
  // Nếu có City, tạo thêm biến thể cắt bỏ City nhưng GIỮ NGUYÊN DẤU
  if (nluCity) {
      // Cách cũ (SAI): const stripped = normalize(cleanQuery)... -> Mất dấu
      // Cách mới (ĐÚNG): Dùng RegExp để cắt city ra khỏi chuỗi gốc
      const cityRegex = new RegExp(nluCity.trim().replace(/\s+/g, '\\s*'), 'gi');
      const stripped = cleanQuery.replace(cityRegex, '').trim();
      
      // Chỉ thêm nếu stripped còn đủ dài và khác bản gốc
      if (stripped.length > 1 && stripped !== cleanQuery) {
          searchVariations.push(stripped);
      }
  }

  console.log('[scanItemInDB] 🔍 Đang tìm:', searchVariations);

  try {
    const allCols = await db.listCollections().toArray();
    const targetCols = allCols
        .map(c => c.name)
        .filter(name => !name.startsWith('system.') && !name.startsWith('admin') && !name.startsWith('local'));

    for (const queryVariant of searchVariations) {
        const regex = new RegExp(queryVariant, 'i');

        for (const colName of targetCols) {
            const found = await db.collection(colName).findOne({
                $or: [
                    { 'places.name': regex },
                    { 'dishes.name': regex }
                ]
            });

            if (found) {
                const allItems = [
                    ...(found.places || []).map(x => ({ ...x, type: 'place' })),
                    ...(found.dishes || []).map(x => ({ ...x, type: 'dish' }))
                ];

                const match = allItems.find(item => {
                    const iName = normalize(item.name || '');
                    const qName = normalize(queryVariant);
                    // Match 2 chiều
                    return iName.includes(qName) || qName.includes(iName);
                });

                if (match) {
                    console.log(`[scanItemInDB] ✅ MATCH! "${queryVariant}" -> "${match.name}" (Doc: ${found.name})`);
                    return { doc: found, item: match, type: match.type };
                }
            }
        }
    }
  } catch (e) {
    console.warn('[scanItemInDB] ❌ Lỗi:', e.message);
  }
  return null;
}

// ================= PATCH USE: suggestHybrid (LOGIC v5.1 - FIXED CONTEXT STICKINESS) =================
async function suggestHybrid(db, { message, context = {} }) {
  const started = Date.now();
  const nlu = analyze(message);
  
  // 1. === ƯU TIÊN 1: QUÉT DB TÌM ITEM CỤ THỂ ===
  // Chạy ngay lập tức để bắt các câu hỏi "Review X", "Mô tả Y"
  const dbMatch = await scanItemInDB(db, message, nlu.city);
  
  if (dbMatch) {
    console.log('[suggestHybrid] => 🔥 Tìm thấy Item -> Thinking Mode!');
    
    // Chuẩn hóa document tỉnh tìm được
    const safeDoc = extractProvinceDoc(dbMatch.doc); 
    
    // Gọi Composer với tín hiệu forcedItem
    const payload = await compose({
      doc: safeDoc,
      nlu: { intent: 'ask_details', city: safeDoc.name },
      filters: {},
      user_ctx: { 
        forcedItem: dbMatch.item, // <--- Tín hiệu "Ép buộc"
        forcedType: dbMatch.type,
        ...context
      }
    });

    payload.latency_ms = Date.now() - started;
    payload.province = safeDoc.name;
    return payload; // Trả về ngay lập tức
  }

  // 2. === XỬ LÝ CONTEXT (CHỐNG DÍNH CONTEXT CŨ) ===
  const history = Array.isArray(context.history) ? context.history : [];
  const historyCity = history.find(t => t?.nlu?.city)?.nlu?.city || null;
  
  // FIX BUG: Nếu câu hỏi là Specific (hỏi chi tiết) mà không tìm thấy ở bước 1,
  // KHÔNG được fallback về historyCity ngay. Chỉ fallback nếu câu hỏi là Generic (Ăn gì, chơi đâu).
  // Ví dụ: Đang ở Phan Thiết, hỏi "Chùa Tam Chúc" -> QueryType=specific -> Không lấy Phan Thiết.
  let targetCity = nlu.city;
  if (!targetCity && nlu.queryType !== 'specific' && historyCity) {
      targetCity = historyCity; 
  }

  const nluCtx = { ...nlu, city: targetCity }; // Context sạch

  // 3. === ƯU TIÊN 2: NLU CHITCHAT ===
  // Chỉ chitchat nếu không có địa điểm cụ thể nào được nhắm tới
  if (nluCtx.intent === 'chitchat' && !targetCity) {
    const payload = await composeSmallTalk({ message, nlu: nluCtx, history });
    payload.latency_ms = Date.now() - started;
    payload.province = null;
    return payload;
  }
  
  // 4. === CÁC LUỒNG KHÁC (Weather, SQL, NoSQL Fallback) ===
  
  // 4.1 Weather
  if (nluCtx.intent === 'ask_weather') {
    let safeDoc = null;
    if (targetCity) {
      try {
        const docRaw = await findProvinceDoc(db, nluCtx, null, message);
        const extracted = extractProvinceDoc(docRaw);
        safeDoc = filterDocByProvince(extracted, targetCity);
      } catch (err) {
        console.warn('[suggestHybrid] weather doc fetch failed:', err?.message || err);
      }
    }
    const monthMatch = String(message || '').match(/th[aá]ng\s*(\d{1,2})/i);
    const askedMonth = monthMatch ? Math.max(1, Math.min(12, Number(monthMatch[1]))) : null;
    
    const payload = await composeCityFallback({
      city: targetCity,
      intent: nluCtx.intent,
      message,
      history,
      month: askedMonth,
      doc: safeDoc
    });
    payload.latency_ms = Date.now() - started;
    payload.province = safeDoc?.name || targetCity || null;
    return payload;
  }

  // 4.2 Parallel Search (NoSQL + SQL RPC)
  // Text search dùng context đã làm sạch (nluCtx)
  const nosqlTask = repo.findInText(db, { ...nluCtx, normalized: normalize(message) }).catch(() => null);

  const sqlTasks = [];
  const raw = String(message || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const wantPromo = /\bkhuyen\s*mai\b|\bkhuyen mai\b|\bvoucher\b|\bphieu\b|\bphi[eê]u\b|\bma\s*giam\b|\bm[aãă]\s*gi[aá]m\b|\buu\s*dai\b|\buu dai\b|\bpromo\b|\bdiscount\b|\bgiam\s*gia\b/.test(raw);
  const wantHotel = /khach\s*san|kh[aá]ch\s*s[aạ]n|\bks\b|hotel|resort/.test(raw);
  const wrap = (tag, p) =>
    p.then(rows => ({ tag, name: tag, params: {}, rows }))
     .catch(e => { console.error('[suggestHybrid] RPC fail', tag, e.message); return { tag, name: tag, params: {}, rows: [] }; });

  const city = targetCity; // Dùng targetCity đã fix
  const top_n = context.top_n || nlu.top_n || 10;
  const filters = nlu.filters || {};

  console.log('[suggestHybrid] Query analysis:', { city, intent: nluCtx.intent, wantHotel, wantPromo, top_n });
  
  if ((nluCtx.intent === 'hotels_top' || wantHotel) && city)
    sqlTasks.push(wrap('hotels_top', getTopHotels(city, top_n, { llm: false })));
  if ((nluCtx.intent === 'hotels_by_amenities' || (wantHotel && (filters?.amenities || context.filters?.amenities))) && city) {
    const amenities = context.filters?.amenities || filters?.amenities || [];
    sqlTasks.push(wrap('hotels_by_amenities', getHotelsByAmenities(city, amenities, top_n, { llm: false })));
  }
  const year = context.year ?? nlu?.time?.year ?? new Date().getFullYear();
  const month = context.month ?? nlu?.time?.month ?? (new Date().getMonth() + 1);
  if (nluCtx.intent === 'promotions_in_month' || (wantPromo && !city))
    sqlTasks.push(wrap('promotions_in_month', getPromotionsInMonth(year, month, top_n, { llm: false })));
  if ((nluCtx.intent === 'promotions_in_month_by_city' || (wantPromo && !!city)) && city)
    sqlTasks.push(wrap('promotions_in_month_by_city', getPromotionsInMonthByCity(city, year, month, top_n, { llm: false })));
  if ((nluCtx.intent === 'promotions_by_city' || (wantPromo && !!city)) && city)
    sqlTasks.push(wrap('promotions_by_city', getPromotionsByCity(city, { llm: false })));

  const [docFirst, ...sqlDatasets] = await Promise.all([nosqlTask, ...sqlTasks]);

  // 4.3 Tìm document tỉnh
  const doc = await findProvinceDoc(db, nluCtx, docFirst, message);
  const safeDoc = extractProvinceDoc(doc);
  
  // Logic hiển thị tên thành phố
  const cityFinal = (targetCity && sameProvince(targetCity, safeDoc))
    ? targetCity
    : (safeDoc?.name || targetCity);

  const safeSql = sqlDatasets.length
    ? sqlDatasets.map(ds => ({
        ...ds,
        rows: normalizeRows(ds.rows, ds.tag || ds.name || 'dataset')
      }))
    : [];

  // 5. Compose cuối cùng
  const payload = await compose({
    doc: safeDoc,
    sql: safeSql,
    nlu: nluCtx,
    filters: { ...(filters || {}), ...(context.filters || {}) },
    user_ctx: { city: cityFinal, top_n, ...context }
  });

  // Xử lý ghi chú dữ liệu gộp
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

// ==== ADD MISSING HELPERS (Data-Driven Version) ====
// Avoid redefining if hot-reloaded
if (typeof sameProvince !== 'function') {
  function sameProvince(userCity, doc) {
    if (!userCity || !doc) return false;
    const q = normalize(String(userCity));
    const qNoSpace = q.replace(/\s/g, '');

    // 1. Kiểm tra tên chính
    if (normalize(doc.name) === q) return true;
    if (normalize(doc.name).replace(/\s/g, '') === qNoSpace) return true;

    // 2. Kiểm tra danh sách Alias trong DB (Thay thế cho canonicalFromText)
    // Doc nào cũng có mảng aliases (VD: Gia Lai có ["quy nhon", "binh dinh"...])
    const aliases = Array.isArray(doc.aliases) ? doc.aliases : [];
    
    // Check alias có dấu & không dấu
    if (aliases.some(a => normalize(a) === q)) return true;
    if (aliases.some(a => normalize(a).replace(/\s/g, '') === qNoSpace)) return true;

    // 3. Kiểm tra các trường merged/title khác
    const extraNames = new Set();
    const add = v => { if (v) extraNames.add(normalize(String(v))); };

    add(doc.province); 
    add(doc.title);
    
    const mergedFields = ['merged_from','mergedFrom','merged','merge_from'];
    mergedFields.forEach(k => (Array.isArray(doc[k]) ? doc[k] : []).forEach(add));

    if (extraNames.has(q)) return true;
    if (extraNames.has(qNoSpace)) return true;

    return false;
  }
  // expose (optional)
  global.sameProvince = sameProvince;
}

if (typeof extractProvinceDoc !== 'function') {
  const _asArray = x => (Array.isArray(x) ? x : []);
  const _toNameItems = arr =>
    _asArray(arr)
      .map(i => {
        if (!i) return null; 
        if (typeof i === 'string') return { name: i };
        if (typeof i === 'object' && i.name) return i; 
        return null; 
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
      // Giữ bản gốc để fallback nếu lọc hết
      const rawPlaces = _toNameItems(
        raw.places || raw.pois || raw.locations || raw.sites || raw['dia_danh'] || raw['địa_danh']
      );
      const rawDishes = _toNameItems(
        raw.dishes || raw.foods || raw.specialties || raw.specialities || raw['mon_an'] || raw['món_ăn']
      );
      const rawTips = _asArray(raw.tips);

    // Dedupe mềm: giữ bản đầu tiên theo key đã chuẩn hoá
    let places = uniqBy(rawPlaces, x => x && x.name ? normKey(x.name) : null).filter(Boolean);
    let dishes = uniqBy(rawDishes, x => x && x.name ? normKey(x.name) : null).filter(Boolean);
    let tips   = uniqBy(rawTips, x => {
      if (typeof x === 'string') return normKey(x);
      if (x && x.name) return normKey(x.name);
      return x ? normKey(JSON.stringify(x)) : null;
    }).filter(Boolean);

    // Fallback: nếu lọc xong mà rỗng (do lỗi logic nào đó) -> trả về bản gốc
    if (places.length === 0 && rawPlaces.length) places = rawPlaces;
    if (dishes.length === 0 && rawDishes.length) dishes = rawDishes;

    return {
      name: raw.name || raw.title || raw.province || 'unknown',
      places,
      dishes,
      tips,
      aliases: raw.aliases || [],
      merged_from: raw.merged_from || raw.mergedFrom || []
    };
    } catch (err) {
      console.error('[extractProvinceDoc] Error:', err.message);
      return {
        name: raw?.name || 'unknown',
        places: [], dishes: [], tips: [], aliases: [], merged_from: []
      };
    }
  }
  global.extractProvinceDoc = extractProvinceDoc;
}

module.exports = {
  searchHotels,
  getHotelsByAnyAmenities,
  getHotelFull,
  getPromotionsValidToday,
  getPromotionsValidTodayByCity,
  getPromotionsByKeywordCityMonth,
  promoCheckApplicability,
  promoUsageStats,
  listHotelCities,
  suggest,
  suggestHybrid,
  getTopHotels,
  getHotelsByAmenities,
  getPromotionsInMonth,
  getPromotionsInMonthByCity,
  getPromotionsByCity,
};