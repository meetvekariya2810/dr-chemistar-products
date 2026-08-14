const mongoose = require('mongoose');

/**
 * Monotonic sequence generator, used for the human-facing farmer registration
 * number.
 *
 * Deriving the next number from `count()` or `max(farmer_id)` is not safe: two
 * registrations arriving together would read the same value and mint the same
 * ID. A dedicated document incremented with `$inc` is atomic at the server, so
 * concurrent submissions always get distinct numbers.
 *
 * `_id` is the sequence name, e.g. "farmer-2026" (one run of numbers per year).
 */
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, { versionKey: false });

module.exports = mongoose.model('Counter', CounterSchema);
