'use strict';

const { z } = require('zod');

const ItemSchema = z.object({
  name: z.string().min(1),
  hint: z.string().optional(),
  where: z.string().optional(),
  type: z.string().optional()
});

const ResponseSchema = z.object({
  province: z.string().min(1),
  places: z.array(ItemSchema).default([]),
  dishes: z.array(ItemSchema).default([]),
  tips: z.array(z.string()).default([]),
  source: z.enum(['nosql', 'nosql+llm', 'fallback']).default('nosql+llm')
});

function enforceWhitelist(resp, doc) {
  const allowedPlaces = new Set((doc.places || []).map(x => x.name));
  const allowedDishes = new Set((doc.dishes || []).map(x => x.name));
  resp.places = (resp.places || []).filter(x => allowedPlaces.has(x.name));
  resp.dishes = (resp.dishes || []).filter(x => allowedDishes.has(x.name));
  return resp;
}

function validateResponse(resp, doc) {
  const parsed = ResponseSchema.parse(resp);
  return enforceWhitelist(parsed, doc);
}

module.exports = { validateResponse };
