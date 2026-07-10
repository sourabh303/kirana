/**
 * In-memory "database" for the prototype.
 *
 * This stands in for the real persistence layer (e.g. Postgres/Mongo) so
 * the modular API surface, RBAC, and workflows described in the PRD can be
 * demonstrated end-to-end without external infra. Swapping this file for a
 * real DB adapter is the intended upgrade path — every module only talks to
 * `db.<collection>`, never to storage details directly.
 */

const db = {
  users: [], // { id, mobile, name, email, passwordHash, roles: [], addresses: [] }
  otps: [], // { id, mobile, code, expiresAt }
  categories: [],
  products: [], // central catalog (platform-owned)
  shops: [],
  shopProducts: [], // shopkeeper's price/availability mapping onto catalog products
  carts: [], // one active cart per customer
  orders: [],
  deliveries: [],
  payments: [],
  settlements: [],
  notifications: [],
  coupons: [],
  cities: [],
  localities: [],
  auditLogs: [],
};

module.exports = db;
