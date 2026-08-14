/**
 * Single source of truth for the farmer record shape.
 *
 * The validator, the Mongoose schema, the JSON fallback store, the Excel export
 * and the PDF export all read from here. Keeping one list means a new field (or
 * a changed "is this mandatory" decision) is a one-line edit that can never
 * leave the export columns out of step with what the form actually collects.
 */

/**
 * The ONLY mandatory fields, per the business rule that a farmer must be able to
 * submit with almost everything blank. `consent` is validated separately because
 * it is a boolean rather than a filled-in text field.
 *
 * `city` is satisfied by EITHER city or village - a farmer who only knows their
 * village should never be blocked. See CITY_OR_VILLAGE below.
 *
 * To change what is mandatory, edit this array. Nothing else needs to change.
 */
const REQUIRED_FIELDS = ['farmer_name', 'mobile', 'city'];

/** `city` is satisfied by whichever of these the farmer filled in. */
const CITY_OR_VILLAGE = ['city', 'village'];

const LAND_UNITS = ['Acre', 'Hectare', 'Bigha', 'Other'];

const IRRIGATION_TYPES = ['Rainfed', 'Borewell', 'Canal', 'Drip', 'Sprinkler', 'Other'];

const SOIL_TYPES = ['Black Soil', 'Red Soil', 'Sandy', 'Loamy', 'Clay', 'Other', "Don't Know"];

const GENDERS = ['Male', 'Female', 'Other'];

const SEASONS = ['Kharif', 'Rabi', 'Summer', 'Perennial', 'Other'];

const FARMING_TYPES = ['Organic', 'Conventional', 'Mixed'];

const INTERESTS = [
  'Crop Protection',
  'Insecticide',
  'Fungicide',
  'Herbicide',
  'Plant Growth Regulator',
  'Fertilizer',
  'Water Soluble Fertilizer',
  'Crop Advisory',
  'Pest / Disease Guidance',
  'Product Information',
  'Dealer Information',
  'Other'
];

/** Lifecycle an admin moves a farmer through. */
const FARMER_STATUSES = ['New', 'Contacted', 'Active', 'Inactive'];

/**
 * Free-text option lists.
 *
 * These are suggestions in the UI, NOT a closed enum on the server: a farmer who
 * grows something not on the list must still be able to register. The server
 * therefore stores whatever string arrives (length-capped) rather than rejecting
 * it, which is why none of these appear in the Mongoose `enum` validators below.
 */
const COMMON_CROPS = [
  'Cotton',
  'Groundnut',
  'Chilli',
  'Wheat',
  'Rice',
  'Maize',
  'Cumin',
  'Castor',
  'Vegetables',
  'Soybean',
  'Sugarcane',
  'Mustard',
  'Gram / Chana',
  'Sesame',
  'Onion',
  'Potato',
  'Banana',
  'Mango',
  'Other'
];

/**
 * Every stored field, in the order the exports present them.
 *
 * `key`    - property on the API record
 * `label`  - column heading in Excel / row label in the single-farmer PDF
 * `width`  - Excel column width
 * `array`  - joined with ", " when written to a cell
 */
const EXPORT_COLUMNS = [
  { key: 'farmer_id', label: 'Farmer ID', width: 18 },
  { key: 'created_at', label: 'Registration Date', width: 20, date: true },
  { key: 'farmer_name', label: 'Farmer Name', width: 24 },
  { key: 'mobile', label: 'Mobile', width: 16 },
  { key: 'alternate_mobile', label: 'Alternate Mobile', width: 16 },
  { key: 'email', label: 'Email', width: 26 },
  { key: 'gender', label: 'Gender', width: 10 },
  { key: 'age', label: 'Age', width: 8 },
  { key: 'village', label: 'Village', width: 18 },
  { key: 'city', label: 'City', width: 18 },
  { key: 'district', label: 'District', width: 18 },
  { key: 'state', label: 'State', width: 16 },
  { key: 'pincode', label: 'PIN', width: 10 },
  { key: 'farm_area', label: 'Farm Area', width: 12 },
  { key: 'land_unit', label: 'Land Unit', width: 12 },
  { key: 'irrigation', label: 'Irrigation', width: 14 },
  { key: 'soil_type', label: 'Soil Type', width: 14 },
  { key: 'main_crop', label: 'Main Crop', width: 16 },
  { key: 'other_crops', label: 'Other Crops', width: 28, array: true },
  { key: 'current_season', label: 'Current Season', width: 14 },
  { key: 'crop_area', label: 'Crop Area', width: 12 },
  { key: 'farming_experience', label: 'Farming Experience', width: 18 },
  { key: 'farming_type', label: 'Farming Type', width: 14 },
  { key: 'interests', label: 'Interests', width: 34, array: true },
  { key: 'message', label: 'Message', width: 40 },
  { key: 'status', label: 'Status', width: 12 },
  { key: 'admin_notes', label: 'Admin Notes', width: 30 }
];

/** Scalar (non-array, non-boolean) fields accepted from the public form. */
const TEXT_FIELDS = [
  'farmer_name',
  'mobile',
  'alternate_mobile',
  'email',
  'gender',
  'age',
  'village',
  'city',
  'district',
  'state',
  'pincode',
  'farm_area',
  'land_unit',
  'irrigation',
  'soil_type',
  'main_crop',
  'current_season',
  'crop_area',
  'farming_experience',
  'farming_type',
  'message'
];

/** Array fields accepted from the public form. */
const ARRAY_FIELDS = ['other_crops', 'interests'];

/** Columns the admin farmer search scans. */
const SEARCHABLE_FIELDS = [
  'farmer_id',
  'farmer_name',
  'mobile',
  'alternate_mobile',
  'village',
  'city',
  'district',
  'state',
  'main_crop'
];

/**
 * How long after a registration another attempt on the same mobile is treated as
 * a probable accidental resubmit rather than a second farmer. Deliberately short:
 * a genuinely different farmer sharing a family phone months later must not be
 * blocked, and a longer window would turn this into a lookup oracle for whether
 * any given number is on file.
 */
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

module.exports = {
  REQUIRED_FIELDS,
  CITY_OR_VILLAGE,
  LAND_UNITS,
  IRRIGATION_TYPES,
  SOIL_TYPES,
  GENDERS,
  SEASONS,
  FARMING_TYPES,
  INTERESTS,
  FARMER_STATUSES,
  COMMON_CROPS,
  EXPORT_COLUMNS,
  TEXT_FIELDS,
  ARRAY_FIELDS,
  SEARCHABLE_FIELDS,
  DUPLICATE_WINDOW_MS
};
