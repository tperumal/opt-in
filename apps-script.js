// Google Apps Script — paste this into Extensions > Apps Script in your Google Sheet
//
// Setup:
// 1. Create a NEW Google Sheet (e.g., "Manager Opt-Ins") — separate from the opt-out sheet
// 2. Go to Extensions > Apps Script
// 3. Delete any existing code and paste this entire file
// 4. Click Deploy > New deployment
//    - Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Click Deploy, authorize when prompted
// 6. Copy the Web App URL and paste it into opt-in/index.html as SCRIPT_URL
//
// IMPORTANT: After any code changes, you must create a NEW deployment version:
//   Deploy > Manage deployments > pencil icon > Version: New version > Deploy

// Handles GET requests (e.g., visiting the URL in a browser to verify it's working)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Opt-in endpoint is running. Use POST to submit.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handles form submissions
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Read from form-urlencoded parameters (sent by the HTML form)
    var phone = (e.parameter.phone || '').replace(/\D/g, '');
    var name = (e.parameter.name || '').trim();
    var timestamp = e.parameter.timestamp || new Date().toISOString();

    if (!phone || phone.length !== 10) {
      return buildResponse({ success: false, error: 'Invalid phone number' });
    }

    if (!name) {
      return buildResponse({ success: false, error: 'Name is required' });
    }

    // Add header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Name', 'Phone', 'Timestamp']);
    }

    // Check for duplicate phone numbers
    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) { // skip header row
      if (String(existing[i][1]).replace(/\D/g, '') === phone) {
        return buildResponse({ success: true, message: 'Already opted in' });
      }
    }

    // Format phone for readability in the sheet
    var formattedPhone = '(' + phone.slice(0, 3) + ') ' + phone.slice(3, 6) + '-' + phone.slice(6);

    sheet.appendRow([name, formattedPhone, timestamp]);

    return buildResponse({ success: true, message: 'Opt-in recorded' });
  } catch (err) {
    return buildResponse({ success: false, error: err.message });
  }
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function — run this from the Apps Script editor to verify it works
function testDoPost() {
  var mockEvent = {
    parameter: {
      name: 'Test User',
      phone: '5551234567',
      timestamp: new Date().toISOString()
    }
  };

  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}
