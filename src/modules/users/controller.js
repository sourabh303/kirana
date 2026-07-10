const service = require('./service');
const authService = require('../auth/service');
const { ok, created } = require('../../utils/response');

async function getProfile(req, res) {
  const user = await service.getById(req.user.id);
  return ok(res, authService.sanitize(user));
}

async function updateProfile(req, res) {
  const user = await service.updateProfile(req.user.id, req.body);
  return ok(res, authService.sanitize(user));
}

async function addAddress(req, res) {
  const address = await service.addAddress(req.user.id, req.body);
  return created(res, address);
}

async function listAddresses(req, res) {
  return ok(res, await service.listAddresses(req.user.id));
}

async function removeAddress(req, res) {
  await service.removeAddress(req.user.id, req.params.addressId);
  return ok(res, { removed: true });
}

module.exports = { getProfile, updateProfile, addAddress, listAddresses, removeAddress };
