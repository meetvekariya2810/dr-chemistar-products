const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.post('/seed', productController.seedProducts);
router.get('/', productController.getProducts);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
