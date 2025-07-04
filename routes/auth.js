const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserUpdate,
  validateObjectId 
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, validateUserUpdate, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.put('/deactivate', authenticateToken, authController.deactivateAccount);

// Admin routes
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);
router.put('/users/:userId/role', 
  authenticateToken, 
  requireAdmin, 
  validateObjectId('userId'), 
  authController.updateUserRole
);

module.exports = router;
