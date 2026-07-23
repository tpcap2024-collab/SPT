import { google } from 'googleapis';

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createGoogleAuth() {
  const clientEmail = getRequiredEnvironmentVariable(
    'GOOGLE_SERVICE_ACCOUNT_EMAIL'
  );

  const privateKey = getRequiredEnvironmentVariable(
    'GOOGLE_PRIVATE_KEY'
  ).replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
}

export async function appendPalletTransaction(data) {
  const spreadsheetId = getRequiredEnvironmentVariable(
    'GOOGLE_SPREADSHEET_ID'
  );

  const sheetName =
    process.env.GOOGLE_SHEET_NAME || 'Actual data';

  const auth = createGoogleAuth();

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  const row = [
    data.stampTime,
    data.route,
    data.green,
    data.cream,
    data.blue,
    data.boxSleeve,
    data.wing,
    data.glass,
    data.wood,
    data.sub,
    data.palletReturn,
  ];

  const result =
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${sheetName.replace(/'/g, "''")}'!A:K`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        majorDimension: 'ROWS',
        values: [row],
      },
    });

  return result.data;
}
