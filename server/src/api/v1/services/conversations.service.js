'use strict';

const { upsertDM, createGroup, getById, listByHotelAndUser } = require('../repositories/conversation.repo');
const { addMember, listMembers } = require('../repositories/participant.repo');

/**
 * Tạo/lay DM duy nhất giữa admin ↔ owner theo hotel,
 * đồng bộ participants (2 người).
 */
async function getOrCreateDM({ hotel_id, admin_id, owner_id, created_by }) {
  const conv = await upsertDM({ hotel_id, admin_id, owner_id, created_by });
  // đồng bộ 2 participants
  await Promise.all([
    addMember({ conversation_id: conv._id, user_id: admin_id, role: 'admin' }),
    addMember({ conversation_id: conv._id, user_id: owner_id, role: 'hotel_owner' }),
  ]);
  return conv;
}

/** Tạo Group A: owner + admin + staff (do owner thêm) */
async function createGroupA({ hotel_id, name, created_by, owner_id, admin_ids = [], staff_ids = [] }) {
  const conv = await createGroup({ hotel_id, name, created_by, subtype: 'admin_owner_staff' });
  // add owner + admins + staffs vào participants
  const tasks = [
    addMember({ conversation_id: conv._id, user_id: owner_id, role: 'hotel_owner' }),
    ...admin_ids.map(uid => addMember({ conversation_id: conv._id, user_id: uid, role: 'admin' })),
    ...staff_ids.map(uid => addMember({ conversation_id: conv._id, user_id: uid, role: 'hotel_staff' })),
  ];
  await Promise.all(tasks);
  return conv;
}

/** Tạo Group B: owner + toàn bộ staff của hotel (auto) */
async function createGroupB({ hotel_id, name = 'Owner & All Staff', created_by, owner_id, staff_ids = [] }) {
  const conv = await createGroup({ hotel_id, name, created_by, subtype: 'owner_all_staff' });
  const tasks = [
    addMember({ conversation_id: conv._id, user_id: owner_id, role: 'hotel_owner' }),
    ...staff_ids.map(uid => addMember({ conversation_id: conv._id, user_id: uid, role: 'hotel_staff' })),
  ];
  await Promise.all(tasks);
  return conv;
}

async function getConversation(conversation_id) {
  return getById(conversation_id);
}

async function getMembers(conversation_id) {
  return listMembers(conversation_id);
}

async function addMemberToConversation({ conversation_id, user_id, role }) {
  const { addMember } = require('../repositories/participant.repo');
  return addMember({ conversation_id, user_id, role });
}

module.exports = {
  getOrCreateDM,
  createGroupA,
  createGroupB,
  getConversation,
  getMembers,
  addMemberToConversation,
  listByHotelAndUser,
};
