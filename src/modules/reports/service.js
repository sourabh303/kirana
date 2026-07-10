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

// PRD 14 — Shopkeeper reports: sales, top-selling products, revenue trends, settlement history
function shopkeeperReport(shopId) {
  const orders = db.orders.filter((o) => o.shopId === shopId && o.status === 'completed');
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

  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.pricing.subtotal, 0),
    topSellingProducts,
    settlementHistory: db.settlements.filter((s) => s.beneficiaryId === shopId),
  };
}

// PRD 14 — Delivery Partner reports: deliveries completed, distance, earnings, ratings
function deliveryPartnerReport(partnerId) {
  const deliveries = db.deliveries.filter((d) => d.deliveryPartnerId === partnerId && d.status === 'delivered');
  return {
    deliveriesCompleted: deliveries.length,
    totalEarnings: deliveries.reduce((sum, d) => sum + (d.earnings || 0), 0),
    distanceTraveledKm: null, // requires live GPS tracking (PRD Section 16, future enhancement)
    rating: null, // populated once the ratings feature is implemented
  };
}

// PRD 14 — Admin reports: GMV, active users, active shops, orders/day, revenue, cancellation rate, delivery performance, customer retention
function adminReport() {
  const completedOrders = db.orders.filter((o) => o.status === 'completed');
  const cancelledOrders = db.orders.filter((o) => o.status === 'cancelled');
  const gmv = completedOrders.reduce((sum, o) => sum + o.pricing.total, 0);

  const ordersByDay = {};
  db.orders.forEach((o) => {
    const day = o.createdAt.slice(0, 10);
    ordersByDay[day] = (ordersByDay[day] || 0) + 1;
  });

  const customerOrderCounts = {};
  db.orders.forEach((o) => {
    customerOrderCounts[o.customerId] = (customerOrderCounts[o.customerId] || 0) + 1;
  });
  const repeatCustomers = Object.values(customerOrderCounts).filter((c) => c > 1).length;
  const totalCustomers = Object.keys(customerOrderCounts).length;

  return {
    gmv,
    activeUsers: db.users.length,
    activeShops: db.shops.filter((s) => s.isActive).length,
    ordersByDay,
    totalRevenue: gmv,
    cancellationRate: db.orders.length ? Number((cancelledOrders.length / db.orders.length).toFixed(4)) : 0,
    deliveryPerformance: {
      totalDeliveries: db.deliveries.length,
      completed: db.deliveries.filter((d) => d.status === 'delivered').length,
    },
    customerRetentionRate: totalCustomers ? Number((repeatCustomers / totalCustomers).toFixed(4)) : 0,
  };
}
