const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateBody = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../config/roles');

const router = express.Router();
router.use(authenticate);

// Customer discovery (PRD 6: nearby shops within delivery radius)
router.get('/', asyncHandler(controller.discover));
router.get('/:shopId', asyncHandler(controller.get));

// Shopkeeper / Admin: shop lifecycle
router.post(
  '/',
  authorize(ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN),
  validateBody(['name', 'category', 'city']),
  asyncHandler(controller.create)
);
router.patch(
  '/:shopId',
  authorize(ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.update)
);

// Shopkeeper product pricing & availability (PRD 5 & 7)
router.get('/:shopId/products', asyncHandler(controller.listProducts));
router.post(
  '/:shopId/products',
  authorize(ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN),
  validateBody(['productId', 'price']),
  asyncHandler(controller.addProduct)
);
router.patch(
  '/:shopId/products/:shopProductId',
  authorize(ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.updateProduct)
);

module.exports = router;
