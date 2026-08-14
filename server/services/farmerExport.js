const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { EXPORT_COLUMNS } = require('../config/farmerFields');

/**
 * Excel and PDF generation for the farmer database.
 *
 * Both formats are built from the same `records` array the admin table is
 * showing, so an export always contains exactly the rows the filters selected -
 * never a re-query that could return something different, and never sample data.
 */

/* -------------------------------------------------------------------------- */
/* Brand                                                                       */
/* -------------------------------------------------------------------------- */

const BRAND = {
  green: '#15803d',
  blue: '#0284c7',
  orange: '#ea580c',
  slate: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  zebra: '#f8fafc'
};

/** ARGB, which is what ExcelJS wants. */
const argb = (hex) => 'FF' + hex.replace('#', '').toUpperCase();

const LOGO_PATH = path.join(__dirname, '../../public/logo.png');

/* -------------------------------------------------------------------------- */
/* Devanagari / Gujarati text support                                          */
/* -------------------------------------------------------------------------- */

/**
 * PDFKit's built-in Helvetica is Latin-1 only, so a farmer who typed their name
 * in Gujarati or Hindi would export as a row of blank boxes. Noto subsets for
 * both scripts are embedded and chosen per character, which also keeps mixed
 * strings like "ખેડૂત Meet" intact.
 */
const fontFile = (pkg, file) => {
  try {
    return require.resolve(`@fontsource/${pkg}/files/${file}`);
  } catch (err) {
    console.warn(`[farmer-export] Font ${pkg}/${file} is unavailable - that script will not render in PDFs.`);
    return null;
  }
};

const FONT_PATHS = {
  gujarati: fontFile('noto-sans-gujarati', 'noto-sans-gujarati-gujarati-400-normal.woff'),
  devanagari: fontFile('noto-sans-devanagari', 'noto-sans-devanagari-devanagari-400-normal.woff')
};

const FONT = {
  latin: 'Helvetica',
  latinBold: 'Helvetica-Bold',
  gujarati: 'NotoGujarati',
  devanagari: 'NotoDevanagari'
};

// Written as escapes rather than literal glyphs so the ranges survive any
// re-encoding of this file.
const GUJARATI_RANGE = /[\u0A80-\u0AFF]/;
const DEVANAGARI_RANGE = /[\u0900-\u097F]/;

const registerFonts = (doc) => {
  if (FONT_PATHS.gujarati) doc.registerFont(FONT.gujarati, FONT_PATHS.gujarati);
  if (FONT_PATHS.devanagari) doc.registerFont(FONT.devanagari, FONT_PATHS.devanagari);
};

const fontForChar = (ch, bold) => {
  if (FONT_PATHS.gujarati && GUJARATI_RANGE.test(ch)) return FONT.gujarati;
  if (FONT_PATHS.devanagari && DEVANAGARI_RANGE.test(ch)) return FONT.devanagari;
  return bold ? FONT.latinBold : FONT.latin;
};

/**
 * Split a string into consecutive runs that share one font.
 *
 * Iterating with for..of walks code points rather than UTF-16 units, so
 * characters outside the BMP are not torn in half. Gujarati and Devanagari
 * combining marks sit inside their own script's range, so a base character and
 * its matra always land in the same run and shape correctly.
 */
const runsOf = (text, bold) => {
  const runs = [];
  for (const ch of String(text ?? '')) {
    const font = fontForChar(ch, bold);
    const last = runs[runs.length - 1];
    if (last && last.font === font) last.text += ch;
    else runs.push({ font, text: ch });
  }
  return runs;
};

const widthOf = (doc, text, size, bold) =>
  runsOf(text, bold).reduce((total, run) => {
    doc.font(run.font).fontSize(size);
    return total + doc.widthOfString(run.text);
  }, 0);

