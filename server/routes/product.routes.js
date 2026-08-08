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

router.post('/seed', productController.seedProducts);
router.get('/', productController.getProducts);
router.delete('/:id', productController.deleteProduct);

// Image catalog routes
router.post('/upload-zip', upload.single('file'), productController.uploadZip);
router.get('/image-stats', productController.getImageStats);
router.post('/rematch', productController.rematchImages);

module.exports = router;
