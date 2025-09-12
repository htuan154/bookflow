'use strict';

const express = require('express');
const router = express.Router();
const ctl = require('../controllers/messages.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/messages', ctl.history);
router.post('/messages/text', ctl.sendText);
router.post('/messages/file', ctl.sendFile);
router.post('/messages/read', ctl.markRead);

module.exports = router;