/** Trim to fit a column, appending ".." so truncation is visible. */
const ellipsize = (doc, text, maxWidth, size, bold) => {
  const str = String(text ?? '');
  if (!str) return '';
  if (widthOf(doc, str, size, bold) <= maxWidth) return str;

  const chars = Array.from(str);
  let end = chars.length;
  while (end > 0) {
    const candidate = chars.slice(0, end).join('').trimEnd() + '..';
    if (widthOf(doc, candidate, size, bold) <= maxWidth) return candidate;
    end -= 1;
  }
  return '';
};

/** Draw one line of possibly mixed-script text at an absolute position. */
const drawText = (doc, text, x, y, { size = 9, bold = false, color = BRAND.slate } = {}) => {
  let cursor = x;
  doc.fillColor(color);
  for (const run of runsOf(text, bold)) {
    doc.font(run.font).fontSize(size);
    doc.text(run.text, cursor, y, { lineBreak: false });
    cursor += doc.widthOfString(run.text);
  }
  return cursor - x;
};

/** Greedy word wrap that measures with the same per-script fonts used to draw. */
const wrapText = (doc, text, maxWidth, size, bold) => {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ');
  if (words.length === 0 || words[0] === '') return [];

  const lines = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (widthOf(doc, candidate, size, bold) <= maxWidth) {
      line = candidate;
      return;
    }
    if (line) lines.push(line);
    // A single word longer than the column still has to land somewhere.
    line = widthOf(doc, word, size, bold) <= maxWidth
      ? word
      : ellipsize(doc, word, maxWidth, size, bold);
  });

  if (line) lines.push(line);
  return lines;
};

/* -------------------------------------------------------------------------- */
/* Shared value formatting                                                     */
/* -------------------------------------------------------------------------- */

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const cellValue = (record, column) => {
  const raw = record[column.key];
  if (column.date) return formatDate(raw);
  if (column.array) return Array.isArray(raw) ? raw.join(', ') : String(raw || '');
  return raw === null || raw === undefined ? '' : String(raw);
};

/** File-safe YYYY-MM-DD stamp for export filenames. */
const dateStamp = (d = new Date()) => d.toISOString().slice(0, 10);

/* -------------------------------------------------------------------------- */
/* Excel                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One sheet, every stored column, real records only.
 *
 * Text-formats the phone, PIN and age columns: Excel otherwise reads
 * "9725658404" as a number and drops a leading zero from a PIN code, which turns
 * a correct export into a wrong one.
 */
const TEXT_FORMAT_KEYS = new Set(['mobile', 'alternate_mobile', 'pincode', 'age', 'farmer_id']);

const buildExcel = async (records, meta = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dr. CHEMISTAR Crop Care Pvt. Ltd.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Farmers', {
    views: [{ state: 'frozen', ySplit: 3 }]
  });

  sheet.columns = EXPORT_COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // Title band
  const titleRow = sheet.addRow([`DR. CHEMISTAR CROP CARE - FARMER DATABASE`]);
  titleRow.font = { bold: true, size: 14, color: { argb: argb(BRAND.green) } };
  titleRow.height = 22;
  sheet.mergeCells(1, 1, 1, EXPORT_COLUMNS.length);

  const metaRow = sheet.addRow([
    `Generated ${formatDateTime(new Date())}  |  Generated by: ${meta.generatedBy || 'Admin'}` +
    `  |  Total records: ${records.length}` +
    (meta.filterSummary ? `  |  Filters: ${meta.filterSummary}` : '')
  ]);
  metaRow.font = { size: 10, color: { argb: argb(BRAND.muted) } };
  sheet.mergeCells(2, 1, 2, EXPORT_COLUMNS.length);

  const header = sheet.addRow(EXPORT_COLUMNS.map((c) => c.label));
  header.height = 20;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND.green) } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = { bottom: { style: 'thin', color: { argb: argb(BRAND.line) } } };
  });

  records.forEach((record, index) => {
    const row = sheet.addRow(EXPORT_COLUMNS.map((c) => cellValue(record, c)));
    row.alignment = { vertical: 'top', wrapText: false };
    if (index % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND.zebra) } };
      });
    }
    EXPORT_COLUMNS.forEach((column, colIndex) => {
      if (TEXT_FORMAT_KEYS.has(column.key)) row.getCell(colIndex + 1).numFmt = '@';
    });
  });

  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + records.length, column: EXPORT_COLUMNS.length }
  };

  return workbook.xlsx.writeBuffer();
};

