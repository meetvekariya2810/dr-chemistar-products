const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiry.controller');
const { validateEnquiry } = require('../validators/validators');

router.post('/', validateEnquiry, enquiryController.createEnquiry);
router.get('/', enquiryController.getEnquiries);

module.exports = router;
