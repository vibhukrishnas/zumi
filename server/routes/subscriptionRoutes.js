const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/upgrade', verifyToken, subscriptionController.upgradeSubscription);
router.get('/', verifyToken, subscriptionController.getSubscription);

module.exports = router;
