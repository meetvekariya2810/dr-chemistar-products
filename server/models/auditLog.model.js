const mongoose = require('mongoose');

/**
 * Trail of every privileged action taken against farmer records.
 *
 * Farmer data is personal information held on behalf of people who never see
 * this system, so "who looked at it, and when" has to be answerable after the
 * fact. Views, edits, deletes and exports are all recorded.
 *
 * Deliberately stores no farmer contact details - only the record's ID - so the
 * audit trail itself cannot become a second copy of the database.
 */
const AuditLogSchema = new mongoose.Schema({
  admin_user: { type: String, required: true, trim: true, maxlength: 120 },
  admin_role: { type: String, default: '', trim: true, maxlength: 40 },
  action: { type: String, required: true, trim: true, maxlength: 80 },
  entity: { type: String, default: 'farmer', trim: true, maxlength: 40 },
  entity_id: { type: String, default: '', trim: true, maxlength: 64 },
  detail: { type: String, default: '', trim: true, maxlength: 500 },
  ip: { type: String, default: '', trim: true, maxlength: 64 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

AuditLogSchema.index({ created_at: -1 });
AuditLogSchema.index({ entity_id: 1 });

module.exports = mongoose.model('FarmerAuditLog', AuditLogSchema);
