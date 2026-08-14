/**
 * Indian mobile number handling, shared by the farmer validator and controller
 * so "is this valid" and "what do we store" can never disagree.
 *
 * Farmers type their number every way imaginable - 98765 43210, +91 98765-43210,
 * 098765 43210, 919876543210 - and rejecting any of those would cost a real
 * registration. All of them normalise to the same 10 digits, which is also what
 * makes the accidental-double-submit check reliable: two spellings of one number
 * have to compare equal.
 */

/** Characters a person might reasonably type in a phone number. */
const ALLOWED_CHARS = /^[0-9+\-()\s]+$/;

/**
 * Reduce any accepted spelling to the bare 10-digit subscriber number, or null
 * if it is not a valid Indian mobile.
 *
 * Indian mobile numbers are 10 digits and begin 6-9, so a 10-digit string
 * starting with 0-5 is a landline or a typo rather than a mobile.
 */
const toTenDigits = (raw) => {
  const value = String(raw ?? '').trim();
  if (!value || !ALLOWED_CHARS.test(value)) return null;

  const digits = value.replace(/\D/g, '');

  let local = null;
  if (digits.length === 10) local = digits;
  else if (digits.length === 11 && digits.startsWith('0')) local = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith('91')) local = digits.slice(2);
  else if (digits.length === 13 && digits.startsWith('091')) local = digits.slice(3);

  if (!local || !/^[6-9]\d{9}$/.test(local)) return null;
  return local;
};

const isValidIndianMobile = (raw) => toTenDigits(raw) !== null;

/**
 * Canonical stored form: +91XXXXXXXXXX.
 *
 * Anything unrecognised is returned trimmed rather than discarded - the
 * validator is what rejects bad input, and this must never silently blank out a
 * field it was handed.
 */
const normaliseIndianMobile = (raw) => {
  const local = toTenDigits(raw);
  return local ? `+91${local}` : String(raw ?? '').trim();
};

module.exports = { toTenDigits, isValidIndianMobile, normaliseIndianMobile };
