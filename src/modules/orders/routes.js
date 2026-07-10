const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateBody = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../config/roles');

const router = express.Router();
router.use(authenticate); // every role touches Orders per the PRD access table

router.get('/', asyncHandler(controller.list));
router.get('/:orderId', asyncHandler(controller.get));

// Step 1-2: customer places order from cart
router.post(
  '/',
  authorize(ROLES.CUSTOMER),
  validateBody(['deliveryOption', 'paymentMethod']),
  asyncHandler(controller.place)
);

// Step 3: shopkeeper reviews
router.post(
  '/:orderId/review',
  authorize(ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.shopkeeperReview)
);

// Step 4: shopkeeper marks unavailable items -> order revised
router.post(
  '/:orderId/mark-unavailable',
  authorize(ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.markUnavailable)
);

// Step 5-6: customer reviews revision and confirms
router.post('/:orderId/confirm', authorize(ROLES.CUSTOMER), asyncHandler(controller.customerConfirm));

// Step 7: shopkeeper packs
router.post(
  '/:orderId/pack',
  authorize(ROLES.SHOPKEEPER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.pack)
);

// Step 8: delivery partner assignment (dispatch / area manager)
router.post(
  '/:orderId/assign-delivery',
  authorize(ROLES.AREA_MANAGER, ROLES.SUPER_ADMIN),
  validateBody(['deliveryPartnerId']),
  asyncHandler(controller.assignDelivery)
);
router.post(
  '/:orderId/out-for-delivery',
  authorize(ROLES.DELIVERY_PARTNER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.outForDelivery)
);

// Step 9: delivery partner marks delivered
router.post(
  '/:orderId/delivered',
  authorize(ROLES.DELIVERY_PARTNER, ROLES.SUPER_ADMIN),
  asyncHandler(controller.delivered)
);

// Step 10: customer confirms receipt
router.post('/:orderId/confirm-receipt', authorize(ROLES.CUSTOMER), asyncHandler(controller.confirmReceipt));

// Cancellation available to customer, shopkeeper, support, admin
router.post(
  '/:orderId/cancel',
  authorize(ROLES.CUSTOMER, ROLES.SHOPKEEPER, ROLES.SUPPORT_EXECUTIVE, ROLES.SUPER_ADMIN),
  asyncHandler(controller.cancel)
);

module.exports = router;
