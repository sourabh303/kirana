const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

function createPrismaClient() {
  // DATABASE_URL is e.g. "file:./dev.db" — resolve relative to project root (cwd)
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const dbRel = dbUrl.replace(/^file:/, '');
  const absolutePath = path.resolve(process.cwd(), dbRel);
  const absoluteUrl = `file:${absolutePath}`;

  const adapter = new PrismaBetterSqlite3({ url: absoluteUrl });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const prisma = global.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

module.exports = prisma;
