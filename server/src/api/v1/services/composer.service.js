'use strict';

const { generateJSON } = require('../../../config/ollama');
const { validateResponse } = require('./guardrails.service');
const { cache, makeKey } = require('../../../config/cache');
const { normalize } = require('./nlu.service'); // ADDED for dedupe keys

/* ========== NoSQL (địa danh/món ăn) – logic cũ, giữ nguyên ========== */

function factsToPrompt({ doc, intent }) {
  const places = (doc.places || []).map(p => `- ${p.name}`).join('\n') || '-';
  const dishes = (doc.dishes || []).map(d => `- ${d.name}`).join('\n') || '-';

  return `
Bạn là trợ lý du lịch tiếng Việt. CHỈ dùng dữ kiện có sẵn, KHÔNG bịa tên mới.
Trả về duy nhất một JSON theo schema:
{
  "province": string,
  "places": [{ "name": string, "hint"?: string }],
  "dishes": [{ "name": string, "where"?: string }],
  "tips": string[],
  "source": "nosql+llm"
}

Tỉnh: ${doc.name}
Địa danh:
${places}
Món ăn:
${dishes}

Yêu cầu:
- Luôn trả cả hai danh sách "places" và "dishes" (tối đa 5–7 mỗi loại) dù người dùng chỉ hỏi món ăn hay địa danh.
- "hint"/"where" ngắn gọn (<= 16 từ).
- Không thêm tên mới ngoài danh sách.
- Nếu một danh sách không có dữ liệu thì trả mảng rỗng [].
(intent gốc: ${intent})
`;
}

function fallbackFromDoc(doc, intent) {
  const pick = (arr) => Array.isArray(arr) ? arr.slice(0, 7) : [];
  return {
    province: doc.name,
    // Luôn trả cả hai thay vì lọc theo intent
    places: pick(doc.places).map(x => ({ name: x.name })),
    dishes: pick(doc.dishes).map(x => ({ name: x.name })),
    tips: doc.tips || [],
    source: 'fallback',
  };
}

/* ========== Helpers cho SQL ========== */

function normRow(x, tag = '') {
  if (!x || typeof x !== 'object') return null;

  const name =
    x.name || x.title || x.promotion_name || x.hotel_name ||
    x.code || x.place || x.dish || x.city || x.id || null;
  if (!name) return null;

  // Chuẩn hoá các field FE đang render
  const discount_value =
    x.discount_value ?? x.discount_percent ?? x.discount ?? x.percent ?? x.amount_off ?? x.value ?? null;

  // FE dùng "valid_from" & "valid_until"
  const valid_from = x.valid_from ?? x.start_date ?? x.from ?? x.begin_at ?? null;
  const valid_until = x.valid_until ?? x.valid_to ?? x.end_date ?? x.to ?? x.expire_at ?? null;

  const city = x.city ?? x.province ?? x.location ?? null;

  return {
    ...x,
    name,
    discount_value,
    valid_from,
    valid_until,
    city,
    _tag: tag
  };
}

function normRows(rows, tag = '') {
  if (!Array.isArray(rows)) return [];
  return rows.map(r => normRow(r, tag)).filter(Boolean);
}

function detectSqlMode(sql = []) {
  const anyPromo = sql.some(ds =>
    /promo|promotion/i.test(ds?.tag || ds?.name || '') ||
    (ds?.rows || []).some(r => 'code' in r || 'promotion_name' in r || 'discount_value' in r)
  );
  if (anyPromo) return 'promotions';

  const anyHotel = sql.some(ds =>
    /hotel/i.test(ds?.tag || ds?.name || '') ||
    (ds?.rows || []).some(r => 'hotel_name' in r || 'star_rating' in r)
  );
  if (anyHotel) return 'hotels';

  return 'generic';
}

// ==== DEDUPE HELPERS (ADDED) ====
const uniqBy = (arr, keyFn) => {
  const seen = new Set();
  return (arr || []).filter(x => {
    try {
      const k = keyFn(x);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    } catch {
      return false;
    }
  });
};
const normKey = v => normalize(String(v || ''));

/* ========== COMPOSE (hợp nhất NoSQL + SQL) ========== */

