/**
 * Central Role & RBAC configuration
 * Mirrors PRD Section 3 (User Roles) and Section 4 (Functional Modules by Role)
 */

const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  SHOPKEEPER: 'shopkeeper',
  DELIVERY_PARTNER: 'delivery_partner',
  AREA_MANAGER: 'area_manager',
  SUPPORT_EXECUTIVE: 'support_executive',
  FINANCE_EXECUTIVE: 'finance_executive',
  SUPER_ADMIN: 'super_admin',
});

const ALL_ROLES = Object.values(ROLES);

/**
 * moduleAccess[moduleName] = array of roles allowed to access that module.
 * 'view' vs full-access nuances (e.g. Shopkeeper "view" on Product Catalog,
 * Customer "view" on Payments) are enforced inside the module's own
 * controllers/services, not here — this matrix only gates entry to a module.
 */
const MODULE_ACCESS = {
  auth: ALL_ROLES, // everyone can authenticate
  users: ALL_ROLES, // profile module — everyone can manage their own profile
  catalog: [ROLES.CUSTOMER, ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN],
  shops: [ROLES.CUSTOMER, ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN, ROLES.AREA_MANAGER],
  cart: [ROLES.CUSTOMER],
  orders: ALL_ROLES,
  delivery: [ROLES.DELIVERY_PARTNER, ROLES.AREA_MANAGER, ROLES.SUPER_ADMIN],
  payments: [ROLES.CUSTOMER, ROLES.FINANCE_EXECUTIVE, ROLES.SUPER_ADMIN],
  settlements: [ROLES.SHOPKEEPER, ROLES.DELIVERY_PARTNER, ROLES.FINANCE_EXECUTIVE, ROLES.SUPER_ADMIN],
  reports: [
    ROLES.SHOPKEEPER,
    ROLES.DELIVERY_PARTNER,
    ROLES.SUPPORT_EXECUTIVE,
    ROLES.FINANCE_EXECUTIVE,
    ROLES.AREA_MANAGER,
    ROLES.SUPER_ADMIN,
  ],
  notifications: ALL_ROLES,
  admin: [ROLES.SUPER_ADMIN],
};

module.exports = { ROLES, ALL_ROLES, MODULE_ACCESS };