/* -------------------------------------------------------------------------- */
/* PDF                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Start collecting the document's output.
 *
 * Only attaches the listeners - it must NOT call doc.end(), which finalises the
 * PDF. Each builder draws first and ends last; ending up front flushed page one
 * before a single row was written and left bufferedPageRange() empty, so
 * stampFooters threw "switchToPage(0) out of bounds".
 */
const collectStream = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

/** Branded banner drawn at the top of the first page of every report. */
const drawReportHeader = (doc, { title, subtitle, meta }) => {
  const { left, top } = doc.page.margins;
  const width = doc.page.width - left - doc.page.margins.right;

  doc.rect(left, top, width, 58).fill(BRAND.green);

  let textX = left + 14;
  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.roundedRect(left + 10, top + 9, 40, 40, 6).fill('#ffffff');
      doc.image(LOGO_PATH, left + 13, top + 12, { fit: [34, 34], align: 'center', valign: 'center' });
      textX = left + 60;
    } catch (err) {
      // A missing or unreadable logo must not fail the whole export.
      textX = left + 14;
    }
  }

  drawText(doc, 'DR. CHEMISTAR CROP CARE PVT. LTD.', textX, top + 13, {
    size: 13, bold: true, color: '#ffffff'
  });
  drawText(doc, title, textX, top + 31, { size: 10, bold: true, color: '#d1fae5' });
  if (subtitle) drawText(doc, subtitle, textX, top + 44, { size: 8, color: '#a7f3d0' });

  let y = top + 68;
  meta.filter(Boolean).forEach((line) => {
    drawText(doc, line, left, y, { size: 8, color: BRAND.muted });
    y += 11;
  });

  y += 4;
  doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(BRAND.line).stroke();
  return y + 10;
};

/**
 * Page number and confidentiality notice.
 *
 * PDFKit fires `pageAdded` before anything is drawn on the new page, so the
 * footer is stamped explicitly at the end over the finished page range rather
 * than from that event - otherwise the total count would not be known yet.
 */
const stampFooters = (doc) => {
  const range = doc.bufferedPageRange();
  if (range.count === 0) return;
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    const { left, bottom } = doc.page.margins;
    const width = doc.page.width - left - doc.page.margins.right;
    const y = doc.page.height - bottom + 8;

    doc.moveTo(left, y - 6).lineTo(left + width, y - 6).lineWidth(0.5).strokeColor(BRAND.line).stroke();
    drawText(doc, 'Confidential - for internal Dr. CHEMISTAR use only. Not for distribution.', left, y, {
      size: 7, color: BRAND.muted
    });

    const label = `Page ${i + 1} of ${range.count}`;
    doc.font(FONT.latin).fontSize(7);
    drawText(doc, label, left + width - doc.widthOfString(label), y, { size: 7, color: BRAND.muted });
  }
  // Leave the cursor on the last page so nothing else writes over page 1.
  doc.switchToPage(range.start + range.count - 1);
};

/** Columns that fit a landscape A4 row, matching the admin table. */
const PDF_LIST_COLUMNS = [
  { key: 'farmer_id', label: 'Farmer ID', width: 78 },
  { key: 'created_at', label: 'Registered', width: 62, date: true },
  { key: 'farmer_name', label: 'Farmer Name', width: 105 },
  { key: 'mobile', label: 'Mobile', width: 76 },
  { key: 'village', label: 'Village', width: 72 },
  { key: 'city', label: 'City', width: 68 },
  { key: 'district', label: 'District', width: 72 },
  { key: 'state', label: 'State', width: 66 },
  { key: 'main_crop', label: 'Main Crop', width: 78 },
  { key: 'farm_area', label: 'Area', width: 42 },
  { key: 'status', label: 'Status', width: 53 }
];

