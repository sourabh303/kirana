const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const validateBody = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();
router.use(authenticate);

router.get('/me', asyncHandler(controller.getProfile));
router.patch('/me', asyncHandler(controller.updateProfile));
router.get('/me/addresses', asyncHandler(controller.listAddresses));
router.post('/me/addresses', validateBody(['line1', 'city']), asyncHandler(controller.addAddress));
router.delete('/me/addresses/:addressId', asyncHandler(controller.removeAddress));

module.exports = router;
