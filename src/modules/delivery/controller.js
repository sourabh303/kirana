const service = require('./service');
const { ok } = require('../../utils/response');

async function dashboard(req, res) {
  return ok(res, await service.dashboard(req.user.id));
}

async function list(req, res) {
  return ok(res, await service.listForPartner(req.user.id));
}

async function accept(req, res) {
  return ok(res, await service.accept(req.params.deliveryId, req.user.id));
}

async function verifyPickup(req, res) {
  return ok(res, await service.verifyPickup(req.params.deliveryId, req.user.id));
}

async function complete(req, res) {
  return ok(res, await service.completeDelivery(req.params.deliveryId, req.user.id, req.body.earnings));
}

module.exports = { dashboard, list, accept, verifyPickup, complete };
