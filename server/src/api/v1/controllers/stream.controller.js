'use strict';

const { subscribeConversation } = require('../services/stream.service');
const partRepo = require('../repositories/participant.repo');

exports.open = async (req, res, next) => {
  try {
    const conversation_id = String(req.query.conversation_id || '');
    if (!conversation_id) return res.status(400).send('conversation_id required');

    // ACL: phải là participant (try both user_id and id)
    const userId = req.user.user_id || req.user.id;
    console.log('[SSE Stream] Checking access:', { conversation_id, userId, user: req.user });
    const ok = await partRepo.isMember({ conversation_id, user_id: userId });
    if (!ok) {
      console.warn('[SSE Stream] Access denied:', { conversation_id, userId });
      return res.status(403).send('forbidden');
    }

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    // Heartbeat
    const hbMs = Number(process.env.SSE_HEARTBEAT_MS || 20000);
    const hb = setInterval(() => res.write(`event: ping\ndata: {}\n\n`), hbMs);

    // Subscribe change stream
    const sub = await subscribeConversation(conversation_id, (evt) => {
      res.write(`event: ${evt.type}\n`);
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    });

    req.on('close', () => { clearInterval(hb); sub.close(); });
  } catch (e) { next(e); }
};
