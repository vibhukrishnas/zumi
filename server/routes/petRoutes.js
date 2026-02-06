const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { verifyToken } = require('../middleware/authMiddleware');

// Pet CRUD routes
router.get('/', verifyToken, petController.getPets);
router.get('/:id', verifyToken, petController.getPetById);
router.post('/', verifyToken, petController.addPet);
router.put('/:id', verifyToken, petController.updatePet);
router.delete('/:id', verifyToken, petController.deletePet);

// Pet activities routes
router.get('/:id/activities', verifyToken, petController.getPetActivities);
router.post('/:id/activities', verifyToken, petController.addPetActivity);

// Pet stats
router.get('/:id/stats', verifyToken, petController.getPetStats);

module.exports = router;
