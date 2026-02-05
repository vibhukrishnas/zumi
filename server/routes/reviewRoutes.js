const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, reviewController.createReview);
router.get('/service/:serviceId', verifyToken, reviewController.getServiceReviews);

module.exports = router;
