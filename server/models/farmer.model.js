const mongoose = require('mongoose');
const { FARMER_STATUSES } = require('../config/farmerFields');

/**
 * A farmer registration submitted from the public /farmer page.
 *
 * Only `farmer_name`, `mobile` and one of city/village are enforced - see
 * config/farmerFields.js for why. Every other field is optional with an empty
 * default so a sparse submission still produces a complete, exportable record
 * instead of a document full of `undefined`.
 *
 * `farmer_id` is the human-facing registration number (FMR-2026-000123) shown to
 * the farmer and used by staff on the phone; `_id` remains the internal key.
 */
const FarmerSchema = new mongoose.Schema({
  farmer_id: { type: String, required: true, unique: true, trim: true, maxlength: 32 },

  // Section 1 - basic information
  farmer_name: { type: String, required: true, trim: true, maxlength: 150 },
  mobile: { type: String, required: true, trim: true, maxlength: 20 },
  alternate_mobile: { type: String, default: '', trim: true, maxlength: 20 },
  email: { type: String, default: '', trim: true, maxlength: 150 },
  gender: { type: String, default: '', trim: true, maxlength: 20 },
  age: { type: String, default: '', trim: true, maxlength: 10 },

  // Section 2 - location
  village: { type: String, default: '', trim: true, maxlength: 120 },
  city: { type: String, default: '', trim: true, maxlength: 120 },
  district: { type: String, default: '', trim: true, maxlength: 120 },
  state: { type: String, default: '', trim: true, maxlength: 120 },
  pincode: { type: String, default: '', trim: true, maxlength: 10 },

  // Section 3 - farm details
  farm_area: { type: String, default: '', trim: true, maxlength: 30 },
  land_unit: { type: String, default: '', trim: true, maxlength: 30 },
  irrigation: { type: String, default: '', trim: true, maxlength: 60 },
  soil_type: { type: String, default: '', trim: true, maxlength: 60 },

  // Section 4 - crops
  main_crop: { type: String, default: '', trim: true, maxlength: 120 },
  other_crops: { type: [String], default: [] },

  // Section 5 - farming information
  current_season: { type: String, default: '', trim: true, maxlength: 60 },
  crop_area: { type: String, default: '', trim: true, maxlength: 30 },
  farming_experience: { type: String, default: '', trim: true, maxlength: 60 },
  farming_type: { type: String, default: '', trim: true, maxlength: 40 },

  // Section 6 - requirement
  interests: { type: [String], default: [] },
  message: { type: String, default: '', trim: true, maxlength: 5000 },

  // Consent is a hard requirement: without it we have no basis to hold the record.
  consent: { type: Boolean, required: true },

  // Internal, never returned to the public endpoint.
  status: { type: String, enum: FARMER_STATUSES, default: 'New' },
  admin_notes: { type: String, default: '', maxlength: 5000 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// The admin list is always newest-first; the dashboard groups by district, crop
// and status; the duplicate check and the search both look up by mobile.
FarmerSchema.index({ created_at: -1 });
FarmerSchema.index({ mobile: 1, created_at: -1 });
FarmerSchema.index({ status: 1 });
FarmerSchema.index({ district: 1 });
FarmerSchema.index({ main_crop: 1 });

const Farmer = mongoose.model('Farmer', FarmerSchema);

module.exports = Farmer;
