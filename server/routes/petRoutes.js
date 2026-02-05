const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, petController.getPets);
router.post('/', verifyToken, petController.addPet);
router.delete('/:id', verifyToken, petController.deletePet);

module.exports = router;
