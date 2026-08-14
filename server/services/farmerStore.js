const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Farmer = require('../models/farmer.model');
const Counter = require('../models/counter.model');
const {
  FARMER_STATUSES,
  SEARCHABLE_FIELDS,
  TEXT_FIELDS,
  ARRAY_FIELDS
} = require('../config/farmerFields');

/**
 * Every read and write of farmer records, against whichever store is live.
 *
 * The rest of the project already works this way (see dealer/enquiry
 * controllers): MongoDB when it connected at boot, a local JSON file when it did
 * not, so a farmer's registration is never silently dropped because Atlas was
 * unreachable. Pulling that split in here keeps the controller free of
 * `if (global.isMongoConnected)` branches and guarantees the two paths filter,
 * sort and shape records identically - a mismatch there would mean the Excel
 * export disagreed with the table the admin was looking at.
 */

const farmersFilePath = path.join(__dirname, '../data/farmers.json');

/* -------------------------------------------------------------------------- */
/* Local JSON fallback store                                                   */
/* -------------------------------------------------------------------------- */

const readLocal = () => {
  const dir = path.dirname(farmersFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(farmersFilePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(farmersFilePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[farmer] farmers.json is unreadable - treating it as empty:', e.message);
    return [];
  }
};

const writeLocal = (records) => {
  const dir = path.dirname(farmersFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Write-then-rename so a crash mid-write cannot leave a truncated file that
  // would read back as "no farmers at all".
  const tmp = `${farmersFilePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tmp, farmersFilePath);
};

/**
 * Serialises read-modify-write cycles against the JSON file.
 *
 * Two registrations arriving together would otherwise both read the same array,
 * each append one farmer, and the second write would discard the first.
 */
let localWriteChain = Promise.resolve();
const withLocalLock = (fn) => {
  const run = localWriteChain.then(fn, fn);
  // Keep the chain alive even if this operation rejected.
  localWriteChain = run.then(() => undefined, () => undefined);
  return run;
};

/* -------------------------------------------------------------------------- */
/* Shaping                                                                     */
/* -------------------------------------------------------------------------- */

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter((v) => String(v || '').trim()).map((v) => String(v).trim());
  if (value === undefined || value === null || value === '') return [];
  return [String(value).trim()];
};

/**
 * One record shape for the CMS regardless of which store it came from.
 *
 * Mongo hands back `_id` while the JSON store uses a string `id`, and a record
 * written before a field existed has neither - normalising here keeps every one
 * of those cases out of the React table and out of the exports.
 */
const toApiShape = (doc) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  const shaped = {
    id: String(raw._id || raw.id),
    farmer_id: raw.farmer_id || '',
    consent: Boolean(raw.consent),
    status: FARMER_STATUSES.includes(raw.status) ? raw.status : 'New',
    admin_notes: raw.admin_notes || '',
    created_at: raw.created_at || null,
    updated_at: raw.updated_at || raw.created_at || null
  };

  TEXT_FIELDS.forEach((field) => { shaped[field] = raw[field] || ''; });
  ARRAY_FIELDS.forEach((field) => { shaped[field] = asArray(raw[field]); });

  return shaped;
};

/* -------------------------------------------------------------------------- */
/* Farmer registration ID                                                      */
/* -------------------------------------------------------------------------- */

const formatFarmerId = (year, seq) => `FMR-${year}-${String(seq).padStart(6, '0')}`;

/**
 * Next registration number for the given year, e.g. FMR-2026-000123.
 *
 * Mongo path uses an atomic `$inc` on a counter document, so two submissions
 * landing in the same millisecond cannot be handed the same number. The JSON
 * path derives it from the highest existing number for that year, under the
 * write lock above.
 */
const nextFarmerId = async (year) => {
  if (global.isMongoConnected) {
    const doc = await Counter.findByIdAndUpdate(
      `farmer-${year}`,
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return formatFarmerId(year, doc.seq);
  }

  const prefix = `FMR-${year}-`;
  const highest = readLocal().reduce((max, r) => {
    const id = String(r.farmer_id || '');
    if (!id.startsWith(prefix)) return max;
    const n = parseInt(id.slice(prefix.length), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);

  return formatFarmerId(year, highest + 1);
};

/* -------------------------------------------------------------------------- */
/* Filtering                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Neutralise regex metacharacters in admin-supplied search text.
 *
 * Without this a search for "a+++++++b" compiles into a pattern that can pin the
 * database at 100% CPU, and "." would match every farmer rather than a literal
 * dot.
 */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNumber = (value) => {
  const n = parseFloat(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
};

/**
 * Land areas are stored as the farmer typed them ("5", "5.5", "about 5"), so the
 * farm-size filter parses the leading number and ignores anything it cannot read
 * rather than guessing.
 */
const matchesSize = (record, min, max) => {
  if (min === null && max === null) return true;
  const area = parseNumber(record.farm_area);
  if (area === null) return false;
  if (min !== null && area < min) return false;
  if (max !== null && area > max) return false;
  return true;
};

const EXACT_FILTERS = ['district', 'state', 'city', 'main_crop', 'status', 'irrigation'];

/** Normalise the raw query string into the filter set both stores understand. */
const parseFilters = (query = {}) => {
  const filters = {
    search: String(query.search || query.q || '').trim(),
    dateFrom: query.date_from ? new Date(query.date_from) : null,
    dateTo: query.date_to ? new Date(query.date_to) : null,
    sizeMin: query.farm_size_min !== undefined && query.farm_size_min !== '' ? parseNumber(query.farm_size_min) : null,
    sizeMax: query.farm_size_max !== undefined && query.farm_size_max !== '' ? parseNumber(query.farm_size_max) : null
  };

  EXACT_FILTERS.forEach((field) => {
    const value = String(query[field] || '').trim();
    if (value && value !== 'All') filters[field] = value;
  });

  if (filters.dateFrom && Number.isNaN(filters.dateFrom.getTime())) filters.dateFrom = null;
  if (filters.dateTo && Number.isNaN(filters.dateTo.getTime())) filters.dateTo = null;
  // An end date is inclusive of the whole day the admin picked.
  if (filters.dateTo) filters.dateTo.setHours(23, 59, 59, 999);

  return filters;
};

/** Filters that Mongo can apply itself. Size is left to the JS pass. */
const toMongoQuery = (filters) => {
  const query = {};

  if (filters.search) {
    const rx = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = SEARCHABLE_FIELDS.map((field) => ({ [field]: rx }));
  }

  EXACT_FILTERS.forEach((field) => {
    if (filters[field]) query[field] = new RegExp(`^${escapeRegex(filters[field])}$`, 'i');
  });

  if (filters.dateFrom || filters.dateTo) {
    query.created_at = {};
    if (filters.dateFrom) query.created_at.$gte = filters.dateFrom;
    if (filters.dateTo) query.created_at.$lte = filters.dateTo;
  }

  return query;
};

/** The same filters, applied to already-shaped records from the JSON store. */
const matchesFilters = (record, filters) => {
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    const hit = SEARCHABLE_FIELDS.some((field) =>
      String(record[field] || '').toLowerCase().includes(needle)
    );
    if (!hit) return false;
  }

  for (const field of EXACT_FILTERS) {
    if (filters[field] && String(record[field] || '').toLowerCase() !== filters[field].toLowerCase()) {
      return false;
    }
  }

  if (filters.dateFrom || filters.dateTo) {
    const created = new Date(record.created_at);
    if (Number.isNaN(created.getTime())) return false;
    if (filters.dateFrom && created < filters.dateFrom) return false;
    if (filters.dateTo && created > filters.dateTo) return false;
  }

  return true;
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/** True when `id` could be a Mongo ObjectId - anything else is a farmer_id. */
const isMongoId = (id) =>
  mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

const create = async (payload) => {
  const year = new Date().getFullYear();

  if (global.isMongoConnected) {
    const farmer_id = await nextFarmerId(year);
    return toApiShape(await new Farmer({ ...payload, farmer_id }).save());
  }

  return withLocalLock(async () => {
    const records = readLocal();
    const farmer_id = await nextFarmerId(year);
    const now = new Date().toISOString();
    const record = {
      ...payload,
      farmer_id,
      id: 'fmr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
      created_at: now,
      updated_at: now
    };
    records.push(record);
    writeLocal(records);
    return toApiShape(record);
  });
};

/**
 * Every farmer matching the filters, newest first.
 *
 * Returns the full matching set rather than a page: the admin table, the
 * dashboard counters and the "export what I am currently looking at" behaviour
 * all need the same list, and computing it three times over would let them drift
 * apart. The controller slices it for display.
 */
const query = async (rawQuery) => {
  const filters = parseFilters(rawQuery);
  let records;

  if (global.isMongoConnected) {
    const docs = await Farmer.find(toMongoQuery(filters)).sort({ created_at: -1 });
    records = docs.map(toApiShape);
  } else {
    records = readLocal()
      .map(toApiShape)
      .filter((r) => matchesFilters(r, filters))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Farm size is parsed out of free text, so it is applied after shaping in both
  // paths - keeping one implementation instead of two that could disagree.
  return records.filter((r) => matchesSize(r, filters.sizeMin, filters.sizeMax));
};

const getById = async (id) => {
  if (global.isMongoConnected) {
    const doc = isMongoId(id)
      ? await Farmer.findById(id)
      : await Farmer.findOne({ farmer_id: String(id) });
    return toApiShape(doc);
  }

  const record = readLocal().find(
    (r) => String(r.id) === String(id) || String(r.farmer_id) === String(id)
  );
  return toApiShape(record);
};

const update = async (id, changes) => {
  if (global.isMongoConnected) {
    const filter = isMongoId(id) ? { _id: id } : { farmer_id: String(id) };
    const doc = await Farmer.findOneAndUpdate(filter, changes, { new: true, runValidators: true });
    return toApiShape(doc);
  }

  return withLocalLock(async () => {
    const records = readLocal();
    const index = records.findIndex(
      (r) => String(r.id) === String(id) || String(r.farmer_id) === String(id)
    );
    if (index === -1) return null;
    records[index] = { ...records[index], ...changes, updated_at: new Date().toISOString() };
    writeLocal(records);
    return toApiShape(records[index]);
  });
};

const remove = async (id) => {
  if (global.isMongoConnected) {
    const filter = isMongoId(id) ? { _id: id } : { farmer_id: String(id) };
    const doc = await Farmer.findOneAndDelete(filter);
    return toApiShape(doc);
  }

  return withLocalLock(async () => {
    const records = readLocal();
    const index = records.findIndex(
      (r) => String(r.id) === String(id) || String(r.farmer_id) === String(id)
    );
    if (index === -1) return null;
    const [removed] = records.splice(index, 1);
    writeLocal(records);
    return toApiShape(removed);
  });
};

/**
 * Has this mobile number registered within the last `windowMs`?
 *
 * Used only to warn about an accidental double submission. Scoped to a short
 * window on purpose - see DUPLICATE_WINDOW_MS in config/farmerFields.js.
 */
const findRecentByMobile = async (mobile, windowMs) => {
  const cleaned = String(mobile || '').trim();
  if (!cleaned) return null;
  const since = new Date(Date.now() - windowMs);

  if (global.isMongoConnected) {
    const doc = await Farmer.findOne({ mobile: cleaned, created_at: { $gte: since } })
      .sort({ created_at: -1 });
    return toApiShape(doc);
  }

  const record = readLocal()
    .filter((r) => String(r.mobile || '').trim() === cleaned && new Date(r.created_at) >= since)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  return toApiShape(record);
};

/**
 * Dashboard counters, derived from the records themselves - never hardcoded.
 *
 * `records` is whatever the caller is currently looking at, so the numbers on
 * screen always describe the filtered set rather than the whole table.
 */
const buildStats = (records) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const byStatus = {};
  FARMER_STATUSES.forEach((s) => { byStatus[s] = 0; });

  const byDistrict = {};
  const byCrop = {};
  const byState = {};
  let newThisMonth = 0;

  records.forEach((r) => {
    if (byStatus[r.status] !== undefined) byStatus[r.status] += 1;

    const created = new Date(r.created_at);
    if (!Number.isNaN(created.getTime()) && created >= startOfMonth) newThisMonth += 1;

    const district = (r.district || '').trim() || 'Not specified';
    byDistrict[district] = (byDistrict[district] || 0) + 1;

    const state = (r.state || '').trim() || 'Not specified';
    byState[state] = (byState[state] || 0) + 1;

    // A farmer's main crop and every other crop they listed all count towards
    // "how many of our farmers grow cotton", which is the question the sales
    // team actually asks.
    const crops = new Set(
      [r.main_crop, ...(r.other_crops || [])]
        .map((c) => String(c || '').trim())
        .filter(Boolean)
    );
    crops.forEach((crop) => { byCrop[crop] = (byCrop[crop] || 0) + 1; });
  });

  const toSortedList = (map) =>
    Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    total: records.length,
    newThisMonth,
    byStatus,
    active: byStatus.Active || 0,
    byDistrict: toSortedList(byDistrict),
    byState: toSortedList(byState),
    byCrop: toSortedList(byCrop)
  };
};

/** Distinct values for the admin filter dropdowns, taken from real records. */
const buildFilterOptions = (records) => {
  const collect = (pick) => {
    const set = new Set();
    records.forEach((r) => {
      const values = pick(r);
      (Array.isArray(values) ? values : [values]).forEach((v) => {
        const clean = String(v || '').trim();
        if (clean) set.add(clean);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  };

  return {
    districts: collect((r) => r.district),
    states: collect((r) => r.state),
    cities: collect((r) => r.city),
    crops: collect((r) => [r.main_crop, ...(r.other_crops || [])]),
    irrigation: collect((r) => r.irrigation)
  };
};

module.exports = {
  create,
  query,
  getById,
  update,
  remove,
  findRecentByMobile,
  buildStats,
  buildFilterOptions,
  toApiShape
};
