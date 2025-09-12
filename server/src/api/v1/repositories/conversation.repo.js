'use strict';

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../im/bootstrap');

/** helper: chuyển string -> ObjectId an toàn */
function oid(id) { return (id instanceof ObjectId) ? id : new ObjectId(String(id)); }

/** Tạo (hoặc lấy) DM duy nhất giữa admin ↔ owner theo hotel */
async function upsertDM({ hotel_id, admin_id, owner_id, created_by }) {
  const db = getDb();
  const now = new Date();
  const filter = { type: 'dm', hotel_id, admin_id, owner_id };
  const update = {
    $setOnInsert: {
      type: 'dm',
      subtype: 'admin_owner_dm',
      hotel_id,
      admin_id,
      owner_id,
      created_by,
      created_at: now
    }
  };
  const opt = { upsert: true, returnDocument: 'after' };
  const r = await db.collection('conversations').findOneAndUpdate(filter, update, opt);
  return r.value;
}

/** Tạo group (Group A / Group B) */
async function createGroup({ hotel_id, name, created_by, subtype = 'admin_owner_staff' }) {
  const db = getDb();
  const doc = {
    type: 'group',
    subtype,
    hotel_id,
    name,
    created_by,
    created_at: new Date()
  };
  const r = await db.collection('conversations').insertOne(doc);
  return { _id: r.insertedId, ...doc };
}

async function getById(conversation_id) {
  const db = getDb();
  return db.collection('conversations').findOne({ _id: oid(conversation_id) });
}

async function updateLastMessage(conversation_id, last) {
  const db = getDb();
  await db.collection('conversations').updateOne(
    { _id: oid(conversation_id) },
    { $set: { last_message: last } }
  );
}

/** Liệt kê phòng theo hotel/type (tuỳ chọn) */
async function list({ hotel_id, type, limit = 50, skip = 0 }) {
  const db = getDb();
  const q = {};
  if (hotel_id) q.hotel_id = hotel_id;
  if (type) q.type = type;
  return db.collection('conversations')
    .find(q).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
}

module.exports = {
  upsertDM,
  createGroup,
  getById,
  updateLastMessage,
  list,
};
