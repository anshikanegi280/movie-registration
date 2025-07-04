const express = require('express');
const router = express.Router();

const movieController = require('../controllers/movieController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { 
  validateMovie, 
  validateObjectId, 
  validatePagination 
} = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, optionalAuth, movieController.getAllMovies);
router.get('/featured', movieController.getFeaturedMovies);
router.get('/genre/:genre', validatePagination, movieController.getMoviesByGenre);
router.get('/:id', validateObjectId('id'), optionalAuth, movieController.getMovieById);

// Admin routes
router.get('/admin/stats', authenticateToken, requireAdmin, movieController.getMovieStats);
router.post('/', authenticateToken, requireAdmin, validateMovie, movieController.createMovie);
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateObjectId('id'), 
  validateMovie, 
  movieController.updateMovie
);
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateObjectId('id'), 
  movieController.deleteMovie
);

module.exports = router;
