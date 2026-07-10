const service = require('./service');
const { ok } = require('../../utils/response');

async function list(req, res) {
  const unreadOnly = req.query.unreadOnly === 'true';
  return ok(res, await service.listForUser(req.user.id, { unreadOnly }));
}

async function markRead(req, res) {
  return ok(res, await service.markRead(req.user.id, req.params.notificationId));
}

module.exports = { list, markRead };
