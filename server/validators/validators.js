const { body, validationResult } = require('express-validator');

exports.validateDealerRequest = [
  body('firm_name').trim().notEmpty().withMessage('Firm name is required'),
  body('contact_person').trim().notEmpty().withMessage('Contact person is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('gst_number').trim().notEmpty().withMessage('GST number is required'),
  body('license_number').trim().notEmpty().withMessage('License number is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateEnquiry = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Valid email is required if provided'),
  body('user_type').trim().notEmpty().withMessage('User type is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
