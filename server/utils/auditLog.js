const fs = require('fs');
const path = require('path');
const FarmerAuditLog = require('../models/auditLog.model');

/**
 * Records who did what to the farmer database.
 *
 * Mirrors the store split used everywhere else in this project - MongoDB when it
 * is up, a local JSON file when it is not - because an audit trail that silently
 * stops recording whenever Atlas is unreachable is worse than no trail at all.
 */

const auditFilePath = path.join(__dirname, '../data/farmer-audit-log.json');

/** Keeps the fallback file from growing without bound on a long-running server. */
const MAX_LOCAL_ENTRIES = 5000;

const ACTIONS = {
  VIEWED: 'farmer.viewed',
  LISTED: 'farmer.listed',
  EDITED: 'farmer.edited',
  DELETED: 'farmer.deleted',
  EXPORTED_EXCEL: 'farmer.exported.excel',
  EXPORTED_PDF: 'farmer.exported.pdf'
};

const readLocal = () => {
  if (!fs.existsSync(auditFilePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(auditFilePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const writeLocal = (entries) => {
  const dir = path.dirname(auditFilePath);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    /* read-only serverless environment */
  }
  const tmp = `${auditFilePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf8');
  fs.renameSync(tmp, auditFilePath);
};

let writeChain = Promise.resolve();

/**
 * The client's address, honouring a proxy hop.
 *
 * X-Forwarded-For is client-controlled and only trustworthy behind a proxy that
 * sets it, which is why it is recorded as a hint next to req.ip rather than used
 * for any access decision.
 */
const clientIp = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return (forwarded || req.ip || '').slice(0, 64);
};

/**
 * Write one audit entry.
 *
 * Never throws: an admin's legitimate action must not fail because the audit
 * store hiccuped. A failure is logged loudly to the server console instead so it
 * is still visible to whoever runs the deployment.
 */
const record = async (req, action, { entityId = '', detail = '' } = {}) => {
  const entry = {
    admin_user: req.admin?.username || 'unknown',
    admin_role: req.admin?.role || '',
    action,
    entity: 'farmer',
    entity_id: String(entityId || ''),
    detail: String(detail || '').slice(0, 500),
    ip: clientIp(req)
  };

  try {
    if (global.isMongoConnected) {
      await new FarmerAuditLog(entry).save();
      return;
    }

    await (writeChain = writeChain.then(async () => {
      const entries = readLocal();
      entries.push({ ...entry, created_at: new Date().toISOString() });
      writeLocal(entries.slice(-MAX_LOCAL_ENTRIES));
    }, () => {}));
  } catch (err) {
    console.error(`[audit] FAILED to record "${action}" by ${entry.admin_user}: ${err.message}`);
  }
};

/** Recent audit entries, newest first. Never exposed publicly. */
const list = async (limit = 200) => {
  const capped = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 1000);

  if (global.isMongoConnected) {
    const docs = await FarmerAuditLog.find({}).sort({ created_at: -1 }).limit(capped);
    return docs.map((d) => {
      const raw = d.toObject();
      return { ...raw, id: String(raw._id) };
    });
  }

  return readLocal()
    .slice()
    .reverse()
    .slice(0, capped);
};

module.exports = { record, list, ACTIONS };
