// =============================================================
// EVENT CASH TRACKER — Google Apps Script
// =============================================================
//
// ONE-TIME SETUP (do this once, then never again):
//
//   1. Open https://script.google.com
//   2. Click "New project"
//   3. Delete the default code and paste this entire file
//   4. Click the floppy-disk icon (Save) — name it "Cash Tracker Endpoint"
//   5. Click "Deploy" (top right) → "New deployment"
//   6. Click the gear icon next to "Type" → select "Web app"
//   7. Set:
//        Execute as:       Me
//        Who has access:   Anyone
//   8. Click "Deploy"
//   9. Click "Authorize access" and follow the prompts
//  10. Copy the "Web app URL" that appears
//  11. Open Cash Tracker on your phone → Settings ⚙ → paste the URL → Save
//
// That's it. Every volunteer just needs the app URL — they share
// the same Google Sheet automatically.
//
// To verify it works: visit the Web App URL in a browser.
// You should see: {"status":"Cash Tracker endpoint active",...}
// =============================================================

function doPost(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();

    // Create header row if this is the first write
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
      // Format the Amount column as currency
      sheet.getRange('G2:G').setNumberFormat('"$"#,##0.00');
      // Auto-resize columns for readability
      sheet.autoResizeColumns(1, 7);
    }

    // Parse the incoming JSON
    const payload = JSON.parse(e.postData.contents);
    const rows    = payload.rows;

    if (!rows || rows.length === 0) {
      return jsonResp({ success: false, error: 'Payload contained no rows.' });
    }

    // Write all rows in a single call (efficient, avoids per-row rate limits)
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

// Health check — visit the deployed URL in a browser to confirm it's live
function doGet(e) {
  return jsonResp({
    status   : 'Cash Tracker endpoint active',
    timestamp: new Date().toISOString()
  });
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
