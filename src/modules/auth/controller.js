const service = require('./service');
const userService = require('../users/service');
const { ok, created } = require('../../utils/response');

async function requestOtp(req, res) {
  const result = await service.requestOtp(req.body.mobile);
  return ok(res, result);
}

async function register(req, res) {
  const result = await service.register(req.body);
  return created(res, result);
}

async function loginOtp(req, res) {
  const result = await service.loginWithOtp(req.body);
  return ok(res, result);
}

async function loginPassword(req, res) {
  const result = await service.loginWithPassword(req.body);
  return ok(res, result);
}

async function me(req, res) {
  const user = await userService.getById(req.user.id);
  return ok(res, service.sanitize(user));
}

module.exports = { requestOtp, register, loginOtp, loginPassword, me };
