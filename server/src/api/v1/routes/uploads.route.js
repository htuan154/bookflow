'use strict';

const express = require('express');
const router = express.Router();
const ctl = require('../controllers/uploads.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Nếu bạn dùng multer cho multipart, uncomment 2 dòng sau:
// const multer = require('multer');
// const upload = multer();

router.use(authenticate);

// multipart: router.post('/uploads', upload.single('file'), ctl.upload);
router.post('/uploads', ctl.upload); // JSON base64 mặc định

module.exports = router;
