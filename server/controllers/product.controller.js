const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, '../data/products.json');

const getLocalProducts = () => {
  const dir = path.dirname(productsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(productsFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveLocalProducts = (productsList) => {
  fs.writeFileSync(productsFilePath, JSON.stringify(productsList, null, 2), 'utf8');
};

// @desc    Seed products database
// @route   POST /api/products/seed
// @access  Public
exports.seedProducts = async (req, res, next) => {
  try {
    const products = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid products list' });
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

    if (global.isMongoConnected) {
      const count = await Product.countDocuments();
      if (count > 0) {
        return res.status(200).json({ message: 'Products already exist. Skipping seed.' });
      }
      await Product.insertMany(formatted);
    } else {
      const localProducts = getLocalProducts();
      if (localProducts.length > 0) {
        return res.status(200).json({ message: 'Products already exist. Skipping seed.' });
      }
      saveLocalProducts(formatted);
    }

    res.status(201).json({ message: `Successfully seeded ${products.length} products.` });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    if (global.isMongoConnected) {
      const products = await Product.find({}).sort({ name: 1 });
      res.status(200).json(products);
    } else {
      res.status(200).json(getLocalProducts().sort((a, b) => a.name.localeCompare(b.name)));
    }
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
    if (global.isMongoConnected) {
      const result = await Product.deleteOne({ id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
    } else {
      const productsList = getLocalProducts();
      const newProductsList = productsList.filter(p => p.id !== id);
      if (productsList.length === newProductsList.length) {
        return res.status(404).json({ error: 'Product not found' });
      }
      saveLocalProducts(newProductsList);
    }
    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
