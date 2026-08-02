const ProductEnquiry = require('../models/enquiry.model');

// @desc    Create a new enquiry
// @route   POST /api/enquiries
// @access  Public
exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, phone, user_type, message, city } = req.body;
    const newEnquiry = new ProductEnquiry({
      name,
      phone,
      user_type,
      message,
      city
    });

    await newEnquiry.save();
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
    const enquiries = await ProductEnquiry.find({}).sort({ created_at: -1 });
    res.status(200).json(enquiries);
  } catch (err) {
    next(err);
  }
};
