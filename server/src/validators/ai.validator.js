'use strict';

const { z } = require('zod');

/**
 * Body cho POST /ai/suggest
 * - message: bắt buộc (string)
 * - context: tuỳ chọn (object)
 */
const AiSuggestSchema = z.object({
  message: z.string().min(1, 'message is required'),
  context: z.record(z.any()).optional(),
});

module.exports = { AiSuggestSchema };
