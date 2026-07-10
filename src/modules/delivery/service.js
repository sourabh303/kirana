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
  createAssignment, getByOrder, assertOwnership, accept, verifyPickup, completeDelivery, dashboard, listForPartner };
