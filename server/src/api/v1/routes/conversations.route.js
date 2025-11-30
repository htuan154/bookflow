'use strict';

const express = require('express');
const router = express.Router();
const ctl = require('../controllers/conversations.controller');
const { authenticate } = require('../middlewares/auth.middleware'); // đã có sẵn của bạn

router.use(authenticate);

router.post('/conversations/dm', ctl.createDM);
router.post('/conversations/group-a', ctl.createGroupA);
router.post('/conversations/group-b', ctl.createGroupB);
router.post('/conversations/add-member', ctl.addMember);
router.get('/conversations', ctl.list);
router.get('/conversations/my', ctl.listByHotelAndUser);
router.get('/conversations/find-group-b', ctl.findGroupB);

module.exports = router;
