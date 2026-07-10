const service = require('./service');
const { ok, created } = require('../../utils/response');
const { ROLES } = require('../../config/roles');

async function generateShop(req, res) {
  return created(res, await service.generateForShop(req.body.shopId, req.body.cycleLabel));
}

async function generateDelivery(req, res) {
  return created(
    res,
    await service.generateForDeliveryPartner(req.body.deliveryPartnerId, req.body.cycleLabel)
  );
}

async function markPaid(req, res) {
  return ok(res, await service.markPaid(req.params.settlementId));
}

async function list(req, res) {
  const isPrivileged =
    req.user.roles.includes(ROLES.FINANCE_EXECUTIVE) || req.user.roles.includes(ROLES.SUPER_ADMIN);
  if (isPrivileged) return ok(res, await service.listAll());

  const { beneficiaryId } = req.query;
  return ok(res, await service.listForBeneficiary(beneficiaryId || req.user.id));
}

module.exports = { generateShop, generateDelivery, markPaid, list };
