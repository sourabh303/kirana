const service = require('./service');
const { ok } = require('../../utils/response');

async function view(req, res) {
  return ok(res, await service.summarize(req.user.id));
}

async function addItem(req, res) {
  await service.addItem(req.user.id, req.body);
  return ok(res, await service.summarize(req.user.id));
}

async function updateItem(req, res) {
  await service.updateItem(req.user.id, req.params.shopProductId, Number(req.body.quantity));
  return ok(res, await service.summarize(req.user.id));
}

async function clear(req, res) {
  await service.clear(req.user.id);
  return ok(res, await service.summarize(req.user.id));
}

module.exports = { view, addItem, updateItem, clear };
