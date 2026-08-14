const { body, validationResult } = require('express-validator');
const { ENQUIRY_STATUSES } = require('../models/enquiry.model');
const {
  CITY_OR_VILLAGE,
  FARMER_STATUSES,
  TEXT_FIELDS: FARMER_TEXT_FIELDS,
  ARRAY_FIELDS: FARMER_ARRAY_FIELDS
} = require('../config/farmerFields');
const { isValidIndianMobile } = require('../utils/mobile');

/**
 * Shared terminator for every validator chain below.
 *
 * Returns both `errors` (the shape the existing frontend already parses) and a
 * plain `message`, so a caller that only reads `message` still gets something
 * readable instead of "Request failed with status 400".
 */
const collectErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map((e) => e.msg).join('. ') || 'Please complete all required fields.',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Terminator for the farmer chains, which power a multi-step form.
 *
 * Returns the failures keyed by field name so the form can mark the offending
 * input and jump the farmer back to the right step - an array of sentences
 * cannot say *which* box is wrong. `message` is still filled in, so any caller
 * that only reads that (including the shared apiRequest helper in src/api.ts,
 * which only unpacks `errors` when it is an array) keeps working.
 *
 * Only the first error per field is kept; showing a farmer two complaints about
 * one box at once is noise.
 */
const collectFieldErrors = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const fieldErrors = {};
  result.array().forEach((e) => {
    const key = e.path || e.param || '_form';
    if (!fieldErrors[key]) fieldErrors[key] = e.msg;
  });

  return res.status(400).json({
    success: false,
    message: 'Please correct the highlighted fields.',
    errors: fieldErrors
  });
};

exports.validateDealerRequest = [
  body('firm_name').trim().notEmpty().withMessage('Firm name is required'),
  body('contact_person').trim().notEmpty().withMessage('Contact person is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('gst_number').trim().notEmpty().withMessage('GST number is required'),
  body('license_number').trim().notEmpty().withMessage('License number is required'),
  collectErrors
];

/*
 * Deliberately NOT using express-validator's .escape() on the free-text fields.
 * These values are only ever rendered by React, which escapes on output, and
 * Mongo takes them as BSON values rather than as query text - so escaping buys
 * no safety here while it does corrupt real leads ("Ramesh's farm" would be
 * stored as "Ramesh&#x27;s farm" and shown that way to the admin). Length caps
 * and character-class checks are what actually keep junk out.
 */
exports.validateEnquiry = [
  body('name').trim().notEmpty().withMessage('Full name is required')
    .isLength({ max: 150 }).withMessage('Full name is too long'),
  // Permissive on format - farmers enter numbers as +91 98765 43210,
  // 098765-43210 or 9876543210. The digit count is what actually separates a
  // real number from junk.
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-()\s]{6,30}$/).withMessage('Phone number contains invalid characters')
    .custom((v) => {
      const digits = v.replace(/\D/g, '').length;
      return digits >= 7 && digits <= 15;
    })
    .withMessage('Please enter a valid phone number'),
  body('email').optional({ checkFalsy: true }).trim()
    .isLength({ max: 150 }).withMessage('Email is too long')
    .isEmail().withMessage('Valid email is required if provided'),
  body('user_type').trim().notEmpty().withMessage('Inquiry type is required')
    .isLength({ max: 100 }).withMessage('Inquiry type is too long'),
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ max: 5000 }).withMessage('Message must be under 5000 characters'),
  body('city').trim().notEmpty().withMessage('City / District is required')
    .isLength({ max: 100 }).withMessage('City name is too long'),
  collectErrors
];

exports.validateEnquiryStatus = [
  body('status').trim().notEmpty().withMessage('Status is required')
    .isIn(ENQUIRY_STATUSES).withMessage(`Status must be one of: ${ENQUIRY_STATUSES.join(', ')}`),
  collectErrors
];

exports.validateEnquiryUpdate = [
  body('status').optional().trim()
    .isIn(ENQUIRY_STATUSES).withMessage(`Status must be one of: ${ENQUIRY_STATUSES.join(', ')}`),
  body('admin_notes').optional({ nullable: true }).trim()
    .isLength({ max: 5000 }).withMessage('Notes must be under 5000 characters'),
  collectErrors
];

