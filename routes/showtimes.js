const express = require('express');
const router = express.Router();

const showtimeController = require('../controllers/showtimeController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { 
  validateShowtime, 
  validateObjectId, 
  validatePagination 
} = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, showtimeController.getAllShowtimes);
router.get('/movie/:movieId', validateObjectId('movieId'), validatePagination, showtimeController.getShowtimesByMovie);
router.get('/:id', validateObjectId('id'), showtimeController.getShowtimeById);
router.get('/:id/seats', validateObjectId('id'), showtimeController.getAvailableSeats);

// Admin routes
router.post('/', authenticateToken, requireAdmin, validateShowtime, showtimeController.createShowtime);
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateObjectId('id'), 
  validateShowtime, 
  showtimeController.updateShowtime
);
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateObjectId('id'), 
  showtimeController.deleteShowtime
);

module.exports = router;
