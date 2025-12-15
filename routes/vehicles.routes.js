const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');

// Public routes
router.get('/', vehicleController.getAllVehicles);
router.get('/featured', vehicleController.getFeaturedVehicles);
router.get('/search', vehicleController.searchVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.get('/:id/similar', vehicleController.getSimilarVehicles);

// Protected routes
router.post('/', authMiddleware, uploadMiddleware.array('images', 10), vehicleController.createVehicle);
router.put('/:id', authMiddleware, vehicleController.updateVehicle);
router.delete('/:id', authMiddleware, vehicleController.deleteVehicle);

// Favorites
router.post('/:id/favorite', authMiddleware, vehicleController.addToFavorites);
router.delete('/:id/favorite', authMiddleware, vehicleController.removeFromFavorites);
router.get('/user/favorites', authMiddleware, vehicleController.getUserFavorites);

module.exports = router;