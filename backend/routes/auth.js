const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration
router.post('/register', (req, res) => authController.register(req, res));

// Login
router.post('/login', (req, res) => authController.login(req, res));

// Logout
router.post('/logout', (req, res) => authController.logout(req, res));

// Forgot password
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));

// Reset password
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

// Verify token helper
router.get('/verify', (req, res) => authController.verifyToken(req, res));

module.exports = router;