exports.validateAdminLogin = [
  body('username').trim().notEmpty().withMessage('Login ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
  collectErrors
];

/* -------------------------------------------------------------------------- */
/* Farmer registration                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Deliberately thin.
 *
 * The business rule is that a farmer must be able to register with almost
 * everything blank - name, mobile, somewhere to find them, and consent. Every
 * other field is checked only for length, so a half-filled form from a phone in
 * a field still succeeds. Anything longer than the schema allows is rejected
 * here rather than being silently truncated by Mongoose.
 */
exports.validateFarmer = [
  body('farmer_name').trim().notEmpty().withMessage('Farmer name is required')
    .isLength({ max: 150 }).withMessage('Farmer name is too long'),

  // Accepts every spelling a farmer might type (98765 43210, +91 98765-43210,
  // 098765 43210) and rejects what is genuinely not a mobile number - "abc",
  // a five-digit typo, or a 10-digit number starting 0-5. See utils/mobile.js.
  body('mobile').trim().notEmpty().withMessage('Mobile number is required')
    .custom(isValidIndianMobile)
    .withMessage('Please enter a valid 10-digit Indian mobile number'),

  body('alternate_mobile').optional({ checkFalsy: true }).trim()
    .custom(isValidIndianMobile)
    .withMessage('Please enter a valid alternate mobile number, or leave it blank'),

  body('email').optional({ checkFalsy: true }).trim()
    .isLength({ max: 150 }).withMessage('Email is too long')
    .isEmail().withMessage('Please enter a valid email address, or leave it blank'),

  body('pincode').optional({ checkFalsy: true }).trim()
    .matches(/^[1-9][0-9]{5}$/).withMessage('PIN code should be 6 digits'),

  body('age').optional({ checkFalsy: true }).trim()
    .isInt({ min: 10, max: 120 }).withMessage('Please enter an age between 10 and 120'),

  // Land areas are typed as plain numbers. Negative is meaningless and an
  // absurd figure is a typo, but the range stays wide - large holdings exist.
  body('farm_area').optional({ checkFalsy: true }).trim()
    .isFloat({ min: 0, max: 100000 }).withMessage('Farm area must be a positive number'),

  body('crop_area').optional({ checkFalsy: true }).trim()
    .isFloat({ min: 0, max: 100000 }).withMessage('Crop area must be a positive number'),

  // Either one is enough - a farmer who only knows their village must not be
  // blocked by a "City is required" error. Which fields satisfy this comes from
  // CITY_OR_VILLAGE so the rule lives in one place. Reported against `city` so
  // the form has a concrete field to highlight.
  body('city').custom((value, { req }) => {
    const filled = CITY_OR_VILLAGE.some((field) => String(req.body?.[field] || '').trim());
    if (!filled) throw new Error('Please enter your village or city');
    return true;
  }),

  /*
   * Multi-select fields arrive as arrays of strings. Accepting whatever JSON was
   * posted would let `{"other_crops":[{"$ne":null}]}` put an object into the
   * document, so each entry has to be a string of sane length; a bare string is
   * tolerated and wrapped by the controller.
   */
  ...FARMER_ARRAY_FIELDS.map((field) =>
    body(field).optional({ nullable: true }).custom((value) => {
      const items = Array.isArray(value) ? value : [value];
      if (items.length > 50) throw new Error(`Too many ${field.replace(/_/g, ' ')} selected`);
      items.forEach((item) => {
        if (typeof item !== 'string') throw new Error(`${field.replace(/_/g, ' ')} must be a list of text values`);
        if (item.length > 120) throw new Error(`One of the ${field.replace(/_/g, ' ')} entries is too long`);
      });
      return true;
    })
  ),

  // Without consent there is no lawful basis to keep the record at all, so this
  // is the one non-contact field that is genuinely mandatory.
  body('consent').custom((value) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    throw new Error('Please tick the consent box so we may store your details');
  }),

  // Everything else is free text and only needs a length cap. Fields with a
  // rule of their own above are skipped so a bad age reports "enter an age
  // between 10 and 120" rather than that plus a redundant length complaint.
  ...FARMER_TEXT_FIELDS
    .filter((f) => ![
      'farmer_name', 'mobile', 'alternate_mobile', 'email',
      'pincode', 'age', 'farm_area', 'crop_area'
    ].includes(f))
    .map((field) =>
      body(field).optional({ nullable: true }).trim()
        .isLength({ max: field === 'message' ? 5000 : 150 })
        .withMessage(`${field.replace(/_/g, ' ')} is too long`)
    ),

  collectFieldErrors
];

exports.validateFarmerUpdate = [
  body('status').optional().trim()
    .isIn(FARMER_STATUSES).withMessage(`Status must be one of: ${FARMER_STATUSES.join(', ')}`),
  body('admin_notes').optional({ nullable: true }).trim()
    .isLength({ max: 5000 }).withMessage('Notes must be under 5000 characters'),
  body('farmer_name').optional().trim().notEmpty().withMessage('Farmer name cannot be blank')
    .isLength({ max: 150 }).withMessage('Farmer name is too long'),
  body('mobile').optional().trim().notEmpty().withMessage('Mobile cannot be blank')
    .isLength({ max: 20 }).withMessage('Mobile is too long'),
  body('email').optional({ checkFalsy: true }).trim()
    .isEmail().withMessage('Please enter a valid email address, or leave it blank'),
  collectFieldErrors
];
