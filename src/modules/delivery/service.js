const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');

async function createAssignment(orderId, deliveryPartnerId) {
  return prisma.delivery.create({
    data: {
      orderId,
      deliveryPartnerId,
      status: 'assigned',
    },
  });
}

async function getByOrder(orderId) {
  return prisma.delivery.findUnique({ where: { orderId } });
}

async function assertOwnership(deliveryId, partnerId) {
  const assignment = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!assignment) throw new ApiError(404, 'Delivery assignment not found');
  if (assignment.deliveryPartnerId !== partnerId) throw new ApiError(403, 'Not your assignment');
  return assignment;
}

async function accept(deliveryId, partnerId) {
  await assertOwnership(deliveryId, partnerId);
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: { status: 'accepted', acceptedAt: new Date() },
  });
}

async function verifyPickup(deliveryId, partnerId) {
  await assertOwnership(deliveryId, partnerId);
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: { status: 'picked_up', pickedUpAt: new Date() },
  });
}

async function completeDelivery(deliveryId, partnerId, earnings = 25) {
  await assertOwnership(deliveryId, partnerId);
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: { status: 'delivered', deliveredAt: new Date(), earnings },
  });
}

// PRD 8 — Dashboard: assigned deliveries, daily earnings, pending pickups, completed deliveries
async function dashboard(partnerId) {
  const mine = await prisma.delivery.findMany({ where: { deliveryPartnerId: partnerId } });
  const today = new Date().toISOString().slice(0, 10);
  return {
    assignedDeliveries: mine.filter((d) => d.status === 'assigned').length,
    pendingPickups: mine.filter((d) => d.status === 'accepted').length,
    completedDeliveries: mine.filter((d) => d.status === 'delivered').length,
    dailyEarnings: mine
      .filter((d) => d.status === 'delivered' && d.deliveredAt && new Date(d.deliveredAt).toISOString().slice(0, 10) === today)
      .reduce((sum, d) => sum + (d.earnings || 0), 0),
  };
}

async function listForPartner(partnerId) {
  return prisma.delivery.findMany({ where: { deliveryPartnerId: partnerId }, orderBy: { createdAt: 'desc' } });
}

module.exports = {
  createAssignment,
  getByOrder,
  accept,
  verifyPickup,
  completeDelivery,
  dashboard,
  listForPartner,
};

/**
 * PRD Section 8 — Delivery Partner Module.
 * A `deliveries` record tracks the pickup/delivery lifecycle for a partner,
 * separate from (but linked to) the order's own status in the `orders`
 * module — this module is the delivery partner's operational view.
 */

function createAssignment(orderId, deliveryPartnerId) {
  const assignment = {
    id: uuid(),
    orderId,
    deliveryPartnerId,
    status: 'assigned', // assigned -> accepted -> picked_up -> delivered
    acceptedAt: null,
    pickedUpAt: null,
    deliveredAt: null,
    earnings: null,
    createdAt: new Date().toISOString(),
  };
  db.deliveries.push(assignment);
  return assignment;
}

function getByOrder(orderId) {
  return db.deliveries.find((d) => d.orderId === orderId);
}

function assertOwnership(deliveryId, partnerId) {
  const assignment = db.deliveries.find((d) => d.id === deliveryId);
  if (!assignment) throw new ApiError(404, 'Delivery assignment not found');
  if (assignment.deliveryPartnerId !== partnerId) throw new ApiError(403, 'Not your assignment');
  return assignment;
}

function accept(deliveryId, partnerId) {
  const assignment = assertOwnership(deliveryId, partnerId);
  assignment.status = 'accepted';
  assignment.acceptedAt = new Date().toISOString();
  return assignment;
}

function verifyPickup(deliveryId, partnerId) {
  const assignment = assertOwnership(deliveryId, partnerId);
  assignment.status = 'picked_up';
  assignment.pickedUpAt = new Date().toISOString();
  return assignment;
}

function completeDelivery(deliveryId, partnerId, earnings = 25) {
  const assignment = assertOwnership(deliveryId, partnerId);
  assignment.status = 'delivered';
  assignment.deliveredAt = new Date().toISOString();
  assignment.earnings = earnings;
  return assignment;
}

// PRD 8 — Dashboard: assigned deliveries, daily earnings, pending pickups, completed deliveries
function dashboard(partnerId) {
  const mine = db.deliveries.filter((d) => d.deliveryPartnerId === partnerId);
  const today = new Date().toISOString().slice(0, 10);
  return {
    assignedDeliveries: mine.filter((d) => d.status === 'assigned').length,
    pendingPickups: mine.filter((d) => d.status === 'accepted').length,
    completedDeliveries: mine.filter((d) => d.status === 'delivered').length,
    dailyEarnings: mine
      .filter((d) => d.status === 'delivered' && (d.deliveredAt || '').slice(0, 10) === today)
      .reduce((sum, d) => sum + (d.earnings || 0), 0),
  };
}

function listForPartner(partnerId) {
  return db.deliveries.filter((d) => d.deliveryPartnerId === partnerId);
}
