'use strict';

const repo = require('../repositories/province.repo');

async function autocompleteHandler(req, res, next) {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q) return res.json([]);
    const list = await repo.autocomplete(req.app.locals.db, q, 8);
    res.json(list.map(x => x.name));
  } catch (e) {
    next(e);
  }
}

module.exports = { autocompleteHandler };
