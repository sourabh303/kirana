const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateBody = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../config/roles');

const router = express.Router();
router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.get('/users', asyncHandler(controller.listUsers));
router.patch('/users/:userId/roles', validateBody(['roles']), asyncHandler(controller.assignRoles));

router.post('/cities', validateBody(['name']), asyncHandler(controller.createCity));
router.post('/localities', validateBody(['cityId', 'name']), asyncHandler(controller.createLocality));
router.post(
  '/coupons',
  validateBody(['code', 'discountType', 'value']),
  asyncHandler(controller.createCoupon)
);

router.get('/config', asyncHandler(controller.getConfig));
router.patch('/config', asyncHandler(controller.updateConfig));

router.get('/audit-logs', asyncHandler(controller.auditLogs));

module.exports = router;
