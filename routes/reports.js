const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

// Admin-only routes for reports
router.get('/revenue', authenticateToken, requireAdmin, validateDateRange, reportController.getRevenueReport);
router.get('/popular-movies', authenticateToken, requireAdmin, validateDateRange, reportController.getPopularMoviesReport);
router.get('/theater-performance', authenticateToken, requireAdmin, validateDateRange, reportController.getTheaterPerformanceReport);
router.get('/user-demographics', authenticateToken, requireAdmin, reportController.getUserDemographicsReport);
router.get('/reservation-status', authenticateToken, requireAdmin, validateDateRange, reportController.getReservationStatusReport);
router.get('/dashboard', authenticateToken, requireAdmin, reportController.getDashboardAnalytics);

module.exports = router;