async function compose({ doc, sql = [], nlu = {}, filters = {}, user_ctx = {}, intent }) {
  const key = makeKey({
    doc_key: doc?.name || doc?.province || 'no-doc',
    sql_tags: (sql || []).map(ds => ds?.tag || ds?.name).join('|') || 'no-sql',
    intent: intent || nlu?.intent || 'generic',
    city: nlu?.city || user_ctx?.city || '',
    filters, user_ctx
  });
  const cached = cache.get(key);
  if (cached) return cached;

  // 1) SQL datasets
  if (Array.isArray(sql) && sql.length > 0) {
    const mode = detectSqlMode(sql);
    const topN = Number.isFinite(user_ctx?.top_n) ? user_ctx.top_n : 10;

    // Gộp + chuẩn hoá
    let items = [];
    for (const ds of sql) {
      const tag = ds?.name || ds?.tag || 'dataset';
      const rows = normRows(ds?.rows || [], tag);
      items.push(...rows);
    }

    // Dedupe theo mode
    if (mode === 'promotions') {
      items = uniqBy(items, r => r.code ? normKey(r.code) : `${normKey(r.name)}|${normKey(r.city)}`);
    } else if (mode === 'hotels') {
      items = uniqBy(items, r => r.hotel_id ? normKey(r.hotel_id) : normKey(r.name));
    } else {
      items = uniqBy(items, r => normKey(r.name));
    }

    const pick = items.slice(0, topN);

    let out;
    if (mode === 'promotions') {
      const promos = pick.map(p => ({
        promotion_id: p.promotion_id ?? p.id,
        name: p.name,
        code: p.code ?? null,
        discount_value: p.discount_value ?? null,
        valid_from: p.valid_from ?? null,
        valid_until: p.valid_until ?? null,
        city: p.city ?? null,
        description: p.description ?? p.note ?? null,
        _tag: p._tag
      }));
      out = {
        summary: `Tìm thấy ${items.length} khuyến mãi, hiển thị ${promos.length} ưu đãi tiêu biểu.`,
        promotions: promos,
        hotels: [],
        places: [],
        dishes: [],
        tips: [],
        source: 'sql+nosql+llm'
      };
    } else if (mode === 'hotels') {
      const hotels = pick.map(h => ({
        hotel_id: h.hotel_id ?? h.id,
        name: h.name,
        address: h.address ?? null,
        star_rating: h.star_rating ?? h.stars ?? null,
        average_rating: h.average_rating ?? null,
        amenities: h.amenities ?? null,
        phone_number: h.phone_number ?? null,
        _tag: h._tag
      }));
      out = {
        summary: `Gợi ý ${hotels.length} khách sạn.`,
        hotels,
        promotions: [],
        places: [],
        dishes: [],
        tips: [],
        source: 'sql+nosql+llm'
      };
    } else {
      out = {
        summary: `Tìm thấy ${pick.length} kết quả.`,
        data: { items: pick },
        promotions: [],
        hotels: [],
        places: [],
        dishes: [],
        tips: [],
        source: 'sql+nosql+llm'
      };
    }

    cache.set(key, out);
    return out;
  }

  // 2) NoSQL
  if (!doc || !doc.name) {
    const fb = { summary: 'Chưa đủ dữ kiện để trả lời.', sections: [], promotions: [], hotels: [], places: [], dishes: [], tips: [], source: 'nosql+llm' };
    cache.set(key, fb);
    return fb;
  }

  try {
    const prompt = factsToPrompt({ doc, intent: intent || nlu?.intent || 'generic' });
    const raw = await generateJSON({ prompt, temperature: 0.2 });
    const safe = validateResponse(raw, doc);

    const pickSlice = (arr, n = 7) => (Array.isArray(arr) ? arr.slice(0, n) : []);
    let places = (safe.places && safe.places.length)
      ? safe.places
      : pickSlice(doc.places || [], 7).map(x => ({ name: x.name }));
    let dishes = (safe.dishes && safe.dishes.length)
      ? safe.dishes
      : pickSlice(doc.dishes || [], 7).map(x => ({ name: x.name }));
    let tips = (safe.tips && safe.tips.length) ? safe.tips : (doc.tips || []);

    // Dedupe NoSQL
    places = uniqBy(places, x => normKey(x.name));
    dishes = uniqBy(dishes, x => normKey(x.name));
    tips = uniqBy(tips, x => (typeof x === 'string' ? normKey(x) : normKey(x.name || x.hint || JSON.stringify(x))));

    const emptyBoth = places.length === 0 && dishes.length === 0;

    const out = emptyBoth
      ? {
          summary: `Chưa có dữ liệu địa danh/món ăn cho “${doc.name}”.`,
          promotions: [], hotels: [], places: [], dishes: [], tips,
          source: 'nosql+llm'
        }
      : {
          promotions: [], hotels: [], places, dishes, tips,
          source: 'nosql+llm'
        };

    cache.set(key, out);
    return out;
  } catch {
    const fb0 = fallbackFromDoc(doc, intent || nlu?.intent || 'generic');
    const places = uniqBy(fb0.places, x => normKey(x.name));
    const dishes = uniqBy(fb0.dishes, x => normKey(x.name));
    const tips = uniqBy(fb0.tips, x => (typeof x === 'string' ? normKey(x) : normKey(x.name || JSON.stringify(x))));
    const out = { promotions: [], hotels: [], places, dishes, tips, source: 'nosql+llm' };
    cache.set(key, out);
    return out;
  }
}

module.exports = { compose, fallbackFromDoc };
