const mongoose = require('mongoose');

const DealerRequestSchema = new mongoose.Schema({
  firm_name: { type: String, required: true },
  contact_person: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  gst_number: { type: String, required: true },
  license_number: { type: String, required: true },
  status: { type: String, default: 'Pending' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('DealerRequest', DealerRequestSchema);
