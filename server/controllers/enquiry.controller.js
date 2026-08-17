const mongoose = require('mongoose');
const ProductEnquiry = require('../models/enquiry.model');
const { ENQUIRY_STATUSES } = require('../models/enquiry.model');
const fs = require('fs');
const path = require('path');

const enquiriesFilePath = path.join(__dirname, '../data/enquiries.json');

/* -------------------------------------------------------------------------- */
/* Local JSON fallback store                                                   */
/* -------------------------------------------------------------------------- */
/*
 * Used only when MongoDB is unreachable at boot (see config/db.js). It mirrors
 * every Mongo operation so an admin never sees a half-working panel: if reads
 * come from the JSON file, writes must land there too.
 */

const getLocalEnquiries = () => {
  const dir = path.dirname(enquiriesFilePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    /* read-only serverless environment */
  }
  if (fs.existsSync(enquiriesFilePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(enquiriesFilePath, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const writeLocalEnquiries = (enquiries) => {
  fs.writeFileSync(enquiriesFilePath, JSON.stringify(enquiries, null, 2), 'utf8');
};

const saveLocalEnquiry = (enquiry) => {
  const enquiries = getLocalEnquiries();
  const now = new Date().toISOString();
  enquiry.id = 'enq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  enquiry.created_at = now;
  enquiry.updated_at = now;
  enquiries.push(enquiry);
  writeLocalEnquiries(enquiries);
  return enquiry;
};

const updateLocalEnquiry = (id, changes) => {
  const enquiries = getLocalEnquiries();
  const index = enquiries.findIndex((e) => String(e.id) === String(id));
  if (index === -1) return null;
  enquiries[index] = { ...enquiries[index], ...changes, updated_at: new Date().toISOString() };
  writeLocalEnquiries(enquiries);
  return enquiries[index];
};

const deleteLocalEnquiry = (id) => {
  const enquiries = getLocalEnquiries();
  const index = enquiries.findIndex((e) => String(e.id) === String(id));
  if (index === -1) return null;
  const [removed] = enquiries.splice(index, 1);
  writeLocalEnquiries(enquiries);
  return removed;
};

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * One record shape for the admin CMS regardless of which store it came from.
 *
 * Mongo hands back `_id` while the JSON store uses a string `id`, and rows
 * written before the status/notes fields existed have neither - normalising
 * here keeps every one of those cases out of the React table.
 */
const toApiShape = (doc) => {
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(raw._id || raw.id),
    name: raw.name || '',
    phone: raw.phone || '',
    email: raw.email || '',
    city: raw.city || '',
    user_type: raw.user_type || '',
    message: raw.message || '',
    status: ENQUIRY_STATUSES.includes(raw.status) ? raw.status : 'New',
    admin_notes: raw.admin_notes || '',
    created_at: raw.created_at || null,
    updated_at: raw.updated_at || raw.created_at || null
  };
};

/** Dashboard counters, derived from the records themselves - never hardcoded. */
const buildStats = (records) => {
  const stats = { total: records.length };
  ENQUIRY_STATUSES.forEach((s) => { stats[s] = 0; });
  records.forEach((r) => {
    if (stats[r.status] !== undefined) stats[r.status] += 1;
  });
  return stats;
};

/**
 * A malformed id must read as "no such enquiry", not as a 500. Mongo throws a
 * CastError for anything that is not a 24-char ObjectId, so reject those before
 * they reach the driver.
 */
const isValidMongoId = (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

const notFound = (res) => res.status(404).json({ success: false, message: 'Enquiry not found.' });

/* -------------------------------------------------------------------------- */
/* Public                                                                      */
/* -------------------------------------------------------------------------- */

// @desc    Create a new enquiry
// @route   POST /api/enquiries
// @access  Public
exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, phone, email, user_type, message, city } = req.body;

    const payload = {
      name,
      phone,
      email: email || '',
      user_type,
      message,
      city,
      status: 'New',
      admin_notes: ''
    };

    let saved;
    if (global.isMongoConnected) {
      saved = toApiShape(await new ProductEnquiry(payload).save());
    } else {
      saved = toApiShape(saveLocalEnquiry(payload));
    }

    // Lead-capture is the site's primary conversion path, so record where each
    // one landed. Contact details are deliberately left out of the log.
    console.log(
      `[enquiry] stored in ${global.isMongoConnected ? 'MongoDB' : 'local JSON store'} ` +
        `(id=${saved.id}, user_type=${saved.user_type}, city=${saved.city})`
    );

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully.',
      id: saved.id,
      enquiry: saved
    });
  } catch (err) {
    next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* Admin only (see middleware/adminAuth.js)                                    */
/* -------------------------------------------------------------------------- */

// @desc    Get every enquiry, newest first, with dashboard counters
// @route   GET /api/enquiries
// @access  Admin
exports.getEnquiries = async (req, res, next) => {
  try {
    let records;
    if (global.isMongoConnected) {
      const docs = await ProductEnquiry.find({}).sort({ created_at: -1 });
      records = docs.map(toApiShape);
    } else {
      records = getLocalEnquiries()
        .map(toApiShape)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    res.status(200).json({
      success: true,
      source: global.isMongoConnected ? 'mongodb' : 'local-json',
      stats: buildStats(records),
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an enquiry's status
// @route   PATCH /api/enquiries/:id/status
// @access  Admin
exports.updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (global.isMongoConnected) {
      if (!isValidMongoId(id)) return notFound(res);
      const doc = await ProductEnquiry.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
      if (!doc) return notFound(res);
      return res.status(200).json({ success: true, message: `Status updated to ${status}.`, enquiry: toApiShape(doc) });
    }

    const updated = updateLocalEnquiry(id, { status });
    if (!updated) return notFound(res);
    res.status(200).json({ success: true, message: `Status updated to ${status}.`, enquiry: toApiShape(updated) });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an enquiry's status and/or internal notes
// @route   PATCH /api/enquiries/:id
// @access  Admin
exports.updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only these two fields are admin-editable. The submitted contact details
    // are the customer's record of what they sent and stay immutable.
    const changes = {};
    if (req.body.status !== undefined) changes.status = req.body.status;
    if (req.body.admin_notes !== undefined) changes.admin_notes = req.body.admin_notes;

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update. Provide status or admin_notes.' });
    }

    if (global.isMongoConnected) {
      if (!isValidMongoId(id)) return notFound(res);
      const doc = await ProductEnquiry.findByIdAndUpdate(id, changes, { new: true, runValidators: true });
      if (!doc) return notFound(res);
      return res.status(200).json({ success: true, message: 'Enquiry updated.', enquiry: toApiShape(doc) });
    }

    const updated = updateLocalEnquiry(id, changes);
    if (!updated) return notFound(res);
    res.status(200).json({ success: true, message: 'Enquiry updated.', enquiry: toApiShape(updated) });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete an enquiry
// @route   DELETE /api/enquiries/:id
// @access  Admin
exports.deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (global.isMongoConnected) {
      if (!isValidMongoId(id)) return notFound(res);
      const doc = await ProductEnquiry.findByIdAndDelete(id);
      if (!doc) return notFound(res);
      console.log(`[enquiry] deleted id=${id} from MongoDB`);
      return res.status(200).json({ success: true, message: 'Enquiry deleted.', id });
    }

    const removed = deleteLocalEnquiry(id);
    if (!removed) return notFound(res);
    console.log(`[enquiry] deleted id=${id} from local JSON store`);
    res.status(200).json({ success: true, message: 'Enquiry deleted.', id });
  } catch (err) {
    next(err);
  }
};
