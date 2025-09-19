const notificationRepo = require('../repositories/nofiticationForContract.repository');

async function addNotification(data) {
  return await notificationRepo.addNotification(data);
}

async function getNotificationsByReceiver(receiverId, options) {
  return await notificationRepo.getNotificationsByReceiver(receiverId, options);
}

async function markAsRead(notificationId, receiverId) {
  return await notificationRepo.markAsRead(notificationId, receiverId);
}

module.exports = {
  addNotification,
  getNotificationsByReceiver,
  markAsRead
};
