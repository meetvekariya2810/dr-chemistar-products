const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const farmerController = require('../controllers/farmer.controller');
const adminAuth = require('../middleware/adminAuth');
const { requireFarmerPermission } = require('../middleware/adminAuth');
const { validateFarmer, validateFarmerUpdate } = require('../validators/validators');

/**
 * Farmer registration API.
 *
 *   POST /api/farmers            public  - the /farmer page has no login
 *   everything else              admin   - farmer records are personal data
 *
 * Every non-public route carries two gates: adminAuth (401 when the caller has
 * no valid session) and requireFarmerPermission (403 when the session is valid
 * but the role is not allowed). There is deliberately no route that returns
 * farmer data without both.
 */

/**
 * Registration is open to the public, so it gets a tighter budget than the
 * app-wide 200/15min limiter. A real farmer registers once; twenty submissions
 * from one connection in fifteen minutes is a script.
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Raise this where many farmers register from one shared connection - a
  // village internet cafe or a company tablet at an agri-mela all share an IP.
  max: parseInt(process.env.FARMER_REGISTER_RATE_LIMIT, 10) || 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registrations from this connection. Please try again in a few minutes, or call us on +91 6351 250 285.'
  }
});

/* ------------------------------- Public ---------------------------------- */

router.post('/', registerLimiter, validateFarmer, farmerController.createFarmer);

/* ------------------------------- Admin ------------------------------------ */
/*
 * Order matters: the literal paths below must be declared before '/:id', or
 * Express would match "export" and "audit-log" as a farmer id.
 */

router.get(
  '/audit-log',
  adminAuth,
  requireFarmerPermission('export'),
  farmerController.getAuditLog
);

router.get(
  '/export/excel',
  adminAuth,
  requireFarmerPermission('export'),
  farmerController.exportExcel
);

router.get(
  '/export/pdf',
  adminAuth,
  requireFarmerPermission('export'),
  farmerController.exportPdf
);

router.get(
  '/',
  adminAuth,
  requireFarmerPermission('view'),
  farmerController.getFarmers
);

router.get(
  '/:id/export/pdf',
  adminAuth,
  requireFarmerPermission('export'),
  farmerController.exportFarmerPdf
);

router.get(
  '/:id',
  adminAuth,
  requireFarmerPermission('view'),
  farmerController.getFarmer
);

router.patch(
  '/:id',
  adminAuth,
  requireFarmerPermission('edit'),
  validateFarmerUpdate,
  farmerController.updateFarmer
);

router.delete(
  '/:id',
  adminAuth,
  requireFarmerPermission('delete'),
  farmerController.deleteFarmer
);

module.exports = router;
