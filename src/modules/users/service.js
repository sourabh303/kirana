const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');

async function getById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true, addresses: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

async function updateProfile(userId, updates) {
  const allowed = ['name', 'email', 'fcmToken'];
  const data = {};
  allowed.forEach((field) => {
    if (updates[field] !== undefined) data[field] = updates[field];
  });
  return prisma.user.update({
    where: { id: userId },
    data,
    include: { roles: true, addresses: true },
  });
}

// PRD 6: customers store multiple delivery addresses with GPS location.
async function addAddress(userId, address) {
  return prisma.address.create({
    data: {
      userId,
      line1: address.line1,
      city: address.city,
      lat: address.lat ?? null,
      lng: address.lng ?? null,
    },
  });
}

async function listAddresses(userId) {
  return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

async function removeAddress(userId, addressId) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new ApiError(404, 'Address not found');
  await prisma.address.delete({ where: { id: addressId } });
}

module.exports = { getById, updateProfile, addAddress, listAddresses, removeAddress };
