'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Giới hạn tần suất cho /ai/*
 * Mặc định: 60 req / 60s — có thể đổi qua ENV.
 */
const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATELIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATELIMIT_MAX || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 429, error: 'Too many requests' },
});

module.exports = { aiLimiter };
