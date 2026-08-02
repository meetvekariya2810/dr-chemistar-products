const express = require('express');
const router = express.Router();
const dealerController = require('../controllers/dealer.controller');
const { validateDealerRequest } = require('../validators/validators');

router.post('/', validateDealerRequest, dealerController.createDealer);
router.get('/', dealerController.getDealers);
router.put('/:id/approve', dealerController.approveDealer);

module.exports = router;
