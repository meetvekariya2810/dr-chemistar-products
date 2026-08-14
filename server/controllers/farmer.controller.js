const farmerStore = require('../services/farmerStore');
const farmerExport = require('../services/farmerExport');
const audit = require('../utils/auditLog');
const { normaliseIndianMobile } = require('../utils/mobile');
const {
  TEXT_FIELDS,
  ARRAY_FIELDS,
  DUPLICATE_WINDOW_MS,
  FARMER_STATUSES
} = require('../config/farmerFields');

/**
 * Farmer registrations.
 *
 * POST is public - the whole point of /farmer is that a farmer can register
 * without an account. Everything else reads or writes personal data and is
 * mounted behind adminAuth + a role check in routes/farmer.routes.js.
 *
 * Nothing here returns another farmer's details to a public caller, and the
 * create response deliberately carries only the new registration ID.
 */

const notFound = (res) => res.status(404).json({ success: false, message: 'Farmer record not found.' });

/**
 * Build the stored document from the request body.
 *
 * Copies field by field from the known lists rather than spreading req.body, so
 * a caller cannot smuggle in `status: "Active"`, `admin_notes`, a forged
 * `farmer_id`, or a Mongo operator object. Validation has already run; this is
 * the second half of the same guarantee.
 */
const buildPayload = (body) => {
  const payload = {};

  TEXT_FIELDS.forEach((field) => {
    const value = body[field];
    payload[field] = value === undefined || value === null ? '' : String(value).trim();
  });

  ARRAY_FIELDS.forEach((field) => {
    const value = body[field];
    const items = Array.isArray(value) ? value : (value ? [value] : []);
    // Validation guarantees these are strings; de-duplicate and drop blanks so
    // "Cotton, Cotton, " does not reach the database.
    payload[field] = Array.from(new Set(
      items.map((v) => String(v).trim()).filter(Boolean)
    ));
  });

  // Stored in one canonical form so the duplicate check and admin search work
  // regardless of how the farmer spelled it.
  payload.mobile = normaliseIndianMobile(payload.mobile);
  if (payload.alternate_mobile) {
    payload.alternate_mobile = normaliseIndianMobile(payload.alternate_mobile);
  }

  payload.consent = true; // validator rejects anything else
  payload.status = 'New';
  payload.admin_notes = '';

  return payload;
};

/* -------------------------------------------------------------------------- */
/* Public                                                                      */
/* -------------------------------------------------------------------------- */

