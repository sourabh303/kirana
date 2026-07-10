const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');
const cartService = require('../cart/service');
const { STATUS, canTransition } = require('./statuses');
const notificationsService = require('../notifications/service');
const deliveryService = require('../delivery/service');

function parseOrder(order) {
  return {
    ...order,
    items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    pricing: typeof order.pricing === 'string' ? JSON.parse(order.pricing) : order.pricing,
    history: typeof order.history === 'string' ? JSON.parse(order.history) : order.history,
  };
}

async function transition(orderId, toStatus, actorNote) {
  const raw = await prisma.order.findUnique({ where: { id: orderId } });
  if (!raw) throw new ApiError(404, 'Order not found');
  const order = parseOrder(raw);

  if (!canTransition(order.status, toStatus)) {
    throw new ApiError(409, `Cannot move order from '${order.status}' to '${toStatus}'`);
  }

  const newHistory = [
    ...order.history,
    { status: toStatus, at: new Date().toISOString(), note: actorNote || null },
  ];

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: toStatus, history: JSON.stringify(newHistory) },
  });
  return parseOrder(updated);
}

// Step 1 & 2: customer selects a shop and places an order from their cart.
async function placeOrder(customerId, { deliveryOption, paymentMethod, addressId }) {
  const cartSummary = await cartService.summarize(customerId);
  if (!cartSummary.items.length) throw new ApiError(400, 'Cart is empty');
  if (!['home_delivery', 'self_pickup'].includes(deliveryOption)) {
    throw new ApiError(400, 'deliveryOption must be home_delivery or self_pickup');
  }

  const pricing = {
    subtotal: cartSummary.subtotal,
    tax: cartSummary.tax,
    platformServiceFee: cartSummary.platformServiceFee,
    deliveryFee: cartSummary.deliveryFee,
    total: cartSummary.total,
  };
  const orderItems = cartSummary.items.map((i) => ({ ...i, status: 'pending' }));
  const history = [{ status: STATUS.PLACED, at: new Date().toISOString(), note: null }];

  const order = await prisma.order.create({
    data: {
      customer: { connect: { id: customerId } },
      shop: { connect: { id: cartSummary.shopId } },
      items: JSON.stringify(orderItems),
      pricing: JSON.stringify(pricing),
      deliveryOption,
      paymentMethod,
      addressId: addressId || null,
      status: STATUS.PLACED,
      history: JSON.stringify(history),
    },
  });

  await cartService.clear(customerId);
  await notificationsService.notify(customerId, 'order_placed', { orderId: order.id });
  return parseOrder(order);
}

async function getById(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, 'Order not found');
  return parseOrder(order);
}

async function listForCustomer(customerId) {
  const orders = await prisma.order.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
  return orders.map(parseOrder);
}

async function listForShop(shopId) {
  const orders = await prisma.order.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
  return orders.map(parseOrder);
}

async function listForDeliveryPartner(deliveryPartnerId) {
  const orders = await prisma.order.findMany({ where: { deliveryPartnerId }, orderBy: { createdAt: 'desc' } });
  return orders.map(parseOrder);
}

// Step 3: shopkeeper begins reviewing.
async function shopkeeperReview(orderId) {
  return transition(orderId, STATUS.UNDER_REVIEW);
}

// Step 4: shopkeeper marks specific items unavailable, producing a revised order.
async function markUnavailableItems(orderId, unavailableShopProductIds) {
  const order = await getById(orderId);

  const updatedItems = order.items.map((item) => ({
    ...item,
    status: unavailableShopProductIds.includes(item.shopProductId) ? 'unavailable' : 'confirmed',
  }));

  const anyUnavailable = updatedItems.some((i) => i.status === 'unavailable');
  const newStatus = anyUnavailable ? STATUS.REVISED : STATUS.CONFIRMED;

  const activeItems = updatedItems.filter((i) => i.status !== 'unavailable');
  const subtotal = activeItems.reduce((s, i) => s + i.lineTotal, 0);
  const oldPricing = order.pricing;
  const newPricing = {
    ...oldPricing,
    subtotal,
    total: Number((subtotal + oldPricing.tax + oldPricing.platformServiceFee + oldPricing.deliveryFee).toFixed(2)),
  };
  const newHistory = [
    ...order.history,
    { status: newStatus, at: new Date().toISOString(), note: null },
  ];

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      items: JSON.stringify(updatedItems),
      pricing: JSON.stringify(newPricing),
      status: newStatus,
      history: JSON.stringify(newHistory),
    },
  });

  await notificationsService.notify(order.customerId, 'order_updated', { orderId });
  return parseOrder(updated);
}

