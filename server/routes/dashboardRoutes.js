const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Public dashboard data (works with or without auth)
router.get('/', optionalAuth, dashboardController.getDashboardData);

// Featured items
router.get('/featured', dashboardController.getFeatured);

module.exports = router;