// @desc    Register a farmer
// @route   POST /api/farmers
// @access  Public
exports.createFarmer = async (req, res, next) => {
  try {
    const payload = buildPayload(req.body);

    /*
     * Accidental double submission guard.
     *
     * A repeat of the same number inside a short window is almost always a
     * double-tap or a page refresh, so the farmer is asked to confirm rather
     * than being blocked - resending with confirm_duplicate: true goes through.
     * The window is deliberately short (see DUPLICATE_WINDOW_MS): a wider one
     * would turn this endpoint into a way to test whether any given number is
     * on file.
     */
    const confirmed = req.body.confirm_duplicate === true || req.body.confirm_duplicate === 'true';
    if (!confirmed) {
      const recent = await farmerStore.findRecentByMobile(payload.mobile, DUPLICATE_WINDOW_MS);
      if (recent) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          message: 'This mobile number may already be registered. Continue?'
        });
      }
    }

    const saved = await farmerStore.create(payload);

    // Registrations are the point of this page, so record where each one landed.
    // Contact details are deliberately left out of the log.
    console.log(
      `[farmer] stored in ${global.isMongoConnected ? 'MongoDB' : 'local JSON store'} ` +
        `(farmer_id=${saved.farmer_id}, city=${saved.city || saved.village}, crop=${saved.main_crop})`
    );

    // Only the registration ID goes back. Echoing the whole record would mean a
    // public endpoint returning personal data, and the farmer already has it.
    res.status(201).json({
      success: true,
      message: 'Farmer registration successful.',
      farmer_id: saved.farmer_id
    });
  } catch (err) {
    next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* Admin only - see routes/farmer.routes.js for the role each one requires      */
/* -------------------------------------------------------------------------- */

// @desc    List farmers with search, filters and dashboard counters
// @route   GET /api/farmers
// @access  Admin (view)
exports.getFarmers = async (req, res, next) => {
  try {
    const records = await farmerStore.query(req.query);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
    const start = (page - 1) * limit;

    await audit.record(req, audit.ACTIONS.LISTED, {
      detail: `${records.length} record(s) matched`
    });

    res.status(200).json({
      success: true,
      source: global.isMongoConnected ? 'mongodb' : 'local-json',
      // Counters describe the filtered set, so the numbers on screen always
      // match the rows underneath them.
      stats: farmerStore.buildStats(records),
      filterOptions: farmerStore.buildFilterOptions(records),
      total: records.length,
      page,
      limit,
      data: records.slice(start, start + limit)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    One complete farmer record
// @route   GET /api/farmers/:id
// @access  Admin (view)
exports.getFarmer = async (req, res, next) => {
  try {
    const record = await farmerStore.getById(req.params.id);
    if (!record) return notFound(res);

    await audit.record(req, audit.ACTIONS.VIEWED, { entityId: record.farmer_id });

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a farmer's status, notes or corrected contact details
// @route   PATCH /api/farmers/:id
// @access  Admin (edit)
exports.updateFarmer = async (req, res, next) => {
  try {
    // Allow-list, so a PATCH cannot rewrite farmer_id, consent or created_at.
    const EDITABLE = ['status', 'admin_notes', 'farmer_name', 'mobile', 'alternate_mobile',
      'email', 'village', 'city', 'district', 'state', 'pincode', 'main_crop'];

    const changes = {};
    EDITABLE.forEach((field) => {
      if (req.body[field] !== undefined) changes[field] = String(req.body[field]).trim();
    });

    if (changes.status && !FARMER_STATUSES.includes(changes.status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${FARMER_STATUSES.join(', ')}`
      });
    }
    if (changes.mobile) changes.mobile = normaliseIndianMobile(changes.mobile);
    if (changes.alternate_mobile) changes.alternate_mobile = normaliseIndianMobile(changes.alternate_mobile);

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    const updated = await farmerStore.update(req.params.id, changes);
    if (!updated) return notFound(res);

    await audit.record(req, audit.ACTIONS.EDITED, {
      entityId: updated.farmer_id,
      detail: `changed: ${Object.keys(changes).join(', ')}`
    });

    res.status(200).json({ success: true, message: 'Farmer updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a farmer record
// @route   DELETE /api/farmers/:id
// @access  Director (delete)
exports.deleteFarmer = async (req, res, next) => {
  try {
    const removed = await farmerStore.remove(req.params.id);
    if (!removed) return notFound(res);

    await audit.record(req, audit.ACTIONS.DELETED, { entityId: removed.farmer_id });
    console.log(`[farmer] ${removed.farmer_id} deleted by ${req.admin.username}`);

    res.status(200).json({ success: true, message: 'Farmer record deleted.', id: req.params.id });
  } catch (err) {
    next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* Exports                                                                     */
/* -------------------------------------------------------------------------- */

/** Human-readable summary of the active filters, printed on the report header. */
const describeFilters = (query) => {
  const parts = [];
  const label = {
    search: 'search', district: 'district', state: 'state', city: 'city',
    main_crop: 'crop', status: 'status', irrigation: 'irrigation',
    date_from: 'from', date_to: 'to', farm_size_min: 'min area', farm_size_max: 'max area'
  };
  Object.entries(label).forEach(([key, name]) => {
    const value = String(query[key] || '').trim();
    if (value && value !== 'All') parts.push(`${name}: ${value}`);
  });
  return parts.join(', ');
};

const exportMeta = (req) => ({
  generatedBy: req.admin?.username || 'Admin',
  generatedByRole: req.admin?.role || '',
  filterSummary: describeFilters(req.query)
});

// @desc    Excel workbook of the filtered farmer records
// @route   GET /api/farmers/export/excel
// @access  Director (export)
exports.exportExcel = async (req, res, next) => {
  try {
    const records = await farmerStore.query(req.query);
    const buffer = await farmerExport.buildExcel(records, exportMeta(req));
    const filename = `Farmers_${farmerExport.dateStamp()}.xlsx`;

    await audit.record(req, audit.ACTIONS.EXPORTED_EXCEL, {
      detail: `${records.length} record(s)${exportMeta(req).filterSummary ? ` | ${exportMeta(req).filterSummary}` : ''}`
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};

// @desc    PDF report of the filtered farmer records
// @route   GET /api/farmers/export/pdf
// @access  Director (export)
exports.exportPdf = async (req, res, next) => {
  try {
    const records = await farmerStore.query(req.query);
    const buffer = await farmerExport.buildListPdf(records, exportMeta(req));
    const filename = `Farmers_${farmerExport.dateStamp()}.pdf`;

    await audit.record(req, audit.ACTIONS.EXPORTED_PDF, {
      detail: `list export, ${records.length} record(s)`
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
};

// @desc    Single-farmer profile PDF, for the company's paper file
// @route   GET /api/farmers/:id/export/pdf
// @access  Director (export)
exports.exportFarmerPdf = async (req, res, next) => {
  try {
    const record = await farmerStore.getById(req.params.id);
    if (!record) return notFound(res);

    const buffer = await farmerExport.buildProfilePdf(record, exportMeta(req));
    const filename = `Farmer_${record.farmer_id || 'profile'}.pdf`;

    await audit.record(req, audit.ACTIONS.EXPORTED_PDF, {
      entityId: record.farmer_id,
      detail: 'single profile export'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
};

// @desc    Recent privileged actions taken against farmer records
// @route   GET /api/farmers/audit-log
// @access  Director (export - i.e. full farmer database access)
exports.getAuditLog = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await audit.list(req.query.limit) });
  } catch (err) {
    next(err);
  }
};
