const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');
const catalogService = require('../catalog/service');

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function create(ownerId, payload) {
  return prisma.shop.create({
    data: {
      ownerId,
      name: payload.name,
      category: payload.category,
      city: payload.city,
      locality: payload.locality,
      lat: payload.lat,
      lng: payload.lng,
      deliveryRadiusKm: payload.deliveryRadiusKm ?? 3,
      rating: 0,
      isActive: true,
    },
  });
}

async function getById(shopId) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  return shop;
}

async function update(shopId, updates) {
  await getById(shopId); // 404 check
  return prisma.shop.update({ where: { id: shopId }, data: updates });
}

// PRD 6 — Store Selection: "Choose any nearby shop within the delivery radius."
async function discoverNearby({ lat, lng, category }) {
  const shops = await prisma.shop.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
  });
  return shops
    .map((s) => ({
      ...s,
      distanceKm: lat && lng ? Number(haversineKm(lat, lng, s.lat, s.lng).toFixed(2)) : null,
    }))
    .filter((s) => s.distanceKm === null || s.distanceKm <= s.deliveryRadiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

async function assertOwnership(shopId, userId) {
  const shop = await getById(shopId);
  if (shop.ownerId !== userId) {
    throw new ApiError(403, 'You do not own this shop');
  }
  return shop;
}

async function listShopProducts(shopId) {
  const shopProducts = await prisma.shopProduct.findMany({
    where: { shopId },
    include: { product: true },
  });
  return shopProducts.map((sp) => ({
    ...sp,
    product: catalogService.deserialize ? sp.product : {
      ...sp.product,
      images: JSON.parse(sp.product.images || '[]'),
      searchKeywords: JSON.parse(sp.product.searchKeywords || '[]'),
    },
  }));
}

async function addProductToShop(shopId, { productId, price }) {
  await catalogService.getById(productId); // throws 404 if not in central catalog
  const existing = await prisma.shopProduct.findUnique({
    where: { shopId_productId: { shopId, productId } },
  });
  if (existing) throw new ApiError(409, 'Product already added to this shop');
  return prisma.shopProduct.create({ data: { shopId, productId, price, available: true } });
}

async function updateShopProduct(shopId, shopProductId, updates) {
  const entry = await prisma.shopProduct.findFirst({ where: { id: shopProductId, shopId } });
  if (!entry) throw new ApiError(404, 'Shop product not found');
  return prisma.shopProduct.update({ where: { id: shopProductId }, data: updates });
}

module.exports = {
  create,
  getById,
  update,
  discoverNearby,
  assertOwnership,
  listShopProducts,
  addProductToShop,
  updateShopProduct,
};

