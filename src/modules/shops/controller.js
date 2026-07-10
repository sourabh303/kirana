const service = require('./service');
const { ok, created } = require('../../utils/response');

async function discover(req, res) {
  const { lat, lng, category } = req.query;
  return ok(
    res,
    await service.discoverNearby({
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      category,
    })
  );
}

async function get(req, res) {
  return ok(res, await service.getById(req.params.shopId));
}

async function create(req, res) {
  return created(res, await service.create(req.user.id, req.body));
}

async function update(req, res) {
  await service.assertOwnership(req.params.shopId, req.user.id);
  return ok(res, await service.update(req.params.shopId, req.body));
}

async function listProducts(req, res) {
  return ok(res, await service.listShopProducts(req.params.shopId));
}

async function addProduct(req, res) {
  await service.assertOwnership(req.params.shopId, req.user.id);
  return created(res, await service.addProductToShop(req.params.shopId, req.body));
}

async function updateProduct(req, res) {
  await service.assertOwnership(req.params.shopId, req.user.id);
  return ok(res, await service.updateShopProduct(req.params.shopId, req.params.shopProductId, req.body));
}

module.exports = { discover, get, create, update, listProducts, addProduct, updateProduct };
