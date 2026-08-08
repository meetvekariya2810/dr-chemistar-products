const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  commonName: { type: String, default: '' },
  activeIngredient: { type: String, default: '' },
  formulation: { type: String, default: '' },
  dose: { type: String, default: '' },
  packing: { type: [String], default: [] },
  targetPest: { type: [String], default: [] },
  targetDisease: { type: [String], default: [] },
  targetCrops: { type: [String], default: [] },
  modeOfAction: { type: String, default: '' },
  benefits: { type: [String], default: [] },
  safetyInstructions: { type: String, default: '' },
  storageInstructions: { type: String, default: '' },
  badge: { type: String, default: '' },
  imageColor: { type: String, default: '' },
  popular: { type: Boolean, default: false },
  pdfPage: { type: Number, default: null },
  image: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  thumbnail: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
