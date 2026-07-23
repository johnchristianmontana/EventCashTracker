// =============================================================
// EVENT CASH TRACKER — Google Apps Script  (v2 — GET-based)
// =============================================================
//
// Data is submitted via GET request with a ?data= parameter.
// This avoids the GAS redirect issue that silently drops POST bodies.
//
// TO UPDATE DEPLOYMENT:
//   Deploy → Manage deployments → pencil ✏️ → New version → Deploy
// =============================================================

function doGet(e) {
  // Health check (no data parameter)
  if (!e.parameter.data) {
    return jsonResp({
      status   : 'Cash Tracker endpoint active',
      timestamp: new Date().toISOString()
    });
  }

  // Data submission
  try {
    const ss      = SpreadsheetApp.openById('1z7bZl9HcaAQjSi_tcMhco4kQM_nAeiQzM8uf61YgxVM');
    const sheet   = ss.getActiveSheet();
    const payload = JSON.parse(e.parameter.data);
    const rows    = payload.rows;

    if (!rows || rows.length === 0) {
      return jsonResp({ success: false, error: 'No rows in payload' });
    }

    // Ensure header row includes Audit ID for reconciliation.
    ensureHeaders(sheet);

    // Write all rows
    const startRow = sheet.getLastRow() + 1;
    const data = rows.map(r => [
      r.auditId        || '',
      r.eventName      || '',
      r.eventDate      || '',
      r.volunteer      || '',
      Number(r.transactionId) || 0,
      r.timestamp      || '',
      r.category       || '',
      parseFloat(r.amount) || 0
    ]);

    sheet.getRange(startRow, 1, data.length, 8).setValues(data);

    return jsonResp({ success: true, appended: data.length });

  } catch (err) {
    return jsonResp({ success: false, error: err.toString() });
  }
}

function ensureHeaders(sheet) {
  const headers = [
    'Audit ID',
    'Event Name', 'Event Date', 'Volunteer',
    'Transaction ID', 'Timestamp', 'Category', 'Amount'
  ];

  if (sheet.getLastRow() === 0) {
    const hdrRange = sheet.getRange(1, 1, 1, headers.length);
    hdrRange.setValues([headers]);
    hdrRange.setFontWeight('bold');
    hdrRange.setBackground('#1B4332');
    hdrRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.getRange('H2:H').setNumberFormat('"$"#,##0.00');
    sheet.autoResizeColumns(1, 8);
    return;
  }

  const row1 = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 8)).getValues()[0];
  if ((row1[0] || '') !== 'Audit ID') {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue('Audit ID');
  }

  const current = sheet.getRange(1, 1, 1, 8).getValues()[0];
  if ((current[7] || '') !== 'Amount') {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const hdrRange = sheet.getRange(1, 1, 1, headers.length);
  hdrRange.setFontWeight('bold');
  hdrRange.setBackground('#1B4332');
  hdrRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.getRange('H2:H').setNumberFormat('"$"#,##0.00');
  sheet.autoResizeColumns(1, 8);
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
