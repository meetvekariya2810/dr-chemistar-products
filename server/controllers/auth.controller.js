const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  findAccount,
  JWT_SECRET,
  TOKEN_TTL,
  FARMER_PERMISSIONS
} = require('../config/adminAuthConfig');

/**
 * Compare two strings without leaking their common prefix through timing.
 * Hashing first keeps the comparison length-independent, since timingSafeEqual
 * throws on mismatched buffer lengths.
 */
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

/**
 * A real bcrypt hash of an unguessable value, compared against when the supplied
 * username matches no account.
 *
 * Without it, an unknown username would return in microseconds while a known one
 * spent ~100ms in bcrypt - a timing gap wide enough to enumerate valid usernames
 * over the network.
 */
const DECOY_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);

// @desc    Exchange admin credentials for a signed session token
// @route   POST /api/auth/admin/login
// @access  Public (rate limited)
exports.adminLogin = async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    const account = findAccount(username);

    let passOk;
    if (!account) {
      // Burn comparable time, then fail. The result is discarded.
      await bcrypt.compare(password, DECOY_HASH);
      passOk = false;
    } else if (account.passwordHash) {
      passOk = await bcrypt.compare(password, account.passwordHash);
    } else {
      passOk = safeEqual(password, account.password);
    }

    if (!account || !passOk) {
      // Deliberately one message for both cases - saying which half was wrong
      // tells an attacker the username is valid.
      return res.status(401).json({ success: false, message: 'Invalid Login ID or Password.' });
    }

    const token = jwt.sign(
      { sub: account.username, role: account.role },
      JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

    console.log(`[auth] ${account.username} (${account.role}) signed in`);

    res.status(200).json({
      success: true,
      message: 'Signed in.',
      token,
      expiresIn: TOKEN_TTL,
      user: {
        username: account.username,
        role: account.role,
        // Lets the CMS hide controls this role cannot use. Purely cosmetic - the
        // routes themselves are what actually enforce this.
        farmerPermissions: FARMER_PERMISSIONS[account.role] || []
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm the caller's token is still valid
// @route   GET /api/auth/admin/me
// @access  Admin
exports.adminMe = (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      ...req.admin,
      farmerPermissions: FARMER_PERMISSIONS[req.admin.role] || []
    }
  });
};
