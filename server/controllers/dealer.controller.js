const DealerRequest = require('../models/dealer.model');

// @desc    Create a new dealer application
// @route   POST /api/dealers
// @access  Public
exports.createDealer = async (req, res, next) => {
  try {
    const {
      firm_name,
      contact_person,
      phone,
      email,
      city,
      state,
      gst_number,
      license_number
    } = req.body;

    const newDealer = new DealerRequest({
      firm_name,
      contact_person,
      phone,
      email,
      city,
      state,
      gst_number,
      license_number,
      status: 'Pending'
    });

    await newDealer.save();
    res.status(201).json({ message: 'Dealer application saved successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all dealer requests
// @route   GET /api/dealers
// @access  Public
exports.getDealers = async (req, res, next) => {
  try {
    const dealers = await DealerRequest.find({}).sort({ created_at: -1 });
    res.status(200).json(dealers);
  } catch (err) {
    next(err);
  }
};

// @desc    Approve a dealer request
// @route   PUT /api/dealers/:id/approve
// @access  Public
exports.approveDealer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dealer = await DealerRequest.findByIdAndUpdate(id, { status: 'Approved' }, { new: true });
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer request not found' });
    }
    res.status(200).json({ message: 'Dealer application approved.', dealer });
  } catch (err) {
    next(err);
  }
};
