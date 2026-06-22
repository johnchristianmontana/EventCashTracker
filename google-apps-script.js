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

    // Create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Event Name', 'Event Date', 'Volunteer',
        'Transaction ID', 'Timestamp', 'Category', 'Amount'
      ];
      const hdrRange = sheet.getRange(1, 1, 1, headers.length);
      hdrRange.setValues([headers]);
      hdrRange.setFontWeight('bold');
      hdrRange.setBackground('#1B4332');
      hdrRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
      sheet.getRange('G2:G').setNumberFormat('"$"#,##0.00');
      sheet.autoResizeColumns(1, 7);
    }

    // Write all rows
    const startRow = sheet.getLastRow() + 1;
    const data = rows.map(r => [
      r.eventName      || '',
      r.eventDate      || '',
      r.volunteer      || '',
      Number(r.transactionId) || 0,
      r.timestamp      || '',
      r.category       || '',
      parseFloat(r.amount) || 0
    ]);

    sheet.getRange(startRow, 1, data.length, 7).setValues(data);

    return jsonResp({ success: true, appended: data.length });

  } catch (err) {
    return jsonResp({ success: false, error: err.toString() });
  }
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
