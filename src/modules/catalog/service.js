const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');

async function create(payload) {
  const product = await prisma.product.create({
    data: {
      name: payload.name,
      brand: payload.brand || null,
      category: payload.category,
      unitOfMeasure: payload.unitOfMeasure,
      images: JSON.stringify(payload.images || []),
      barcode: payload.barcode || null,
      description: payload.description || '',
      searchKeywords: JSON.stringify(payload.searchKeywords || []),
      gstCategory: payload.gstCategory || null,
      defaultTaxRate: payload.defaultTaxRate ?? 0,
    },
  });
  return deserialize(product);
}

async function update(productId, updates) {
  await getById(productId); // 404 check
  const data = { ...updates };
  if (updates.images) data.images = JSON.stringify(updates.images);
  if (updates.searchKeywords) data.searchKeywords = JSON.stringify(updates.searchKeywords);
  const product = await prisma.product.update({ where: { id: productId }, data });
  return deserialize(product);
}

async function remove(productId) {
  await getById(productId); // 404 check
  await prisma.product.delete({ where: { id: productId } });
}

async function getById(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, 'Product not found');
  return deserialize(product);
}

async function search({ q, category } = {}) {
  const products = await prisma.product.findMany({
    where: {
      AND: [
        category ? { category } : {},
        q
          ? {
              OR: [
                { name: { contains: q } },
                { searchKeywords: { contains: q } },
              ],
            }
          : {},
      ],
    },
  });
  return products.map(deserialize);
}

function deserialize(p) {
  return {
    ...p,
    images: JSON.parse(p.images || '[]'),
    searchKeywords: JSON.parse(p.searchKeywords || '[]'),
  };
}

module.exports = { create, update, remove, getById, search };
