const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/nofiticationForContract.controller');

// Thêm thông báo mới
router.post('/', notificationController.addNotification);

// Lấy danh sách thông báo theo receiverId
router.get('/receiver/:receiverId', notificationController.getNotificationsByReceiver);

// Cập nhật trạng thái đã đọc
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
