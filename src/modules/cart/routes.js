const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateBody = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../config/roles');

const router = express.Router();
router.use(authenticate, authorize(ROLES.CUSTOMER));

router.get('/', asyncHandler(controller.view));
router.post('/items', validateBody(['shopProductId', 'quantity']), asyncHandler(controller.addItem));
router.patch('/items/:shopProductId', validateBody(['quantity']), asyncHandler(controller.updateItem));
router.delete('/', asyncHandler(controller.clear));

module.exports = router;
