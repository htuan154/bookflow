'use strict';

const express = require('express');
const router = express.Router();

const { healthHandler } = require('../controllers/health.controller');

// GET /ai/health
router.get('/health', healthHandler);

module.exports = router;