const drawTableHeader = (doc, y) => {
  const { left } = doc.page.margins;
  const width = doc.page.width - left - doc.page.margins.right;

  doc.rect(left, y, width, 18).fill(BRAND.slate);
  let x = left + 5;
  PDF_LIST_COLUMNS.forEach((column) => {
    drawText(doc, column.label, x, y + 5.5, { size: 7.5, bold: true, color: '#ffffff' });
    x += column.width;
  });
  return y + 18;
};

/**
 * The "Farmer Database Report" - every filtered record as a paginated table.
 */
const buildListPdf = async (records, meta = {}) => {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 30, bottom: 34, left: 30, right: 30 },
    bufferPages: true,
    info: {
      Title: 'Dr. CHEMISTAR Farmer Database Report',
      Author: 'Dr. CHEMISTAR Crop Care Pvt. Ltd.'
    }
  });
  registerFonts(doc);
  const output = collectStream(doc);

  let y = drawReportHeader(doc, {
    title: 'FARMER REGISTRATION REPORT',
    subtitle: 'Farmer Database Report',
    meta: [
      `Generated: ${formatDateTime(new Date())}`,
      `Generated by: ${meta.generatedBy || 'Admin'}${meta.generatedByRole ? ` (${meta.generatedByRole})` : ''}`,
      `Total records: ${records.length}`,
      meta.filterSummary ? `Filters applied: ${meta.filterSummary}` : null
    ]
  });

  const { left, bottom } = doc.page.margins;
  const width = doc.page.width - left - doc.page.margins.right;
  const rowHeight = 16;
  const lastRowY = () => doc.page.height - bottom - rowHeight;

  if (records.length === 0) {
    drawText(doc, 'No farmer records matched the selected filters.', left, y + 8, {
      size: 10, color: BRAND.muted
    });
    stampFooters(doc);
    doc.end();
    return output;
  }

  y = drawTableHeader(doc, y);

  records.forEach((record, index) => {
    if (y > lastRowY()) {
      doc.addPage();
      y = doc.page.margins.top;
      y = drawTableHeader(doc, y);
    }

    if (index % 2 === 1) doc.rect(left, y, width, rowHeight).fill(BRAND.zebra);

    let x = left + 5;
    PDF_LIST_COLUMNS.forEach((column) => {
      const text = ellipsize(doc, cellValue(record, column), column.width - 8, 7.5, false);
      drawText(doc, text, x, y + 4.5, { size: 7.5, color: BRAND.slate });
      x += column.width;
    });

    doc.moveTo(left, y + rowHeight).lineTo(left + width, y + rowHeight)
      .lineWidth(0.3).strokeColor(BRAND.line).stroke();
    y += rowHeight;
  });

  stampFooters(doc);
  doc.end();
  return output;
};

/* -------------------------------------------------------------------------- */
/* Single farmer profile PDF                                                   */
/* -------------------------------------------------------------------------- */

const PROFILE_SECTIONS = [
  {
    title: 'Basic Information',
    fields: [
      ['Farmer Name', 'farmer_name'],
      ['Mobile Number', 'mobile'],
      ['Alternate Mobile', 'alternate_mobile'],
      ['Email Address', 'email'],
      ['Gender', 'gender'],
      ['Age', 'age']
    ]
  },
  {
    title: 'Location',
    fields: [
      ['Village', 'village'],
      ['City / Town', 'city'],
      ['District', 'district'],
      ['State', 'state'],
      ['PIN Code', 'pincode']
    ]
  },
  {
    title: 'Farm Details',
    fields: [
      ['Farm / Land Area', 'farm_area'],
      ['Land Unit', 'land_unit'],
      ['Irrigation', 'irrigation'],
      ['Soil Type', 'soil_type']
    ]
  },
  {
    title: 'Crop Details',
    fields: [
      ['Main Crop', 'main_crop'],
      ['Other Crops', 'other_crops'],
      ['Current Season', 'current_season'],
      ['Approximate Crop Area', 'crop_area'],
      ['Farming Experience', 'farming_experience'],
      ['Farming Type', 'farming_type']
    ]
  },
  {
    title: 'Requirements',
    fields: [
      ['Interested In', 'interests'],
      ['Farmer Message', 'message']
    ]
  },
  {
    title: 'Company Record',
    fields: [
      ['Registration Date', 'created_at'],
      ['Last Updated', 'updated_at'],
      ['Status', 'status'],
      ['Consent Given', 'consent'],
      ['Admin Notes', 'admin_notes']
    ]
  }
];

