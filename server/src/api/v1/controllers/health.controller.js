'use strict';

const repo = require('../repositories/province.repo');

/**
 * GET /ai/health
 * Trả tình trạng kết nối Mongo + số document trong collection.
 */
async function healthHandler(req, res, next) {
  try {
    const db = req.app.locals.db;
    const total = await repo.countAll(db);
    return res.json({ mongo: 'ok', provinces: total, collection: repo.__COLLECTION__ });
  } catch (err) {
    return res.status(500).json({ mongo: 'fail', error: err.message });
  }
}

module.exports = { healthHandler };
