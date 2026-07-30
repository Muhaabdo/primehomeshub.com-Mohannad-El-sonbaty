/**
 * Prime Homes Hub — Hacienda Ras Al Hekma lead form endpoint.
 *
 * SETUP (one time):
 * 1. Create a new Google Sheet (or open the one you want leads saved to).
 * 2. Extensions > Apps Script.
 * 3. Delete any starter code, paste this whole file in.
 * 4. Deploy > New deployment > select type "Web app".
 *    - Description: anything, e.g. "Lead form endpoint"
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    (must be "Anyone" — the form is submitted by site visitors who are not
 *    logged into Google, so it can't be restricted further than that)
 * 5. Click Deploy, approve the permission prompts (it's your own script
 *    acting on your own sheet), then copy the "Web app" URL ending in /exec.
 * 6. Send that URL back — it gets pasted into js/main.js as SHEET_ENDPOINT.
 *
 * UPDATING LATER: if you edit HEADERS (add/remove/rename a column) and
 * re-deploy, the header row on the existing "Leads" sheet is rewritten
 * in place on the next submission -- no need to delete the sheet or tab.
 * Existing data rows are never touched.
 */

var SHEET_NAME = 'Leads';

var HEADERS = [
  'التاريخ والوقت',
  'الاسم',
  'رقم الموبايل',
  'الوحدة المهتم بيها',
  'الصفحة',
  'اللغة',
  'GCLID'
];

function doPost(e) {
  var sheet = getOrCreateLeadSheet_();
  var p = (e && e.parameter) || {};

  sheet.appendRow([
    new Date(),
    p.name || '',
    p.phone || '',
    p.unit || '',
    p.page || '',
    p.lang || '',
    p.gclid || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateLeadSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  var currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var headersMatch = HEADERS.every(function (h, i) { return currentHeaders[i] === h; });
  if (!headersMatch) {
    formatLeadSheet_(sheet);
  }

  return sheet;
}

/** Header styling, column widths, frozen header row, alternating row colors. */
function formatLeadSheet_(sheet) {
  var colCount = HEADERS.length;

  sheet.getRange(1, 1, 1, colCount).setValues([HEADERS]);

  var header = sheet.getRange(1, 1, 1, colCount);
  header.setFontWeight('bold');
  header.setFontColor('#FFFFFF');
  header.setBackground('#0B1F3A'); // brand navy
  header.setFontSize(11);
  header.setHorizontalAlignment('center');
  header.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 150); // التاريخ والوقت
  sheet.setColumnWidth(2, 170); // الاسم
  sheet.setColumnWidth(3, 130); // رقم الموبايل
  sheet.setColumnWidth(4, 170); // الوحدة المهتم بيها
  sheet.setColumnWidth(5, 220); // الصفحة
  sheet.setColumnWidth(6, 70);  // اللغة
  sheet.setColumnWidth(7, 200); // GCLID

  sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(2, 1, sheet.getMaxRows() - 1, colCount).setHorizontalAlignment('right');

  // Re-applying banding on a range that's already banded throws, so clear
  // any existing bandings on this sheet first (relevant when this function
  // runs again later to pick up a HEADERS change on an existing sheet).
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet.getRange(1, 1, 1000, colCount).applyRowBanding(
    SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false
  );

  sheet.setTabColor('#C8A45D'); // brand gold

  SpreadsheetApp.flush();
}