// Step 5 & 6: customer reviews and confirms the (possibly revised) order.
async function customerConfirm(orderId, customerId, { addFromAnotherShopOrderId } = {}) {
  const order = await getById(orderId);
  if (order.customerId !== customerId) throw new ApiError(403, 'Not your order');

  const newHistory = [
    ...order.history,
    { status: STATUS.CONFIRMED, at: new Date().toISOString(), note: null },
  ];
  const data = { status: STATUS.CONFIRMED, history: JSON.stringify(newHistory) };
  if (addFromAnotherShopOrderId) data.linkedOrderId = addFromAnotherShopOrderId;

  const updated = await prisma.order.update({ where: { id: orderId }, data });
  await notificationsService.notify(customerId, 'order_confirmation_required', { orderId });
  return parseOrder(updated);
}

// Step 7: shopkeeper packs the order.
async function packOrder(orderId) {
  const order = await transition(orderId, STATUS.PACKED);
  await notificationsService.notify(order.customerId, 'order_packed', { orderId });
  return order;
}

// Step 8: delivery partner assigned (typically by Area Manager).
async function assignDeliveryPartner(orderId, deliveryPartnerId) {
  const raw = await prisma.order.findUnique({ where: { id: orderId } });
  if (!raw) throw new ApiError(404, 'Order not found');
  const order = parseOrder(raw);

  if (!canTransition(order.status, STATUS.DELIVERY_ASSIGNED)) {
    throw new ApiError(409, `Cannot assign delivery from status '${order.status}'`);
  }

  const newHistory = [
    ...order.history,
    { status: STATUS.DELIVERY_ASSIGNED, at: new Date().toISOString(), note: null },
  ];
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { deliveryPartnerId, status: STATUS.DELIVERY_ASSIGNED, history: JSON.stringify(newHistory) },
  });

  await deliveryService.createAssignment(orderId, deliveryPartnerId);
  await notificationsService.notify(order.customerId, 'delivery_assigned', { orderId });
  await notificationsService.notify(deliveryPartnerId, 'delivery_assigned', { orderId });
  return parseOrder(updated);
}

async function markOutForDelivery(orderId) {
  const order = await transition(orderId, STATUS.OUT_FOR_DELIVERY);
  await notificationsService.notify(order.customerId, 'out_for_delivery', { orderId });
  return order;
}

// Step 9: order is delivered (delivery partner action).
async function markDelivered(orderId) {
  const order = await transition(orderId, STATUS.DELIVERED);
  await notificationsService.notify(order.customerId, 'delivered', { orderId });
  return order;
}

// Step 10: customer confirms receipt, completing the order.
async function confirmReceipt(orderId, customerId) {
  const order = await getById(orderId);
  if (order.customerId !== customerId) throw new ApiError(403, 'Not your order');
  return transition(orderId, STATUS.COMPLETED);
}

async function cancel(orderId, note) {
  const order = await transition(orderId, STATUS.CANCELLED, note);
  await notificationsService.notify(order.customerId, 'order_cancelled', { orderId });
  return order;
}

module.exports = {
  placeOrder,
  getById,
  listForCustomer,
  listForShop,
  listForDeliveryPartner,
  shopkeeperReview,
  markUnavailableItems,
  customerConfirm,
  packOrder,
  assignDeliveryPartner,
  markOutForDelivery,
  markDelivered,
  confirmReceipt,
  cancel,
};
