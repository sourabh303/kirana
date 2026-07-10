const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');

const PLATFORM_SERVICE_FEE = 5;
const DELIVERY_FEE = 20;
const TAX_RATE = 0.0;

async function getOrCreateCart(customerId, shopId) {
  let cart = await prisma.cart.findUnique({ where: { customerId } });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId, shopId: shopId ? shopId : null, items: '[]' },
    });
  } else if (shopId && cart.shopId && cart.shopId !== shopId) {
    const items = JSON.parse(cart.items || '[]');
    if (items.length > 0) {
      throw new ApiError(409, 'Cart already has items from a different shop. Clear cart first.');
    }
    cart = await prisma.cart.update({ where: { customerId }, data: { shopId } });
  } else if (shopId && !cart.shopId) {
    cart = await prisma.cart.update({ where: { customerId }, data: { shopId } });
  }
  return cart;
}

async function addItem(customerId, { shopId, shopProductId, quantity }) {
  const cart = await getOrCreateCart(customerId, shopId);
  const items = JSON.parse(cart.items || '[]');
  const existing = items.find((i) => i.shopProductId === shopProductId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ shopProductId, quantity });
  }
  return prisma.cart.update({ where: { customerId }, data: { items: JSON.stringify(items) } });
}

async function updateItem(customerId, shopProductId, quantity) {
  const cart = await getOrCreateCart(customerId);
  const items = JSON.parse(cart.items || '[]');
  const idx = items.findIndex((i) => i.shopProductId === shopProductId);
  if (idx === -1) throw new ApiError(404, 'Item not in cart');
  if (quantity <= 0) {
    items.splice(idx, 1);
  } else {
    items[idx].quantity = quantity;
  }
  return prisma.cart.update({ where: { customerId }, data: { items: JSON.stringify(items) } });
}

async function clear(customerId) {
  return prisma.cart.upsert({
    where: { customerId },
    update: { items: '[]', shopId: null },
    create: { customerId, items: '[]' },
  });
}

// PRD 6 — Shopping Cart displays: product price, platform fee, delivery fee, taxes, total
async function summarize(customerId) {
  const cart = await getOrCreateCart(customerId);
  const items = JSON.parse(cart.items || '[]');

  const lines = await Promise.all(
    items.map(async (item) => {
      const shopProduct = await prisma.shopProduct.findUnique({
        where: { id: item.shopProductId },
        include: { product: true },
      });
      if (!shopProduct) throw new ApiError(404, `Shop product ${item.shopProductId} not found`);
      const lineTotal = shopProduct.price * item.quantity;
      return {
        shopProductId: item.shopProductId,
        productName: shopProduct.product ? shopProduct.product.name : 'Unknown product',
        unitPrice: shopProduct.price,
        quantity: item.quantity,
        available: shopProduct.available,
        lineTotal,
      };
    })
  );

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const platformServiceFee = lines.length ? PLATFORM_SERVICE_FEE : 0;
  const deliveryFee = lines.length ? DELIVERY_FEE : 0;
  const total = Number((subtotal + tax + platformServiceFee + deliveryFee).toFixed(2));

  return {
    cartId: cart.id,
    shopId: cart.shopId,
    items: lines,
    subtotal,
    tax,
    platformServiceFee,
    deliveryFee,
    total,
  };
}

module.exports = { getOrCreateCart, addItem, updateItem, clear, summarize };

