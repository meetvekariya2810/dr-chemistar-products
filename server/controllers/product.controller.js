const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const {
  withImagePaths,
  withVerifiedImagePaths,
  getAvailableImageIds,
  invalidateImageAvailability
} = require('../utils/productImages');

const productsFilePath = path.join(__dirname, '../data/products.json');
// Shared with the frontend build - see server/utils/productImages.js
const uploadsDir = path.join(__dirname, '../../public/uploads');
const tempDir = path.join(__dirname, '../../public/uploads/temp');

// Ensure upload directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(path.join(uploadsDir, 'thumbnails'))) {
  fs.mkdirSync(path.join(uploadsDir, 'thumbnails'), { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

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

    // The frontend seeds from src/data/productsData.ts, which carries no image
    // fields. Backfill them from disk here so a freshly seeded database is not
    // left imageless while the artwork sits in uploads/.
    const formatted = products.map(withImagePaths).map(p => ({
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
      pdfPage: p.pdfPage || null,
      image: p.image || '',
      imageUrl: p.imageUrl || '',
      thumbnail: p.thumbnail || ''
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
    // Products carry their image path declaratively, so verify against disk
    // before publishing it - a path whose file has not been supplied yet must
    // reach the frontend blank, not as a URL that would 404.
    const available = getAvailableImageIds();

    if (global.isMongoConnected) {
      const products = await Product.find({}).sort({ name: 1 });
      res.status(200).json(products.map(p => withVerifiedImagePaths(p, available)));
    } else {
      const products = getLocalProducts().sort((a, b) => a.name.localeCompare(b.name));
      res.status(200).json(products.map(p => withVerifiedImagePaths(p, available)));
    }
  } catch (err) {
    next(err);
  }
};

const PRODUCT_CATEGORIES = ['Insecticide', 'Fungicide', 'Herbicide', 'PGR', 'Fertilizer'];

/** "NUTRI POWER 12:32:16" -> "nutri-power-12-32-16" */
const slugify = (value) => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/**
 * List fields arrive from the admin form as one form-data string. Accept a JSON
 * array, or a comma/newline separated list, so the endpoint is equally usable
 * from the panel and from a hand-written API call.
 */
const parseList = (value) => {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (value === undefined || value === null) return [];

  const raw = String(value).trim();
  if (!raw) return [];

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
    } catch (e) {
      // Not JSON after all - fall through to delimiter splitting.
    }
  }

  return raw.split(/[\n,]/).map(v => v.trim()).filter(Boolean);
};

/**
 * Reserve an id that is not already taken: "roket", then "roket-2", "roket-3".
 * baseId is always slugified first, so it is safe to embed in the RegExp.
 */
const reserveProductId = async (baseId) => {
  const taken = new Set();

  if (global.isMongoConnected) {
    const docs = await Product.find({ id: new RegExp(`^${baseId}(-\\d+)?$`) }).select('id');
    docs.forEach(d => taken.add(d.id));
  } else {
    getLocalProducts().forEach(p => {
      if (p.id === baseId || String(p.id).startsWith(`${baseId}-`)) taken.add(p.id);
    });
  }

  if (!taken.has(baseId)) return baseId;

  let suffix = 2;
  while (taken.has(`${baseId}-${suffix}`)) suffix++;
  return `${baseId}-${suffix}`;
};

/** True when a product with this exact name (case-insensitive) already exists. */
const productNameExists = async (name) => {
  const needle = name.trim().toLowerCase();
  if (global.isMongoConnected) {
    const existing = await Product.findOne({
      name: new RegExp(`^${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    }).select('id');
    return Boolean(existing);
  }
  return getLocalProducts().some(p => String(p.name).trim().toLowerCase() === needle);
};

// @desc    Create a single product, optionally with its artwork
// @route   POST /api/products
// @access  Public
exports.createProduct = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const category = String(req.body.category || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (!PRODUCT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Product type must be one of: ${PRODUCT_CATEGORIES.join(', ')}`
      });
    }

    // A repeat submit is far more likely than a genuine same-name product, so
    // reject the collision rather than quietly creating a near-duplicate entry.
    if (await productNameExists(name)) {
      return res.status(409).json({ error: `A product named "${name}" already exists` });
    }

    const baseId = slugify(req.body.id || name);
    if (!baseId) {
      return res.status(400).json({ error: 'Product name must contain at least one letter or number' });
    }
    const id = await reserveProductId(baseId);

    const product = {
      id,
      name,
      category,
      commonName: String(req.body.commonName || '').trim(),
      activeIngredient: String(req.body.activeIngredient || '').trim(),
      formulation: String(req.body.formulation || '').trim(),
      dose: String(req.body.dose || '').trim(),
      packing: parseList(req.body.packing),
      targetPest: parseList(req.body.targetPest),
      targetDisease: parseList(req.body.targetDisease),
      targetCrops: parseList(req.body.targetCrops),
      modeOfAction: String(req.body.modeOfAction || '').trim(),
      benefits: parseList(req.body.benefits),
      safetyInstructions: String(req.body.safetyInstructions || '').trim(),
      storageInstructions: String(req.body.storageInstructions || '').trim(),
      badge: String(req.body.badge || '').trim(),
      imageColor: String(req.body.imageColor || '').trim(),
      popular: req.body.popular === 'true' || req.body.popular === true,
      pdfPage: null,
      image: '',
      imageUrl: '',
      thumbnail: ''
    };

    // Artwork follows the same `<id>.webp` convention and the same 500/150
    // contain-on-white treatment the ZIP importer uses, so a photo added here is
    // indistinguishable from a bulk-imported one.
    if (req.file) {
      const filename = `${id}.webp`;

      try {
        await sharp(req.file.buffer)
          .resize(500, 500, { fit: 'contain', background: '#ffffff' })
          .toFormat('webp')
          .toFile(path.join(uploadsDir, filename));

        await sharp(req.file.buffer)
          .resize(150, 150, { fit: 'contain', background: '#ffffff' })
          .toFormat('webp')
          .toFile(path.join(uploadsDir, 'thumbnails', filename));
      } catch (imageErr) {
        // sharp is the real gate on whether this is an image, so a decode
        // failure is a bad upload (400), not a server fault (500). Nothing has
        // been written to the database yet, so there is nothing to roll back.
        return res.status(400).json({
          error: 'That file could not be read as an image. Please upload a valid JPG, PNG or WebP photo.'
        });
      }

      product.image = filename;
      product.imageUrl = `/uploads/${filename}`;
      product.thumbnail = `/uploads/thumbnails/${filename}`;

      // Without this the availability cache would report the brand new image as
      // absent for up to 30s and the product would come back imageless.
      invalidateImageAvailability();
    }

    if (global.isMongoConnected) {
      await Product.create(product);
    } else {
      const productsList = getLocalProducts();
      productsList.push(product);
      saveLocalProducts(productsList);
    }

    console.log(
      `[product] created ${id} (${category}) ` +
        `${req.file ? 'with artwork' : 'without artwork'} in ` +
        `${global.isMongoConnected ? 'MongoDB' : 'local JSON store'}`
    );

    res.status(201).json({ message: 'Product added successfully.', product });
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

// --- HELPER FUNCTIONS FOR MATCHING ---

function normalizeName(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Edit Distance (Levenshtein)
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

// Similarity Score (0.0 to 1.0)
function getSimilarity(s1, s2) {
  const longer = s1.length >= s2.length ? s1 : s2;
  const shorter = s1.length < s2.length ? s1 : s2;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

// Search for a word in string with fuzzy matching
function containsFuzzyWord(text, word, threshold = 0.8) {
  const normText = normalizeName(text);
  const normWord = normalizeName(word);
  if (normText.includes(normWord)) return true;
  
  // Slide a window of word's length across the text and check similarity
  const len = normWord.length;
  if (len < 4) return false; // Too short for fuzzy matching
  
  for (let i = 0; i <= normText.length - len; i++) {
    const sub = normText.slice(i, i + len);
    if (getSimilarity(sub, normWord) >= threshold) {
      return true;
    }
  }
  return false;
}


// --- NEW CONTROLLERS ---

// @desc    Upload product images ZIP and automatically map
// @route   POST /api/products/upload-zip
// @access  Public
exports.uploadZip = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a ZIP file' });
    }

    const replaceExisting = req.body.replaceExisting === 'true';
    const zipPath = req.file.path;

    // Load products from DB/JSON
    let products = [];
    if (global.isMongoConnected) {
      products = await Product.find({});
    } else {
      products = getLocalProducts();
    }

    // Extract ZIP
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    const extractionPath = path.join(tempDir, `extract_${Date.now()}`);
    fs.mkdirSync(extractionPath, { recursive: true });
    
    // Save all entries temporarily
    const imagesToProcess = [];
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const filename = path.basename(entry.entryName);
      if (filename.startsWith('.') || filename.startsWith('__MACOSX')) continue;
      
      const ext = path.extname(filename).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

      const tempFilePath = path.join(extractionPath, filename);
      fs.writeFileSync(tempFilePath, entry.getData());
      imagesToProcess.push({
        filename,
        path: tempFilePath,
        ext
      });
    }

    // Statistics Tracker
    const totalProductsCount = products.length;
    const matchedProducts = [];
    const missingProducts = [];
    const duplicateImages = [];
    const unusedImages = [];
    const processedProductIds = new Set();
    const productMatchesMap = new Map(); // productId -> image filename

    // Step 1: Pre-process product list with normalized names
    const productsNormalized = products.map(p => {
      // Strip out anything in parentheses for matching common names (e.g. NPK 19:19:19 (SOP) -> NPK 19:19:19)
      const cleanCommon = p.commonName ? p.commonName.replace(/\s*\([^)]*\)/g, '') : '';
      const cleanActive = p.activeIngredient ? p.activeIngredient.replace(/\s*\([^)]*\)/g, '') : '';
      
      return {
        product: p,
        normName: normalizeName(p.name),
        normCommonName: normalizeName(p.commonName),
        normCleanCommon: normalizeName(cleanCommon),
        normCleanActive: normalizeName(cleanActive)
      };
    });

    // For keeping track of which product got matched
    const matchedProductIds = new Set();

    // Try to match each image
    for (const img of imagesToProcess) {
      const imgBaseName = path.basename(img.filename, img.ext);
      const normFilename = normalizeName(imgBaseName);

      let matchedProduct = null;
      let matchReason = '';

      // 1. Exact Filename Match
      let bestMatch = productsNormalized.find(p => p.normName === normFilename);
      if (bestMatch) {
        matchedProduct = bestMatch.product;
        matchReason = 'exact_filename';
      }

      // 2. Fuzzy Filename Match (>90% similarity)
      if (!matchedProduct) {
        let maxSim = 0;
        let bestFuzzy = null;
        for (const p of productsNormalized) {
          const sim = getSimilarity(p.normName, normFilename);
          if (sim > maxSim) {
            maxSim = sim;
            bestFuzzy = p;
          }
        }
        if (maxSim >= 0.90 && bestFuzzy) {
          matchedProduct = bestFuzzy.product;
          matchReason = `fuzzy_filename (${Math.round(maxSim*100)}%)`;
        }
      }

      // 3. OCR Matching (Fallback if filename generic like WhatsApp)
      const isGeneric = normFilename.includes('WHATSAPP') || normFilename.includes('IMAGE') || normFilename.length < 3;
      if (!matchedProduct && isGeneric) {
        try {
          console.log(`Running OCR on generic image: ${img.filename}...`);
          const ocrResult = await Tesseract.recognize(img.path, 'eng');
          const ocrRaw = ocrResult.data.text;
          const ocrText = normalizeName(ocrRaw);
          console.log(`OCR text for ${img.filename}: ${ocrText.slice(0, 100)}...`);

          // 3a. Check if any product normalized brand name is in the OCR text (Exact or Fuzzy)
          let bestOcr = null;
          let ocrMaxLen = 0;
          
          for (const p of productsNormalized) {
            if (p.normName.length >= 3) {
              if (ocrText.includes(p.normName)) {
                if (p.normName.length > ocrMaxLen) {
                  ocrMaxLen = p.normName.length;
                  bestOcr = p.product;
                }
              } else if (containsFuzzyWord(ocrRaw, p.product.name, 0.85)) {
                if (p.normName.length > ocrMaxLen) {
                  ocrMaxLen = p.normName.length;
                  bestOcr = p.product;
                }
              }
            }
          }

          // 3b. Fallback: Check if common name / active ingredient is in the OCR text
          if (!bestOcr) {
            for (const p of productsNormalized) {
              // Exact or clean common name match (e.g. NPK 19:19:19)
              const hasCommon = (p.normCommonName.length >= 6 && ocrText.includes(p.normCommonName)) || 
                                (p.normCleanCommon.length >= 6 && ocrText.includes(p.normCleanCommon));
              const hasActive = (p.normCleanActive.length >= 6 && ocrText.includes(p.normCleanActive));
              
              if (hasCommon || hasActive) {
                if (p.normName.length > ocrMaxLen) {
                  ocrMaxLen = p.normName.length;
                  bestOcr = p.product;
                }
              }
            }
          }

          if (bestOcr) {
            matchedProduct = bestOcr;
            matchReason = 'ocr_match';
          }
        } catch (ocrErr) {
          console.error(`OCR failed for image ${img.filename}:`, ocrErr);
        }
      }

      if (matchedProduct) {
        // Check if product is already matched by another image (Duplicate/Conflict)
        if (matchedProductIds.has(matchedProduct.id)) {
          duplicateImages.push({
            filename: img.filename,
            productId: matchedProduct.id,
            productName: matchedProduct.name,
            matchedReason: matchReason,
            existingMatch: productMatchesMap.get(matchedProduct.id)
          });
          // Check if we should override or skip. If replaceExisting is true, we keep the last one.
          if (!replaceExisting) {
            unusedImages.push(img.filename);
            continue; // Skip processing this duplicate
          }
        }

        // Process Image with Sharp (WebP conversion + Resizing)
        const outputFilename = `${matchedProduct.id}.webp`;
        const destMainPath = path.join(uploadsDir, outputFilename);
        const destThumbPath = path.join(uploadsDir, 'thumbnails', outputFilename);

        try {
          // Check replaceExisting condition for product level
          const hasImage = matchedProduct.imageUrl && fs.existsSync(path.join(uploadsDir, `${matchedProduct.id}.webp`));
          if (!hasImage || replaceExisting) {
            // Main image: 500x500 contain
            await sharp(img.path)
              .resize(500, 500, {
                fit: 'contain',
                background: '#ffffff'
              })
              .toFormat('webp')
              .toFile(destMainPath);

            // Thumbnail: 150x150 contain
            await sharp(img.path)
              .resize(150, 150, {
                fit: 'contain',
                background: '#ffffff'
              })
              .toFormat('webp')
              .toFile(destThumbPath);

            // Update database paths
            matchedProduct.image = outputFilename;
            matchedProduct.imageUrl = `/uploads/${outputFilename}`;
            matchedProduct.thumbnail = `/uploads/thumbnails/${outputFilename}`;

            if (global.isMongoConnected) {
              await Product.updateOne({ id: matchedProduct.id }, {
                $set: {
                  image: matchedProduct.image,
                  imageUrl: matchedProduct.imageUrl,
                  thumbnail: matchedProduct.thumbnail
                }
              });
            }
          }

          matchedProductIds.add(matchedProduct.id);
          productMatchesMap.set(matchedProduct.id, img.filename);
          matchedProducts.push({
            id: matchedProduct.id,
            name: matchedProduct.name,
            filename: img.filename,
            matchReason
          });
        } catch (sharpErr) {
          console.error(`Sharp processing failed for ${img.filename}:`, sharpErr);
          unusedImages.push(img.filename);
        }
      } else {
        unusedImages.push(img.filename);
      }
    }

    // New artwork was just written, so the cached availability set is stale.
    invalidateImageAvailability();

    // Save JSON database if fallback
    if (!global.isMongoConnected) {
      saveLocalProducts(products);
    }

    // Identify missing products
    for (const p of products) {
      if (!matchedProductIds.has(p.id) && !p.imageUrl) {
        missingProducts.push({
          id: p.id,
          name: p.name,
          category: p.category
        });
      }
    }

    // Clean up temp files
    try {
      fs.rmSync(extractionPath, { recursive: true, force: true });
      fs.unlinkSync(zipPath);
    } catch (cleanupErr) {
      console.error('Failed to clean up temp files:', cleanupErr);
    }

    res.status(200).json({
      message: 'ZIP Uploaded Successfully',
      stats: {
        totalProducts: totalProductsCount,
        imagesFound: imagesToProcess.length,
        imagesMatched: matchedProductIds.size,
        missingImages: totalProductsCount - matchedProductIds.size
      },
      matchedProducts,
      missingProducts,
      duplicateImages,
      unusedImages
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get product image statistics
// @route   GET /api/products/image-stats
// @access  Public
exports.getImageStats = async (req, res, next) => {
  try {
    let products = [];
    if (global.isMongoConnected) {
      products = await Product.find({});
    } else {
      products = getLocalProducts();
    }

    const totalProducts = products.length;
    const matchedProducts = [];
    const missingProducts = [];

    for (const p of products) {
      const hasImage = p.imageUrl && fs.existsSync(path.join(uploadsDir, `${p.id}.webp`));
      if (hasImage) {
        matchedProducts.push({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          thumbnail: p.thumbnail
        });
      } else {
        missingProducts.push({
          id: p.id,
          name: p.name,
          category: p.category
        });
      }
    }

    res.status(200).json({
      totalProducts,
      imagesUploaded: matchedProducts.length,
      imagesMissing: missingProducts.length,
      matchedProducts,
      missingProducts,
      duplicateImages: [], // For static report consistency
      unusedImages: []     // For static report consistency
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Manually re-run matching algorithm
// @route   POST /api/products/rematch
// @access  Public
exports.rematchImages = async (req, res, next) => {
  try {
    let products = [];
    if (global.isMongoConnected) {
      products = await Product.find({});
    } else {
      products = getLocalProducts();
    }

    // Rematch is useful if user added new products and wants existing processed uploads to map
    // We scan uploadsDir for any image named <product_id>.webp
    let rematchedCount = 0;
    for (const p of products) {
      const expectedFilename = `${p.id}.webp`;
      const hasImageFile = fs.existsSync(path.join(uploadsDir, expectedFilename));
      if (hasImageFile && !p.imageUrl) {
        p.image = expectedFilename;
        p.imageUrl = `/uploads/${expectedFilename}`;
        p.thumbnail = `/uploads/thumbnails/${expectedFilename}`;
        
        if (global.isMongoConnected) {
          await Product.updateOne({ id: p.id }, {
            $set: {
              image: p.image,
              imageUrl: p.imageUrl,
              thumbnail: p.thumbnail
            }
          });
        }
        rematchedCount++;
      }
    }

    invalidateImageAvailability();

    if (!global.isMongoConnected) {
      saveLocalProducts(products);
    }

    res.status(200).json({
      message: `Re-matching complete. Successfully matched ${rematchedCount} products.`,
      rematchedCount
    });
  } catch (err) {
    next(err);
  }
};
