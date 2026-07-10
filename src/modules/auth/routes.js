const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const validateBody = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.post('/otp/request', validateBody(['mobile']), asyncHandler(controller.requestOtp));
router.post(
  '/register',
  validateBody(['mobile', 'name', 'otpCode']),
  asyncHandler(controller.register)
);
router.post('/login/otp', validateBody(['mobile', 'otpCode']), asyncHandler(controller.loginOtp));
router.post(
  '/login/password',
  validateBody(['mobile', 'password']),
  asyncHandler(controller.loginPassword)
);
router.get('/me', authenticate, asyncHandler(controller.me));

module.exports = router;
