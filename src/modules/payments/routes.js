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
  '/',
  authorize(ROLES.CUSTOMER),
  validateBody(['orderId', 'method']),
  asyncHandler(controller.initiate)
);
router.post(
  '/:paymentId/confirm-cod',
  authorize(ROLES.DELIVERY_PARTNER, ROLES.FINANCE_EXECUTIVE, ROLES.SUPER_ADMIN),
  asyncHandler(controller.confirmCod)
);
router.post(
  '/:paymentId/capture',
  authorize(ROLES.CUSTOMER),
  validateBody(['razorpayPaymentId', 'razorpayOrderId', 'razorpaySignature']),
  asyncHandler(controller.captureOnline)
);

module.exports = router;
