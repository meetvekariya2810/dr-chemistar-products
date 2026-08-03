const mongoose = require('mongoose');

const ProductEnquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: false },
  user_type: { type: String, required: true },
  message: { type: String, required: true },
  city: { type: String, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('ProductEnquiry', ProductEnquirySchema);
