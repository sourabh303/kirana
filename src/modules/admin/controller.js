const service = require('./service');
const { ok, created } = require('../../utils/response');

async function listUsers(req, res) {
  return ok(res, await service.listUsers());
}

async function assignRoles(req, res) {
  return ok(res, await service.assignRoles(req.params.userId, req.body.roles, req.user.id));
}

async function createCity(req, res) {
  return created(res, await service.createCity(req.body));
}

async function createLocality(req, res) {
  return created(res, await service.createLocality(req.body));
}

async function createCoupon(req, res) {
  return created(res, await service.createCoupon(req.body));
}

async function getConfig(req, res) {
  return ok(res, await service.getSystemConfig());
}

async function updateConfig(req, res) {
  return ok(res, await service.updateSystemConfig(req.body, req.user.id));
}

async function auditLogs(req, res) {
  return ok(res, await service.listAuditLogs());
}

module.exports = {
  listUsers,
  assignRoles,
  createCity,
  createLocality,
  createCoupon,
  getConfig,
  updateConfig,
  auditLogs,
};
