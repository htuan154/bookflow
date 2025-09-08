'use strict';

const { suggest } = require('../services/chatbot.service');

async function suggestHandler(req, res, next) {
  try {
    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ error: 'DB_NOT_READY' });

    const {
      message = '',
      filters = {},
      top_n,            // số lượng muốn lấy (1..20) – optional
      use_llm           // true/false – optional, cho phép override USE_LLM
    } = req.body || {};

    const msg = String(message).trim();
    if (!msg) return res.status(400).json({ error: 'message is required (string)' });

    // chuẩn hoá context
    const ctx = { filters: typeof filters === 'object' ? filters : {} };
    if (Number.isFinite(top_n) && top_n > 0 && top_n <= 20) ctx.top_n = top_n;
    if (typeof use_llm === 'boolean') ctx.use_llm = use_llm;

    const t0 = process.hrtime.bigint();
    const data = await suggest(db, { message: msg, context: ctx });
    const t1 = process.hrtime.bigint();

    res.set('X-Latency-ms', (Number(t1 - t0) / 1e6).toFixed(1));
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

module.exports = { suggestHandler };
