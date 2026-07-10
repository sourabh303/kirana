const service = require('./service');
const { ok } = require('../../utils/response');

async function shopkeeper(req, res) {
  return ok(res, await service.shopkeeperReport(req.query.shopId));
}

async function deliveryPartner(req, res) {
  return ok(res, await service.deliveryPartnerReport(req.user.id));
}

async function admin(req, res) {
  return ok(res, await service.adminReport());
}

module.exports = { shopkeeper, deliveryPartner, admin };
