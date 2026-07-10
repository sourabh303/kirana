const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/authenticate');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.post('/:notificationId/read', asyncHandler(controller.markRead));

module.exports = router;
