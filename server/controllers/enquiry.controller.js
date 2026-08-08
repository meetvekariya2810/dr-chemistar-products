const ProductEnquiry = require('../models/enquiry.model');
const fs = require('fs');
const path = require('path');

const enquiriesFilePath = path.join(__dirname, '../data/enquiries.json');

const getLocalEnquiries = () => {
  const dir = path.dirname(enquiriesFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(enquiriesFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(enquiriesFilePath, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveLocalEnquiry = (enquiry) => {
  const enquiries = getLocalEnquiries();
  enquiry.id = 'enq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  enquiry.created_at = new Date().toISOString();
  enquiries.push(enquiry);
  fs.writeFileSync(enquiriesFilePath, JSON.stringify(enquiries, null, 2), 'utf8');
  return enquiry;
};

// @desc    Create a new enquiry
// @route   POST /api/enquiries
// @access  Public
exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, phone, email, user_type, message, city } = req.body;

    if (global.isMongoConnected) {
      const newEnquiry = new ProductEnquiry({
        name,
        phone,
        email,
        user_type,
        message,
        city
      });
      await newEnquiry.save();
    } else {
      saveLocalEnquiry({
        name,
        phone,
        email,
        user_type,
        message,
        city
      });
    }

    // Lead-capture is the site's primary conversion path, so record where each
    // one landed. Contact details are deliberately left out of the log.
    console.log(
      `[enquiry] stored in ${global.isMongoConnected ? 'MongoDB' : 'local JSON store'} ` +
        `(user_type=${user_type}, city=${city})`
    );

    res.status(201).json({ message: 'Enquiry saved successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Public
exports.getEnquiries = async (req, res, next) => {
  try {
    if (global.isMongoConnected) {
      const enquiries = await ProductEnquiry.find({}).sort({ created_at: -1 });
      res.status(200).json(enquiries);
    } else {
      const enquiries = getLocalEnquiries().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      res.status(200).json(enquiries);
    }
  } catch (err) {
    next(err);
  }
};
