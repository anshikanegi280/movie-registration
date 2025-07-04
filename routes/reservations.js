const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservationController');
const { authenticateToken, requireAdmin, requireReservationAccess } = require('../middleware/auth');
const { 
  validateReservation, 
  validateObjectId, 
  validatePagination,
  validateDateRange 
} = require('../middleware/validation');

// User routes
router.post('/', authenticateToken, validateReservation, reservationController.createReservation);
router.get('/my-reservations', authenticateToken, validatePagination, reservationController.getUserReservations);
router.get('/:id', authenticateToken, validateObjectId('id'), requireReservationAccess, reservationController.getReservationById);
router.put('/:id/cancel', authenticateToken, validateObjectId('id'), requireReservationAccess, reservationController.cancelReservation);
router.put('/:id/checkin', authenticateToken, validateObjectId('id'), requireReservationAccess, reservationController.checkInReservation);

// Admin routes
router.get('/', authenticateToken, requireAdmin, validatePagination, validateDateRange, reservationController.getAllReservations);
router.put('/:id/status', authenticateToken, requireAdmin, validateObjectId('id'), reservationController.updateReservationStatus);

module.exports = router;
