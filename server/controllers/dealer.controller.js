const DealerRequest = require('../models/dealer.model');
const fs = require('fs');
const path = require('path');

const dealersFilePath = path.join(__dirname, '../data/dealers.json');

const getLocalDealers = () => {
  const dir = path.dirname(dealersFilePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    /* read-only serverless environment */
  }
  if (fs.existsSync(dealersFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(dealersFilePath, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveLocalDealer = (dealer) => {
  const dealers = getLocalDealers();
  dealer.id = 'dlr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  dealer.created_at = new Date().toISOString();
  dealers.push(dealer);
  fs.writeFileSync(dealersFilePath, JSON.stringify(dealers, null, 2), 'utf8');
  return dealer;
};

const updateLocalDealerStatus = (id, status) => {
  const dealers = getLocalDealers();
  const index = dealers.findIndex(d => d.id === id);
  if (index !== -1) {
    dealers[index].status = status;
    fs.writeFileSync(dealersFilePath, JSON.stringify(dealers, null, 2), 'utf8');
    return dealers[index];
  }
  return null;
};

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

    if (global.isMongoConnected) {
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
    } else {
      saveLocalDealer({
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
    }

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
    if (global.isMongoConnected) {
      const dealers = await DealerRequest.find({}).sort({ created_at: -1 });
      res.status(200).json(dealers);
    } else {
      const dealers = getLocalDealers().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      res.status(200).json(dealers);
    }
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
    if (global.isMongoConnected) {
      const dealer = await DealerRequest.findByIdAndUpdate(id, { status: 'Approved' }, { new: true });
      if (!dealer) {
        return res.status(404).json({ error: 'Dealer request not found' });
      }
      res.status(200).json({ message: 'Dealer application approved.', dealer });
    } else {
      const dealer = updateLocalDealerStatus(id, 'Approved');
      if (!dealer) {
        return res.status(404).json({ error: 'Dealer request not found' });
      }
      res.status(200).json({ message: 'Dealer application approved.', dealer });
    }
  } catch (err) {
    next(err);
  }
};
