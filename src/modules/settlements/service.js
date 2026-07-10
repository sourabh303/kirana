const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');

async function generateForShop(shopId, cycleLabel) {
  const shopOrders = await prisma.order.findMany({ where: { shopId, status: 'completed' } });
  const parsedOrders = shopOrders.map((o) => ({
    ...o,
    pricing: typeof o.pricing === 'string' ? JSON.parse(o.pricing) : o.pricing,
  }));
  const grossAmount = parsedOrders.reduce((sum, o) => sum + (o.pricing.subtotal || 0), 0);
  const refundAdjustments = 0;
  const replacementDeductions = 0;
  const netAmount = Number((grossAmount - refundAdjustments - replacementDeductions).toFixed(2));

  // Look up the shop's owner to set as beneficiary
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  return prisma.settlement.create({
    data: {
      type: 'shopkeeper',
      beneficiaryId: shop.ownerId,
      shopId,
      cycleLabel: cycleLabel || 'T+1',
      orderCount: shopOrders.length,
      grossAmount,
      refundAdjustments,
      replacementDeductions,
      netAmount,
      status: 'generated',
    },
  });
}

async function generateForDeliveryPartner(deliveryPartnerId, cycleLabel) {
  const completed = await prisma.delivery.findMany({
    where: { deliveryPartnerId, status: 'delivered' },
  });
  const netAmount = completed.reduce((sum, d) => sum + (d.earnings || 0), 0);

  return prisma.settlement.create({
    data: {
      type: 'delivery_partner',
      beneficiaryId: deliveryPartnerId,
      cycleLabel: cycleLabel || 'T+1',
      orderCount: completed.length,
      grossAmount: netAmount,
      refundAdjustments: 0,
      replacementDeductions: 0,
      netAmount,
      status: 'generated',
    },
  });
}

async function markPaid(settlementId) {
  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } });
  if (!settlement) throw new ApiError(404, 'Settlement not found');
  return prisma.settlement.update({
    where: { id: settlementId },
    data: { status: 'paid', paidAt: new Date() },
  });
}

async function listForBeneficiary(beneficiaryId) {
  return prisma.settlement.findMany({ where: { beneficiaryId }, orderBy: { createdAt: 'desc' } });
}

async function listAll() {
  return prisma.settlement.findMany({ orderBy: { createdAt: 'desc' } });
}

module.exports = {
  generateForShop,
  generateForDeliveryPartner, markPaid, listForBeneficiary, listAll };
