/**
 * Dropdown vocabularies for the public farmer registration form.
 *
 * These mirror server/config/farmerFields.js. They are deliberately duplicated
 * rather than fetched: the form must render instantly on a weak rural
 * connection, and none of these lists is secret. The server treats them as
 * suggestions and stores whatever string arrives, so a farmer whose crop is not
 * listed can still register - and a value added here needs no backend change.
 */

export const GENDERS = ['Male', 'Female', 'Other'];

export const LAND_UNITS = ['Acre', 'Hectare', 'Bigha', 'Other'];

export const IRRIGATION_TYPES = ['Rainfed', 'Borewell', 'Canal', 'Drip', 'Sprinkler', 'Other'];

export const SOIL_TYPES = ['Black Soil', 'Red Soil', 'Sandy', 'Loamy', 'Clay', 'Other', "Don't Know"];

export const SEASONS = ['Kharif', 'Rabi', 'Summer', 'Perennial', 'Other'];

export const FARMING_TYPES = ['Organic', 'Conventional', 'Mixed'];

export const FARMING_EXPERIENCE = [
  'Less than 1 year',
  '1 - 5 years',
  '5 - 10 years',
  '10 - 20 years',
  'More than 20 years'
];

export const INTERESTS = [
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

export const COMMON_CROPS = [
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

/** Gujarat first - the overwhelming majority of Dr. CHEMISTAR's farmers. */
export const STATES = [
  'Gujarat',
  'Rajasthan',
  'Maharashtra',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Uttar Pradesh',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Tamil Nadu',
  'Bihar',
  'West Bengal',
  'Odisha',
  'Chhattisgarh',
  'Kerala',
  'Jharkhand',
  'Uttarakhand',
  'Himachal Pradesh',
  'Assam',
  'Other'
];
