const jwt = require('jsonwebtoken');
const { JWT_SECRET, ALL_ROLES, roleCan } = require('../config/adminAuthConfig');

/**
 * Gate for everything under the CMS: the enquiry list carries customers' names,
 * phone numbers and emails, and the farmer database carries a great deal more,
 * so neither may be readable without a token.
 *
 * Answers 401 for every *authentication* failure - missing, malformed, expired
 * or unknown-role token - so the frontend has a single signal meaning "your
 * session is gone, show the login screen again". Being signed in but not allowed
 * to do something is a different thing and is a 403, raised by
 * requireFarmerPermission below.
 */
function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (!token || scheme.toLowerCase() !== 'bearer') {
    return res.status(401).json({ success: false, message: 'Admin sign-in required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // A token whose role we no longer recognise (renamed role, tampered
    // payload) is treated as no token at all rather than defaulting to
    // something permissive.
    if (!ALL_ROLES.includes(payload.role)) {
      return res.status(401).json({ success: false, message: 'Admin sign-in required.' });
    }

    req.admin = { username: payload.sub, role: payload.role };
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      message: expired ? 'Your admin session has expired. Please sign in again.' : 'Invalid admin session.'
    });
  }
}

/**
 * Second gate, for farmer routes only: the caller is authenticated, but is this
 * role allowed to do this particular thing?
 *
 * Must be mounted after adminAuth. `permission` is one of view / edit / delete /
 * export - see FARMER_PERMISSIONS in config/adminAuthConfig.js.
 */
function requireFarmerPermission(permission) {
  return function farmerPermissionGate(req, res, next) {
    // Defensive: a route that forgot adminAuth would otherwise read as "no role",
    // and must not fall through as allowed.
    if (!req.admin || !req.admin.role) {
      return res.status(401).json({ success: false, message: 'Admin sign-in required.' });
    }

    if (!roleCan(req.admin.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Your account (${req.admin.role}) is not permitted to ${permission} farmer records.`
      });
    }

    next();
  };
}

module.exports = adminAuth;
module.exports.adminAuth = adminAuth;
module.exports.requireFarmerPermission = requireFarmerPermission;
