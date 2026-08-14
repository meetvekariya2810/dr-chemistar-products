const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const enquiryController = require('../controllers/enquiry.controller');
const adminAuth = require('../middleware/adminAuth');
const {
  validateEnquiry,
  validateEnquiryStatus,
  validateEnquiryUpdate
} = require('../validators/validators');

/**
 * Submission is open to the public, so it gets its own tighter budget than the
 * app-wide 200/15min limiter: a real visitor sends one enquiry, not twenty.
 * Reads and writes from the CMS are unaffected - only POST is limited.
 */
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many enquiries sent from this connection. Please try again in a few minutes, or reach us on WhatsApp.'
  }
});

// Public
router.post('/', submitLimiter, validateEnquiry, enquiryController.createEnquiry);

// Admin only - these expose customers' names, phone numbers and emails.
router.get('/', adminAuth, enquiryController.getEnquiries);
router.patch('/:id/status', adminAuth, validateEnquiryStatus, enquiryController.updateEnquiryStatus);
router.patch('/:id', adminAuth, validateEnquiryUpdate, enquiryController.updateEnquiry);
router.delete('/:id', adminAuth, enquiryController.deleteEnquiry);

module.exports = router;
