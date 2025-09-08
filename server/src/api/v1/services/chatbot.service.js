'use strict';

const { analyze } = require('./nlu.service');
const repo = require('../repositories/province.repo');
const { compose } = require('./composer.service');

const USE_LLM = String(process.env.USE_LLM || 'false').toLowerCase() === 'true';
const pickTop = (arr, n = 7) => (Array.isArray(arr) ? arr.slice(0, n) : []);

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

module.exports = { suggest };
