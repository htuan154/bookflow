
const notificationRepo = require('../repositories/nofiticationForContract.repository');
const { createNotification } = require('../../../validators/nofiticationForContract.validator');


// Thêm thông báo mới
async function addNotification(req, res, next) {
  try {
    const { error } = createNotification.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const data = req.body;
    const result = await notificationRepo.addNotification(data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// Lấy danh sách thông báo theo receiverId
async function getNotificationsByReceiver(req, res, next) {
  try {
    const receiverId = req.params.receiverId;
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const result = await notificationRepo.getNotificationsByReceiver(receiverId, { limit, skip });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// Cập nhật trạng thái đã đọc
async function markAsRead(req, res, next) {
  try {
    const notificationId = req.params.id;
    const receiverId = req.body.receiver_id;
    const result = await notificationRepo.markAsRead(notificationId, receiverId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addNotification,
  getNotificationsByReceiver,
  markAsRead
};
