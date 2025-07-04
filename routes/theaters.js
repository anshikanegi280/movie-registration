const express = require('express');
const router = express.Router();

const theaterController = require('../controllers/theaterController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { 
  validateTheater, 
  validateObjectId, 
  validatePagination 
} = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, theaterController.getAllTheaters);
router.get('/city/:city', validatePagination, theaterController.getTheatersByCity);
router.get('/:id', validateObjectId('id'), optionalAuth, theaterController.getTheaterById);

// Admin routes
router.get('/admin/stats', authenticateToken, requireAdmin, theaterController.getTheaterStats);
router.post('/', authenticateToken, requireAdmin, validateTheater, theaterController.createTheater);
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateObjectId('id'), 
  validateTheater, 
  theaterController.updateTheater
);
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateObjectId('id'), 
  theaterController.deleteTheater
);

module.exports = router;
