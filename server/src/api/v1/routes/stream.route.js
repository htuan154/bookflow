'use strict';

const express = require('express');
const router = express.Router();
const ctl = require('../controllers/stream.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/stream', ctl.open);

module.exports = router;
