const Product = require('../models/product.model');

// @desc    Seed products database
// @route   POST /api/products/seed
// @access  Public
exports.seedProducts = async (req, res, next) => {
  try {
    const products = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid products list' });
    }

    const count = await Product.countDocuments();
    if (count > 0) {
      return res.status(200).json({ message: 'Products already exist. Skipping seed.' });
    }

    const formatted = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      commonName: p.commonName || '',
      activeIngredient: p.activeIngredient || '',
      formulation: p.formulation || '',
      dose: p.dose || '',
      packing: p.packing || [],
      targetPest: p.targetPest || [],
      targetDisease: p.targetDisease || [],
      targetCrops: p.targetCrops || [],
      modeOfAction: p.modeOfAction || '',
      benefits: p.benefits || [],
      safetyInstructions: p.safetyInstructions || '',
      storageInstructions: p.storageInstructions || '',
      badge: p.badge || '',
      imageColor: p.imageColor || '',
      popular: Boolean(p.popular),
      pdfPage: p.pdfPage || null
    }));

    await Product.insertMany(formatted);
    res.status(201).json({ message: `Successfully seeded ${products.length} products to MongoDB.` });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ name: 1 });
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Public
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Product.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
