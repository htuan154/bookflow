'use strict';

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../im/bootstrap');
const NotificationForContract = require('../../../models/notificationForContract.model');

/** Helper: chuyển string -> ObjectId an toàn */
function oid(id) { return (id instanceof ObjectId) ? id : new ObjectId(String(id)); }

/** Thêm thông báo mới */
async function addNotification(data) {
  const db = getDb();
  const now = new Date();
  const doc = {
    contract_id: data.contract_id,
    hotel_id: data.hotel_id,
    sender_id: data.sender_id,
    receiver_id: data.receiver_id,
    title: data.title,
    message: data.message,
    notification_type: data.notification_type,
    is_read: false,
    created_at: now
  };
  const r = await db.collection('notificationForContract').insertOne(doc);
  return { notification_id: r.insertedId, ...doc };
}

/** Lấy danh sách thông báo theo receiver_id (có phân trang) */
async function getNotificationsByReceiver(receiver_id, { limit = 20, skip = 0 } = {}) {
  const db = getDb();
  const q = { receiver_id };
  const notifications = await db.collection('notificationForContract')
    .find(q)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return notifications.map(n => new NotificationForContract(n));
}

/** Cập nhật trạng thái đã đọc của thông báo */
async function markAsRead(notification_id, receiver_id) {
  const db = getDb();
  const filter = { _id: oid(notification_id), receiver_id };
  const update = { $set: { is_read: true } };
  const opt = { returnDocument: 'after' };
  const r = await db.collection('notificationForContract').findOneAndUpdate(filter, update, opt);
  return r.value ? new NotificationForContract(r.value) : null;
}

module.exports = {
  addNotification,
  getNotificationsByReceiver,
  markAsRead,
};