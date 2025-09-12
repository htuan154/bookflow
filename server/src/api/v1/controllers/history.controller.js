'use strict';
const { listSessions, listMessages } = require('../services/chatHistory.service');

exports.listSessionsHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const limit = Number(req.query.limit || 20);
    const data = await listSessions(userId, limit);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

exports.listMessagesHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const sessionId = String(req.query.session_id || '');
    if (!sessionId) return res.status(400).json({ error: 'session_id is required' });
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.page_size || 20);
    const data = await listMessages({ userId, sessionId, page, pageSize });
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
};
