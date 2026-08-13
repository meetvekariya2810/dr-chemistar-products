const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const productController = require('../controllers/product.controller');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadTempDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadTempDir)) {
      fs.mkdirSync(uploadTempDir, { recursive: true });
    }
    cb(null, uploadTempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `upload_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip') {
      return cb(new Error('Only ZIP files are allowed'));
    }
    cb(null, true);
  }
});

/**
 * Single product photo. Held in memory rather than written to a temp file: it
 * goes straight into sharp, so touching disk twice would only add cleanup that
 * can fail. 10 MB comfortably covers a phone camera shot of a product label.
 */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Accept on either signal: not every client reports a real image mimetype
    // (curl sends application/octet-stream for .webp), and not every upload
    // arrives with a meaningful filename. Content is validated for real when
    // sharp tries to decode it, so this only has to reject the obvious cases.
    const ext = path.extname(file.originalname || '').toLowerCase();
    const looksLikeImage = /^image\//i.test(file.mimetype) || IMAGE_EXTENSIONS.includes(ext);

    if (!looksLikeImage) {
      return cb(new Error('Product photo must be a JPG, PNG, WebP, GIF or AVIF image'));
    }
    cb(null, true);
  }
});

// Multer rejects (wrong type, over 10 MB) are the caller's mistake, so answer
// 400 with the reason instead of letting them reach the 500 handler.
const acceptProductPhoto = (req, res, next) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Product photo must be 10 MB or smaller'
        : err.message;
      return res.status(400).json({ error: message });
    }
    next();
  });
};

router.post('/seed', productController.seedProducts);
router.get('/', productController.getProducts);
router.post('/', acceptProductPhoto, productController.createProduct);
router.delete('/:id', productController.deleteProduct);

// Image catalog routes
router.post('/upload-zip', upload.single('file'), productController.uploadZip);
router.get('/image-stats', productController.getImageStats);
router.post('/rematch', productController.rematchImages);

module.exports = router;
