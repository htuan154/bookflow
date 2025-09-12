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
      created_by: req.user.user_id
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
      created_by: req.user.user_id,
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
      created_by: req.user.user_id,
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
