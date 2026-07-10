const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateBody = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../config/roles');

const router = express.Router();
router.use(authenticate);

// Customer + Shopkeeper: read-only view (PRD table: Customer ✓, Shopkeeper "View")
router.get('/', asyncHandler(controller.list));
router.get('/:productId', asyncHandler(controller.get));

// Super Admin only: full catalog ownership (PRD table: Admin ✓)
router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN),
  validateBody(['name', 'category', 'unitOfMeasure']),
  asyncHandler(controller.create)
);
router.patch('/:productId', authorize(ROLES.SUPER_ADMIN), asyncHandler(controller.update));
router.delete('/:productId', authorize(ROLES.SUPER_ADMIN), asyncHandler(controller.remove));

module.exports = router;
