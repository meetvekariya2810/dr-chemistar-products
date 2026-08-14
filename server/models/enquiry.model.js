const mongoose = require('mongoose');

/**
 * Lifecycle an enquiry moves through in the admin CMS. Kept here so the
 * validators, the controller and the JSON fallback store all agree on the
 * spelling - a typo'd status would silently break the admin filters.
 */
const ENQUIRY_STATUSES = ['New', 'Contacted', 'In Progress', 'Resolved', 'Closed'];

const ProductEnquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  email: { type: String, required: false, trim: true, maxlength: 150, default: '' },
  user_type: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  status: { type: String, enum: ENQUIRY_STATUSES, default: 'New' },
  admin_notes: { type: String, default: '', maxlength: 5000 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// The admin list is always "newest first", and the dashboard counts group by
// status, so both reads are index-backed.
ProductEnquirySchema.index({ created_at: -1 });
ProductEnquirySchema.index({ status: 1 });

const ProductEnquiry = mongoose.model('ProductEnquiry', ProductEnquirySchema);

module.exports = ProductEnquiry;
module.exports.ENQUIRY_STATUSES = ENQUIRY_STATUSES;
