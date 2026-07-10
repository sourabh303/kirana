const service = require('./service');
const { ok, created } = require('../../utils/response');

async function place(req, res) {
  return created(res, await service.placeOrder(req.user.id, req.body));
}

async function get(req, res) {
  return ok(res, await service.getById(req.params.orderId));
}

async function list(req, res) {
  const { as, shopId } = req.query;
  if (as === 'shopkeeper' && shopId) return ok(res, await service.listForShop(shopId));
  if (as === 'delivery_partner') return ok(res, await service.listForDeliveryPartner(req.user.id));
  return ok(res, await service.listForCustomer(req.user.id));
}

async function shopkeeperReview(req, res) {
  return ok(res, await service.shopkeeperReview(req.params.orderId));
}

async function markUnavailable(req, res) {
  return ok(res, await service.markUnavailableItems(req.params.orderId, req.body.unavailableShopProductIds || []));
}

async function customerConfirm(req, res) {
  return ok(res, await service.customerConfirm(req.params.orderId, req.user.id, req.body));
}

async function pack(req, res) {
  return ok(res, await service.packOrder(req.params.orderId));
}

async function assignDelivery(req, res) {
  return ok(res, await service.assignDeliveryPartner(req.params.orderId, req.body.deliveryPartnerId));
}

async function outForDelivery(req, res) {
  return ok(res, await service.markOutForDelivery(req.params.orderId));
}

async function delivered(req, res) {
  return ok(res, await service.markDelivered(req.params.orderId));
}

async function confirmReceipt(req, res) {
  return ok(res, await service.confirmReceipt(req.params.orderId, req.user.id));
}

async function cancel(req, res) {
  return ok(res, await service.cancel(req.params.orderId, req.body.note));
}

module.exports = {
  place,
  get,
  list,
  shopkeeperReview,
  markUnavailable,
  customerConfirm,
  pack,
  assignDelivery,
  outForDelivery,
  delivered,
  confirmReceipt,
  cancel,
};

function get(req, res) {
  return ok(res, service.getById(req.params.orderId));
}

// Returns orders scoped to whichever role the requester is acting as.
function list(req, res) {
  const { as, shopId } = req.query;
  if (as === 'shopkeeper' && shopId) return ok(res, service.listForShop(shopId));
  if (as === 'delivery_partner') return ok(res, service.listForDeliveryPartner(req.user.id));
  return ok(res, service.listForCustomer(req.user.id));
}

function shopkeeperReview(req, res) {
  return ok(res, service.shopkeeperReview(req.params.orderId));
}

function markUnavailable(req, res) {
  return ok(res, service.markUnavailableItems(req.params.orderId, req.body.unavailableShopProductIds || []));
}

function customerConfirm(req, res) {
  return ok(res, service.customerConfirm(req.params.orderId, req.user.id, req.body));
}

function pack(req, res) {
  return ok(res, service.packOrder(req.params.orderId));
}

function assignDelivery(req, res) {
  return ok(res, service.assignDeliveryPartner(req.params.orderId, req.body.deliveryPartnerId));
}

function outForDelivery(req, res) {
  return ok(res, service.markOutForDelivery(req.params.orderId));
}

function delivered(req, res) {
  return ok(res, service.markDelivered(req.params.orderId));
}

function confirmReceipt(req, res) {
  return ok(res, service.confirmReceipt(req.params.orderId, req.user.id));
}

function cancel(req, res) {
  return ok(res, service.cancel(req.params.orderId, req.body.note));
}
