'use strict';

const convSvc = require('../services/conversations.service');
const validator = require('../../../validators/conversations.validator');

exports.createDM = async (req, res, next) => {
  try {
    const { value, error } = validator.createDM.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const conv = await convSvc.getOrCreateDM({
      hotel_id: value.hotel_id,
      admin_id: value.admin_id,
      owner_id: value.owner_id,
      created_by: req.user.id
    });
    res.json(conv);
  } catch (e) { next(e); }
};

exports.createGroupA = async (req, res, next) => {
  try {
    const { value, error } = validator.createGroupA.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const conv = await convSvc.createGroupA({
      hotel_id: value.hotel_id,
      name: value.name,
      created_by: req.user.id,
      owner_id: value.owner_id,
      admin_ids: value.admin_ids || [],
      staff_ids: value.staff_ids || []
    });
    res.json(conv);
  } catch (e) { next(e); }
};

exports.createGroupB = async (req, res, next) => {
  try {
    const { value, error } = validator.createGroupB.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const conv = await convSvc.createGroupB({
      hotel_id: value.hotel_id,
      name: value.name,
      created_by: req.user.id,
      owner_id: value.owner_id,
      staff_ids: value.staff_ids || []
    });
    res.json(conv);
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const { value, error } = validator.list.validate(req.query);
    if (error) return res.status(400).json({ error: error.message });
    const convRepo = require('../repositories/conversation.repo');
    const rows = await convRepo.list({
      hotel_id: value.hotel_id,
      type: value.type,
      limit: value.limit,
      skip: value.skip
    });
    res.json(rows);
  } catch (e) { next(e); }
};

exports.addMember = async (req, res, next) => {
  try {
    const { conversation_id, user_id, role } = req.body;
    if (!conversation_id || !user_id || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const participantRepo = require('../repositories/participant.repo');
    await participantRepo.addMember({ conversation_id, user_id, role });
    res.json({ success: true });
  } catch (e) { next(e); }
};

/** Lấy các conversation theo hotel_id mà user là thành viên */
exports.listByHotelAndUser = async (req, res, next) => {
  try {
    const hotel_id = req.query.hotel_id;
    const type = req.query.type; // 'dm' hoặc 'group' (optional)
    const user_id = req.user.id; // tuỳ hệ thống
    if (!hotel_id || !user_id) return res.status(400).json({ error: 'Missing hotel_id or user_id' });
    const convs = await convSvc.listByHotelAndUser({ hotel_id, user_id, type });
    res.json(convs);
  } catch (e) { next(e); }
};

/** Tìm Group B theo hotel_id (không cần kiểm tra member) - dành cho staff tìm group để join */
exports.findGroupB = async (req, res, next) => {
  try {
    const hotel_id = req.query.hotel_id;
    if (!hotel_id) return res.status(400).json({ error: 'Missing hotel_id' });
    const conv = await convSvc.findGroupB(hotel_id);
    if (!conv) return res.status(404).json({ error: 'Group B not found' });
    res.json(conv);
  } catch (e) { next(e); }
};
