/**
 * Seeds the SQLite database with one user per role, a sample shop, and a
 * few catalog products, then prints ready-to-use JWTs for immediate testing.
 *
 * Run with: npm run seed
 * Or auto-runs on boot when SEED_ON_BOOT=true (default in dev).
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('./prisma');
const { ROLES } = require('../config/roles');

function signToken(userId, roles) {
  return jwt.sign({ sub: userId, roles }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '7d',
  });
}

async function seed() {
  // Skip if already seeded (idempotent)
  const existing = await prisma.user.findUnique({ where: { mobile: '9990000001' } });
  if (existing) {
    console.log('Database already seeded. Skipping.\n');
    return;
  }

  const passwordHash = bcrypt.hashSync('password123', 8);

  const usersData = [
    { mobile: '9990000001', name: 'Asha Customer', role: ROLES.CUSTOMER },
    { mobile: '9990000002', name: 'Ravi Shopkeeper', role: ROLES.SHOPKEEPER },
    { mobile: '9990000003', name: 'Manoj Delivery', role: ROLES.DELIVERY_PARTNER },
    { mobile: '9990000004', name: 'Neha AreaManager', role: ROLES.AREA_MANAGER },
    { mobile: '9990000005', name: 'Kiran Support', role: ROLES.SUPPORT_EXECUTIVE },
    { mobile: '9990000006', name: 'Vikram Finance', role: ROLES.FINANCE_EXECUTIVE },
    { mobile: '9990000007', name: 'Super Admin', role: ROLES.SUPER_ADMIN },
  ];

  const users = {};
  for (const { mobile, name, role } of usersData) {
    const user = await prisma.user.create({
      data: {
        mobile,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        passwordHash,
        roles: { create: [{ role }] },
        addresses: {
          create: [{ line1: '123 MG Road', city: 'Ambala', lat: 30.3782, lng: 76.7767 }],
        },
      },
      include: { roles: true },
    });
    users[role] = user;
  }

  // Seed catalog products
  const rice = await prisma.product.create({
    data: {
      name: 'Basmati Rice 5kg',
      brand: 'India Gate',
      category: 'grocery',
      unitOfMeasure: 'pack',
      searchKeywords: JSON.stringify(['rice', 'basmati']),
      gstCategory: '5%',
      defaultTaxRate: 5,
    },
  });
  const milk = await prisma.product.create({
    data: {
      name: 'Toned Milk 1L',
      brand: 'Amul',
      category: 'dairy',
      unitOfMeasure: 'pack',
      searchKeywords: JSON.stringify(['milk', 'dairy']),
      gstCategory: '0%',
      defaultTaxRate: 0,
    },
  });

  // Seed shop
  const shopkeeper = users[ROLES.SHOPKEEPER];
  const shop = await prisma.shop.create({
    data: {
      ownerId: shopkeeper.id,
      name: 'Ravi General Store',
      category: 'grocery',
      city: 'Ambala',
      locality: 'MG Road',
      lat: 30.3798,
      lng: 76.7784,
      deliveryRadiusKm: 5,
    },
  });

  const shopRice = await prisma.shopProduct.create({
    data: { shopId: shop.id, productId: rice.id, price: 650, available: true },
  });
  const shopMilk = await prisma.shopProduct.create({
    data: { shopId: shop.id, productId: milk.id, price: 32, available: true },
  });

  // Seed system config
  await prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  // Print tokens
  console.log('Seeded demo data. JWTs (Bearer tokens) for each role:\n');
  for (const [, user] of Object.entries(users)) {
    const roleName = user.roles[0].role;
    const token = signToken(user.id, [roleName]);
    console.log(`${roleName.padEnd(18)} (${user.mobile}): ${token}\n`);
  }
  console.log(
    `Shop: ${shop.id} | shopProduct(rice): ${shopRice.id} | shopProduct(milk): ${shopMilk.id}`
  );
}

if (require.main === module) {
  seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = seed;
