const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const adminAuth = require('../middleware/adminAuth');
const { validateAdminLogin } = require('../validators/validators');

/**
 * Login is the one endpoint where an attacker can guess indefinitely, so it gets
 * a far tighter budget than the 200-per-15-minutes the rest of /api shares.
 * Successful sign-ins are not counted, so a legitimate admin who signs in each
 * morning never burns through the allowance.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' }
});

router.post('/admin/login', loginLimiter, validateAdminLogin, authController.adminLogin);
router.get('/admin/me', adminAuth, authController.adminMe);

module.exports = router;
