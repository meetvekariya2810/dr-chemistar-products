const crypto = require('crypto');

/**
 * Admin credential, role and token configuration, resolved once at boot.
 *
 * The CMS login used to be a hardcoded `admin`/`admin123` comparison inside
 * AdminPanel.tsx, which meant the password shipped in the production JS bundle
 * and anyone could read the enquiry list straight from /api/enquiries. Both
 * halves now live here, server-side only.
 *
 * Roles were added for the farmer database: farmer records are personal data, so
 * "can sign into the CMS" and "may read/export the farmer database" have to be
 * separable. There is one account list, one token format and one middleware -
 * the farmer module extends this rather than standing up a second login.
 */

/* -------------------------------------------------------------------------- */
/* Roles and permissions                                                       */
/* -------------------------------------------------------------------------- */

const ROLES = {
  DIRECTOR: 'director',
  ADMIN: 'admin',
  STAFF: 'staff'
};

const ALL_ROLES = Object.values(ROLES);

/**
 * What each role may do with farmer records.
 *
 * Director alone gets the full set. Admin can work the queue (read a record,
 * update status/notes) but cannot bulk-extract the database or delete from it.
 * Staff can sign into the CMS for the product/dealer/enquiry tabs and gets
 * nothing on farmers - exports in particular are never granted by default, so
 * adding a staff account can't quietly hand out the whole farmer list.
 *
 * To change who can do what, edit this map; every farmer route reads from it.
 */
const FARMER_PERMISSIONS = {
  [ROLES.DIRECTOR]: ['view', 'edit', 'delete', 'export'],
  [ROLES.ADMIN]: ['view', 'edit'],
  [ROLES.STAFF]: []
};

const roleCan = (role, permission) =>
  (FARMER_PERMISSIONS[role] || []).includes(permission);

/* -------------------------------------------------------------------------- */
/* Accounts                                                                    */
/* -------------------------------------------------------------------------- */

const normaliseRole = (value, fallback) => {
  const role = String(value || '').trim().toLowerCase();
  return ALL_ROLES.includes(role) ? role : fallback;
};

/**
 * Multiple accounts, as a JSON array in ADMIN_ACCOUNTS:
 *
 *   ADMIN_ACCOUNTS=[{"username":"director","passwordHash":"$2a$...","role":"director"},
 *                   {"username":"office","passwordHash":"$2a$...","role":"staff"}]
 *
 * `passwordHash` is a bcrypt hash; `password` (plaintext) is tolerated for local
 * setups but warned about. Anything malformed is ignored rather than crashing
 * the server - a typo in an env var must not take the whole API down.
 */
const parseAccountsEnv = () => {
  const raw = (process.env.ADMIN_ACCOUNTS || '').trim();
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('[auth] ADMIN_ACCOUNTS is not valid JSON - ignoring it and falling back to the single-account settings.');
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error('[auth] ADMIN_ACCOUNTS must be a JSON array - ignoring it.');
    return [];
  }

  return parsed
    .map((entry) => ({
      username: String(entry?.username || '').trim(),
      passwordHash: String(entry?.passwordHash || '').trim(),
      password: entry?.password === undefined ? '' : String(entry.password),
      role: normaliseRole(entry?.role, ROLES.STAFF)
    }))
    .filter((entry) => {
      if (!entry.username) {
        console.error('[auth] Skipping an ADMIN_ACCOUNTS entry with no username.');
        return false;
      }
      if (!entry.passwordHash && !entry.password) {
        console.error(`[auth] Skipping ADMIN_ACCOUNTS entry "${entry.username}" - it has neither passwordHash nor password.`);
        return false;
      }
      return true;
    });
};

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

/**
 * Prefer a bcrypt hash. ADMIN_PASSWORD (plaintext) stays supported so the
 * project owner's existing `admin` / `admin123` login keeps working locally
 * without a setup step; production should set ADMIN_PASSWORD_HASH instead.
 */
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH || '').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * The single built-in account defaults to `director`.
 *
 * The owner of this deployment signs in with it, and demoting it would lock the
 * company out of its own farmer database on the first deploy after this change.
 */
const ADMIN_ROLE = normaliseRole(process.env.ADMIN_ROLE, ROLES.DIRECTOR);

const envAccounts = parseAccountsEnv();

const ACCOUNTS = envAccounts.length > 0
  ? envAccounts
  : [{
      username: ADMIN_USERNAME,
      passwordHash: ADMIN_PASSWORD_HASH,
      password: ADMIN_PASSWORD_HASH ? '' : ADMIN_PASSWORD,
      role: ADMIN_ROLE
    }];

const findAccount = (username) => {
  const wanted = String(username || '').trim();
  if (!wanted) return null;
  return ACCOUNTS.find((a) => a.username === wanted) || null;
};

const usingDefaultPassword =
  envAccounts.length === 0 && !ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD;

const plaintextAccounts = ACCOUNTS.filter((a) => !a.passwordHash).map((a) => a.username);

/* -------------------------------------------------------------------------- */
/* Token                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A missing JWT_SECRET must never fall back to a constant - a checked-in secret
 * lets anyone mint an admin token. A per-boot random secret is safe instead; the
 * only cost is that existing sessions end when the server restarts.
 */
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
const usingEphemeralSecret = !process.env.JWT_SECRET;

const TOKEN_TTL = process.env.ADMIN_TOKEN_TTL || '8h';

const warnIfInsecure = () => {
  if (usingEphemeralSecret) {
    console.warn(
      '[auth] JWT_SECRET is not set - using a random per-boot secret. ' +
        'Admin sessions will end on every restart. Set JWT_SECRET in .env.'
    );
  }
  if (usingDefaultPassword) {
    const msg =
      '[auth] Admin is using the built-in default password. ' +
      'Set ADMIN_PASSWORD_HASH (bcrypt) or ADMIN_PASSWORD in .env before deploying.';
    if (process.env.NODE_ENV === 'production') console.error(msg);
    else console.warn(msg);
  }
  if (plaintextAccounts.length > 0 && !usingDefaultPassword) {
    console.warn(
      `[auth] These accounts are configured with a plaintext password: ${plaintextAccounts.join(', ')}. ` +
        'Use a bcrypt passwordHash instead.'
    );
  }
  const directors = ACCOUNTS.filter((a) => a.role === ROLES.DIRECTOR).map((a) => a.username);
  if (directors.length === 0) {
    console.error(
      '[auth] No account has the "director" role - nobody can export or delete farmer records. ' +
        'Set ADMIN_ROLE=director or give one ADMIN_ACCOUNTS entry that role.'
    );
  }
  console.log(
    `[auth] ${ACCOUNTS.length} admin account(s) configured: ` +
      ACCOUNTS.map((a) => `${a.username}(${a.role})`).join(', ')
  );
};

module.exports = {
  ROLES,
  ALL_ROLES,
  FARMER_PERMISSIONS,
  roleCan,
  ACCOUNTS,
  findAccount,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  ADMIN_PASSWORD_HASH,
  ADMIN_ROLE,
  JWT_SECRET,
  TOKEN_TTL,
  usingDefaultPassword,
  warnIfInsecure
};
