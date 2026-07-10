const service = require('./service');
const { ok, created } = require('../../utils/response');
const { ROLES } = require('../../config/roles');

async function initiate(req, res) {
  return created(res, await service.initiatePayment(req.user.id, req.body));
}

async function captureOnline(req, res) {
  return ok(res, await service.captureOnlinePayment(req.params.paymentId, req.body));
}

async function confirmCod(req, res) {
  return ok(res, await service.confirmCodPayment(req.params.paymentId));
}

async function list(req, res) {
  const isPrivileged = req.user.roles.includes(ROLES.FINANCE_EXECUTIVE) || req.user.roles.includes(ROLES.SUPER_ADMIN);
  return ok(res, await (isPrivileged ? service.listAll() : service.listForCustomer(req.user.id)));
}

module.exports = { initiate, captureOnline, confirmCod, list };
