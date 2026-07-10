const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../config/roles');

const router = express.Router();
router.use(authenticate);

router.get(
  '/shopkeeper',
  authorize(ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.shopkeeper)
);
router.get(
  '/delivery-partner',
  authorize(ROLES.DELIVERY_PARTNER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.deliveryPartner)
);
router.get(
  '/admin',
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.FINANCE_EXECUTIVE,
    ROLES.AREA_MANAGER,
    ROLES.SUPPORT_EXECUTIVE
  ),
  asyncHandler(controller.admin)
);

module.exports = router;
