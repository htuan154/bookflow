'use strict';

const express = require('express');
const router = express.Router();
const { autocompleteHandler } = require('../controllers/provinces.controller');

// GET /provinces/autocomplete?q=da nang
router.get('/autocomplete', autocompleteHandler);

module.exports = router;