const profileValue = (record, key) => {
  const raw = record[key];
  if (key === 'created_at' || key === 'updated_at') return formatDateTime(raw);
  if (key === 'consent') return raw ? 'Yes' : 'No';
  if (Array.isArray(raw)) return raw.length ? raw.join(', ') : '';
  return raw === null || raw === undefined || raw === '' ? '' : String(raw);
};

/**
 * The "Farmer Profile" - one record laid out for a paper file.
 */
const buildProfilePdf = async (record, meta = {}) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 34, bottom: 34, left: 40, right: 40 },
    bufferPages: true,
    info: {
      Title: `Dr. CHEMISTAR Farmer Profile ${record.farmer_id || ''}`.trim(),
      Author: 'Dr. CHEMISTAR Crop Care Pvt. Ltd.'
    }
  });
  registerFonts(doc);
  const output = collectStream(doc);

  let y = drawReportHeader(doc, {
    title: 'FARMER PROFILE',
    subtitle: record.farmer_id ? `Registration ID: ${record.farmer_id}` : '',
    meta: [
      `Generated: ${formatDateTime(new Date())}`,
      `Generated by: ${meta.generatedBy || 'Admin'}${meta.generatedByRole ? ` (${meta.generatedByRole})` : ''}`
    ]
  });

  const { left, bottom } = doc.page.margins;
  const width = doc.page.width - left - doc.page.margins.right;
  const labelWidth = 150;
  const valueWidth = width - labelWidth - 10;

  // Identity strip
  doc.roundedRect(left, y, width, 44, 6).fill('#f0fdf4');
  drawText(doc, record.farmer_name || '(name not provided)', left + 12, y + 9, {
    size: 14, bold: true, color: BRAND.green
  });
  drawText(
    doc,
    [record.village, record.city, record.district, record.state].filter(Boolean).join(', ') || 'Location not provided',
    left + 12, y + 28,
    { size: 8.5, color: BRAND.muted }
  );
  const idLabel = record.farmer_id || '';
  doc.font(FONT.latinBold).fontSize(10);
  drawText(doc, idLabel, left + width - 12 - doc.widthOfString(idLabel), y + 12, {
    size: 10, bold: true, color: BRAND.blue
  });
  y += 56;

  const ensureRoom = (needed) => {
    if (y + needed <= doc.page.height - bottom) return;
    doc.addPage();
    y = doc.page.margins.top;
  };

  PROFILE_SECTIONS.forEach((section) => {
    ensureRoom(40);

    doc.rect(left, y, 3, 12).fill(BRAND.orange);
    drawText(doc, section.title.toUpperCase(), left + 9, y + 2, {
      size: 9, bold: true, color: BRAND.slate
    });
    y += 18;

    section.fields.forEach(([label, key]) => {
      const value = profileValue(record, key);
      const lines = value ? wrapText(doc, value, valueWidth, 9, false) : ['-'];
      const blockHeight = Math.max(lines.length * 12, 14);

      ensureRoom(blockHeight + 4);

      drawText(doc, label, left + 9, y, { size: 8.5, bold: true, color: BRAND.muted });
      lines.forEach((line, i) => {
        drawText(doc, line, left + labelWidth, y + i * 12, {
          size: 9,
          color: value ? BRAND.slate : '#94a3b8'
        });
      });

      y += blockHeight + 2;
      doc.moveTo(left + 9, y).lineTo(left + width, y).lineWidth(0.3).strokeColor(BRAND.line).stroke();
      y += 6;
    });

    y += 6;
  });

  stampFooters(doc);
  doc.end();
  return output;
};

module.exports = {
  buildExcel,
  buildListPdf,
  buildProfilePdf,
  dateStamp
};
