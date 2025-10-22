'use strict';

const msgSvc = require('../services/messages.service');
const validator = require('../../../validators/messages.validator');

exports.sendText = async (req, res, next) => {
  try {
    const { value, error } = validator.sendText.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    
    console.log('[sendText] Request:', {
      conversation_id: value.conversation_id,
      user_id: req.user.id,
      text_preview: value.text?.slice(0, 50),
      timestamp: new Date().toISOString()
    });
    
    const msg = await msgSvc.sendText({
      conversation_id: value.conversation_id,
      user: req.user.id,
      text: value.text,
      links: value.links || []
    });
    
    console.log('[sendText] Success:', {
      message_id: msg._id,
      timestamp: new Date().toISOString()
    });
    
    res.json(msg);
  } catch (e) {
    if (e.message === 'DUPLICATE_MESSAGE: Message sent too quickly') {
      console.warn('[sendText] Duplicate detected, returning 409');
      return res.status(409).json({ error: 'Duplicate message', code: 'DUPLICATE_MESSAGE' });
    }
    next(e);
  }
};

exports.sendFile = async (req, res, next) => {
  try {
    const { value, error } = validator.sendFile.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const msg = await msgSvc.sendFile({
      conversation_id: value.conversation_id,
      user: req.user.id,
      text: value.text || '',
      attachments: value.attachments || []
    });
    res.json(msg);
  } catch (e) { next(e); }
};

exports.history = async (req, res, next) => {
  try {
    const { value, error } = validator.history.validate(req.query);
    if (error) return res.status(400).json({ error: error.message });
    const data = await msgSvc.history({
      conversation_id: value.conversation_id,
      limit: value.limit,
      cursor: value.cursor
    });
    res.json(data);
  } catch (e) { next(e); }
};

exports.markRead = async (req, res, next) => {
  try {
    const { value, error } = validator.markRead.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const ok = await msgSvc.markRead({
      conversation_id: value.conversation_id,
      user_id: req.user.user_id,
      last_read_message_id: value.last_read_message_id
    });
    res.json(ok);
  } catch (e) { next(e); }
};
