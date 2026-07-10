const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateBody = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../config/roles');

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(controller.list));

router.post(
  '/shop',
  authorize(ROLES.FINANCE_EXECUTIVE, ROLES.SUPER_ADMIN),
  validateBody(['shopId']),
  asyncHandler(controller.generateShop)
);
router.post(
  '/delivery-partner',
  authorize(ROLES.FINANCE_EXECUTIVE, ROLES.SUPER_ADMIN),
  validateBody(['deliveryPartnerId']),
  asyncHandler(controller.generateDelivery)
);
router.post(
  '/:settlementId/mark-paid',
  authorize(ROLES.FINANCE_EXECUTIVE, ROLES.SUPER_ADMIN),
  asyncHandler(controller.markPaid)
);

module.exports = router;
