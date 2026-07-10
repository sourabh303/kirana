const service = require('./service');
const { ok, created } = require('../../utils/response');

async function list(req, res) {
  return ok(res, await service.search(req.query));
}

async function get(req, res) {
  return ok(res, await service.getById(req.params.productId));
}

async function create(req, res) {
  return created(res, await service.create(req.body));
}

async function update(req, res) {
  return ok(res, await service.update(req.params.productId, req.body));
}

async function remove(req, res) {
  await service.remove(req.params.productId);
  return ok(res, { removed: true });
}

module.exports = { list, get, create, update, remove };
