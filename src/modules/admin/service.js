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
  assignRoles, createCity, createLocality, createCoupon, getSystemConfig, updateSystemConfig, listAuditLogs };
