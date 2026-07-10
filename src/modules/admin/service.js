const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../config/roles');

async function listUsers() {
  const users = await prisma.user.findMany({
    include: { roles: true, addresses: true },
    orderBy: { createdAt: 'desc' },
  });
  return users.map(({ passwordHash, ...rest }) => rest);
}

async function assignRoles(userId, roles, actorId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');
  const invalid = roles.filter((r) => !Object.values(ROLES).includes(r));
  if (invalid.length) throw new ApiError(400, 'Unknown role(s)', { invalid });

  // Replace all existing roles
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.userRole.createMany({ data: roles.map((role) => ({ userId, role })) });

  await audit(actorId, 'roles_updated', { userId, roles });

  return prisma.user.findUnique({ where: { id: userId }, include: { roles: true, addresses: true } });
}

async function createCity(payload) {
  return prisma.city.create({
    data: { name: payload.name, state: payload.state || null, isActive: true },
  });
}

async function createLocality(payload) {
  return prisma.locality.create({
    data: { cityId: payload.cityId, name: payload.name, isActive: true },
  });
}

async function createCoupon(payload) {
  return prisma.coupon.create({
    data: {
      code: payload.code,
      discountType: payload.discountType,
      value: payload.value,
      maxDiscount: payload.maxDiscount ?? null,
      validFrom: new Date(payload.validFrom),
      validTo: new Date(payload.validTo),
      isActive: true,
    },
  });
}

// Platform-wide settings — stored in a singleton SystemConfig row.
async function getSystemConfig() {
  return prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
}

async function updateSystemConfig(updates, actorId) {
  const config = await prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    update: updates,
    create: { id: 'singleton', ...updates },
  });
  await audit(actorId, 'config_updated', updates);
  return config;
}

async function audit(actorId, action, details) {
  return prisma.auditLog.create({
    data: { actorId, action, details: JSON.stringify(details) },
  });
}

async function listAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { at: 'desc' } });
}

module.exports = {
  listUsers,
  assignRoles,
  createCity,
  createLocality,
  createCoupon,
  getSystemConfig,
  updateSystemConfig,
  listAuditLogs,
};

/**
 * PRD Section 11 — Super Admin manages: Users, Roles, Permissions, Cities,
 * Localities, Shops, Categories, Products, Delivery charges, Platform
 * service fees, Coupons, Notifications, CMS content, System configuration,
 * Audit logs.
 *
 * Product/Category/Shop CRUD already live in their own modules (catalog,
 * shops) since those are large enough to own; this module covers the
 * remaining admin-only configuration surfaces plus cross-cutting user/role
 * management and audit logging.
 */

function listUsers() {
  return db.users.map(({ passwordHash, ...rest }) => rest);
}

function assignRoles(userId, roles) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new ApiError(404, 'User not found');
  const invalid = roles.filter((r) => !Object.values(ROLES).includes(r));
  if (invalid.length) throw new ApiError(400, 'Unknown role(s)', { invalid });
  user.roles = roles;
  audit(userId, 'roles_updated', { roles });
  return user;
}

function createCity(payload) {
  const city = { id: uuid(), name: payload.name, state: payload.state || null, isActive: true };
  db.cities.push(city);
  return city;
}

function createLocality(payload) {
  const locality = { id: uuid(), cityId: payload.cityId, name: payload.name, isActive: true };
  db.localities.push(locality);
  return locality;
}

function createCoupon(payload) {
  const coupon = {
    id: uuid(),
    code: payload.code,
    discountType: payload.discountType, // 'flat' | 'percentage'
    value: payload.value,
    maxDiscount: payload.maxDiscount ?? null,
    validFrom: payload.validFrom,
    validTo: payload.validTo,
    isActive: true,
  };
  db.coupons.push(coupon);
  return coupon;
}

// Platform-wide settings (delivery charges, service fees, etc.) — single config record.
const systemConfig = {
  platformServiceFee: 5,
  deliveryFeeBase: 20,
  defaultSettlementCycle: 'T+1',
};

function getSystemConfig() {
  return systemConfig;
}

function updateSystemConfig(updates) {
  Object.assign(systemConfig, updates);
  audit('system', 'config_updated', updates);
  return systemConfig;
}

function audit(actorId, action, details) {
  db.auditLogs.push({ id: uuid(), actorId, action, details, at: new Date().toISOString() });
}

function listAuditLogs() {
  return db.auditLogs;
}
