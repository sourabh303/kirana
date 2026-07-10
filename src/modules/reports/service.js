const prisma = require('../../data/prisma');

// PRD 14 — Shopkeeper reports: sales, top-selling products, revenue trends, settlement history
async function shopkeeperReport(shopId) {
  const rawOrders = await prisma.order.findMany({ where: { shopId, status: 'completed' } });
  const orders = rawOrders.map((o) => ({
    ...o,
    items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
    pricing: typeof o.pricing === 'string' ? JSON.parse(o.pricing) : o.pricing,
  }));

  const productSales = {};
  orders.forEach((o) => {
    o.items.forEach((i) => {
      if (i.status === 'unavailable') return;
      productSales[i.productName] = (productSales[i.productName] || 0) + i.quantity;
    });
  });
  const topSellingProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, quantity]) => ({ name, quantity }));

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  const settlementHistory = shop
    ? await prisma.settlement.findMany({ where: { beneficiaryId: shop.ownerId, type: 'shopkeeper' } })
    : [];

  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.pricing.subtotal || 0), 0),
    topSellingProducts,
    settlementHistory,
  };
}

// PRD 14 — Delivery Partner reports
async function deliveryPartnerReport(partnerId) {
  const deliveries = await prisma.delivery.findMany({ where: { deliveryPartnerId: partnerId, status: 'delivered' } });
  return {
    deliveriesCompleted: deliveries.length,
    totalEarnings: deliveries.reduce((sum, d) => sum + (d.earnings || 0), 0),
    distanceTraveledKm: null,
    rating: null,
  };
}

// PRD 14 — Admin reports
async function adminReport() {
  const [allOrders, allUsers, allShops, allDeliveries] = await Promise.all([
    prisma.order.findMany(),
    prisma.user.findMany(),
    prisma.shop.findMany(),
    prisma.delivery.findMany(),
  ]);

  const parsedOrders = allOrders.map((o) => ({
    ...o,
    pricing: typeof o.pricing === 'string' ? JSON.parse(o.pricing) : o.pricing,
  }));

  const completedOrders = parsedOrders.filter((o) => o.status === 'completed');
  const cancelledOrders = parsedOrders.filter((o) => o.status === 'cancelled');
  const gmv = completedOrders.reduce((sum, o) => sum + (o.pricing.total || 0), 0);

  const ordersByDay = {};
  allOrders.forEach((o) => {
    const day = new Date(o.createdAt).toISOString().slice(0, 10);
    ordersByDay[day] = (ordersByDay[day] || 0) + 1;
  });

  const customerOrderCounts = {};
  allOrders.forEach((o) => {
    customerOrderCounts[o.customerId] = (customerOrderCounts[o.customerId] || 0) + 1;
  });
  const repeatCustomers = Object.values(customerOrderCounts).filter((c) => c > 1).length;
  const totalCustomers = Object.keys(customerOrderCounts).length;

  return {
    gmv,
    activeUsers: allUsers.length,
    activeShops: allShops.filter((s) => s.isActive).length,
    ordersByDay,
    totalRevenue: gmv,
    cancellationRate: allOrders.length > 0 ? Number((cancelledOrders.length / allOrders.length).toFixed(4)) : 0,
    deliveryPerformance: {
      total: allDeliveries.length,
      completed: allDeliveries.filter((d) => d.status === 'delivered').length,
    },
    customerRetentionRate: totalCustomers > 0 ? Number((repeatCustomers / totalCustomers).toFixed(4)) : 0,
  };
}

module.exports = { shopkeeperReport, deliveryPartnerReport, adminReport };

