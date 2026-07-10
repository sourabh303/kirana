const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../config/roles');

const router = express.Router();
router.use(authenticate, authorize(ROLES.DELIVERY_PARTNER, ROLES.AREA_MANAGER, ROLES.SUPER_ADMIN));

router.get('/dashboard', asyncHandler(controller.dashboard));
router.get('/assignments', asyncHandler(controller.list));
router.post('/assignments/:deliveryId/accept', asyncHandler(controller.accept));
router.post('/assignments/:deliveryId/verify-pickup', asyncHandler(controller.verifyPickup));
router.post('/assignments/:deliveryId/complete', asyncHandler(controller.complete));

module.exports = router;
