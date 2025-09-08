'use strict';

const { generateJSON } = require('../../../config/ollama');
const { validateResponse } = require('./guardrails.service');
const { cache, makeKey } = require('../../../config/cache');

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
- Chọn 5–7 mục phù hợp intent="${intent}" (ask_places chỉ places, ask_dishes chỉ dishes).
- "hint/where" ngắn gọn (<= 16 từ).
- Không thêm tên mới ngoài danh sách.
`;
}

function fallbackFromDoc(doc, intent) {
  const pick = (arr) => Array.isArray(arr) ? arr.slice(0, 7) : [];
  return {
    province: doc.name,
    places: intent === 'ask_dishes' ? [] : pick(doc.places).map(x => ({ name: x.name })),
    dishes: intent === 'ask_places' ? [] : pick(doc.dishes).map(x => ({ name: x.name })),
    tips: doc.tips || [],
    source: 'fallback',
  };
}

async function compose({ doc, intent, filters }) {
  const key = makeKey({ province: doc.name, intent, filters });
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const prompt = factsToPrompt({ doc, intent });
    const raw = await generateJSON({ prompt, temperature: 0.2 });
    const safe = validateResponse(raw, doc);   // zod + whitelist tên
    cache.set(key, safe);
    return safe;
  } catch (err) {
    const fb = fallbackFromDoc(doc, intent);
    cache.set(key, fb);
    return fb;
  }
}

module.exports = { compose, fallbackFromDoc };
