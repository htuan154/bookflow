'use strict';

const { analyze } = require('./nlu.service');
const repo = require('../repositories/province.repo');
const { compose } = require('./composer.service');
const { supabase } = require('../../../config/supabase');
const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';
const pickTop = (arr, n = 7) => (Array.isArray(arr) ? arr.slice(0, n) : []);
// Top khách sạn nổi bật
async function getTopHotels(city, limit = 10) {
  const { data, error } = await supabase.rpc('top_hotels_by_city', {
    p_city: city,
    p_limit: limit
  });
  if (error) throw error;
  return data;
}

// Khách sạn theo tiện nghi
async function getHotelsByAmenities(city, amenities = [], limit = 10) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_amenities', {
    p_city: city,
    p_amenities: amenities,
    p_limit: limit
  });
  if (error) throw error;
  return data;
}

// Khuyến mãi trong tháng
async function getPromotionsInMonth(year, month, limit = 20) {
  const { data, error } = await supabase.rpc('promotions_in_month', {
    p_year: year,
    p_month: month,
    p_limit: limit
  });
  if (error) throw error;
  return data;
}

// Khuyến mãi trong tháng theo tỉnh
async function getPromotionsInMonthByCity(city, year, month, limit = 20) {
  const { data, error } = await supabase.rpc('promotions_in_month_by_city', {
    p_city: city,
    p_year: year,
    p_month: month,
    p_limit: limit
  });
  if (error) throw error;
  return data;
}

// Khuyến mãi của tỉnh
async function getPromotionsByCity(city) {
  const { data, error } = await supabase.rpc('promotions_by_city', { p_city: city });
  if (error) throw error;
  return data;
}
/** Clarify: nếu có region -> gợi ý các tỉnh trong vùng; nếu không -> autocomplete */
async function buildClarify(db, nlu) {
  const { normalized, region, top_n } = nlu;

  // Ưu tiên gợi ý theo "miền/vùng"
  if (region) {
    // repo helper mới: tìm doc region theo norm/alias key và lấy danh sách members
    const r = await repo.findRegionByKey(db, region.key); 
    if (r?.members?.length) {
      return {
        clarify_required: true,
        hint: region.name,
        suggestions: r.members.slice(0, top_n),
        source: 'nosql',
      };
    }
  }

  // Fallback: autocomplete theo prefix 1–2 từ đầu
  const prefix = normalized.split(' ').slice(0, 2).join(' ').trim();
  const candidates = await repo.autocomplete(db, prefix || normalized, 5);
  return {
    clarify_required: true,
    suggestions: candidates.map(c => c.name),
    source: 'nosql',
  };
}

/** suggest: nhận message -> NLU -> tìm tỉnh (n-gram) -> (tuỳ) LLM -> trả JSON */
async function suggest(db, { message = '', context = {} } = {}) {
  const nlu = analyze(message); // { normalized, intent, region, top_n, filters, ngrams }
  const { normalized, intent, top_n, filters } = nlu;

  // 🔎 Tìm tỉnh theo n-gram (norm/aliases)
  // (repo.findInText nên nhận ngrams hoặc tự tạo từ normalized)
  const doc = await repo.findInText(db, nlu);
  if (!doc) return buildClarify(db, nlu);

  // 🧠 Dùng LLM khi bật USE_LLM
  if (USE_LLM) {
    const composed = await compose({
      doc,
      intent,
      top_n,
      // hợp nhất filter từ NLU và context (nếu FE gửi thêm)
      filters: { ...(filters || {}), ...(context?.filters || {}) },
    });
    return composed; // compose() đã có guardrails + cache + fallback
  }

  // 🚀 Không dùng LLM → trả thẳng từ Mongo theo top_n
  const places = intent === 'ask_dishes' ? [] : pickTop(doc.places, top_n);
  const dishes = intent === 'ask_places' ? [] : pickTop(doc.dishes, top_n);
  const tips   = Array.isArray(doc.tips) ? doc.tips : [];

  return {
    province: doc.name,
    places,
    dishes,
    tips,
    source: 'nosql',
  };
}
// ==== Hotels – search / any-amenities / full detail ====

async function searchHotels(city, q = null, limit = 20) {
  const { data, error } = await supabase.rpc('search_hotels', {
    p_city: city,
    p_q: q,
    p_limit: limit
  });
  if (error) throw error;
  return data;
}

async function getHotelsByAnyAmenities(city, amenities = [], limit = 10) {
  const { data, error } = await supabase.rpc('hotels_by_city_with_any_amenities', {
    p_city: city,
    p_amenities: amenities,
    p_limit: limit
  });
  if (error) throw error;
  return data;
}

async function getHotelFull(hotelId) {
  const { data, error } = await supabase.rpc('hotel_full', { p_hotel_id: hotelId });
  if (error) throw error;
  // hotel_full trả 0 hoặc 1 dòng (table-returning)
  return Array.isArray(data) ? data[0] || null : data;
}

// ==== Promotions – today / today by city / keyword+city+month ====

async function getPromotionsValidToday(limit = 50) {
  const { data, error } = await supabase.rpc('promotions_valid_today', { p_limit: limit });
  if (error) throw error;
  return data;
}

async function getPromotionsValidTodayByCity(city, limit = 50) {
  const { data, error } = await supabase.rpc('promotions_valid_today_by_city', {
    p_city: city,
    p_limit: limit
  });
  if (error) throw error;
  return data;
}

async function getPromotionsByKeywordCityMonth(city, keyword = null, year, month, limit = 50) {
  const { data, error } = await supabase.rpc('promotions_by_keyword_city_month', {
    p_city: city,
    p_kw: keyword,
    p_year: year,
    p_month: month,
    p_limit: limit
  });
  if (error) throw error;
  return data;
}

// ==== Promotions – check & stats ====

async function promoCheckApplicability(code, userId, bookingAmount, whenTs = null) {
  const args = {
    p_code: code,
    p_user: userId,
    p_booking_amount: bookingAmount,
  };
  if (whenTs) args.p_when = whenTs; // ISO string hoặc timestamptz
  const { data, error } = await supabase.rpc('promo_check_applicability', args);
  if (error) throw error;
  // hàm trả table 1 dòng (ok/false + lý do + số tiền giảm)
  return Array.isArray(data) ? data[0] || null : data;
}

async function promoUsageStats(promotionId) {
  const { data, error } = await supabase.rpc('promo_usage_stats', { p_promotion_id: promotionId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] || null : data;
}

// ==== Cities – for autocomplete/filter UI ====

async function listHotelCities() {
  const { data, error } = await supabase.rpc('hotel_cities');
  if (error) throw error;
  return data; // [{city, hotels}]
}

module.exports = { 
  getTopHotels,
  getHotelsByAmenities,
  getPromotionsInMonth,
  getPromotionsInMonthByCity,
  getPromotionsByCity,
  suggest,
  searchHotels,
  getHotelsByAnyAmenities,
  getHotelFull,
  getPromotionsValidToday,
  getPromotionsValidTodayByCity,
  getPromotionsByKeywordCityMonth,
  promoCheckApplicability,
  promoUsageStats,
  listHotelCities,
};
