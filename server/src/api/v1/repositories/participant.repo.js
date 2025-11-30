'use strict';

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../im/bootstrap');
function oid(id) { return (id instanceof ObjectId) ? id : new ObjectId(String(id)); }

/** Thêm thành viên (unique: conversation_id + user_id) */
async function addMember({ conversation_id, user_id, role }) {
  const db = getDb();
  const now = new Date();
  await db.collection('participants').updateOne(
    { conversation_id: oid(conversation_id), user_id },
    {
      $setOnInsert: { conversation_id: oid(conversation_id), user_id, joined_at: now },
      $set: { role } // Always update role even if participant exists
    },
    { upsert: true }
  );
  return true;
}

async function removeMember({ conversation_id, user_id }) {
  const db = getDb();
  await db.collection('participants').deleteOne({ conversation_id: oid(conversation_id), user_id });
  return true;
}

async function isMember({ conversation_id, user_id }) {
  const db = getDb();
  console.log('[isMember] Checking:', { conversation_id, user_id });
  const doc = await db.collection('participants').findOne({ conversation_id: oid(conversation_id), user_id });
  console.log('[isMember] Found:', !!doc);
  return !!doc;
}

async function listMembers(conversation_id) {
  const db = getDb();
  return db.collection('participants').find({ conversation_id: oid(conversation_id) }).toArray();
}

async function setLastRead({ conversation_id, user_id, last_read_message_id }) {
  const db = getDb();
  await db.collection('participants').updateOne(
    { conversation_id: oid(conversation_id), user_id },
    { $set: { last_read_message_id } }
  );
}

module.exports = {
  addMember,
  removeMember,
  isMember,
  listMembers,
  setLastRead,
};
