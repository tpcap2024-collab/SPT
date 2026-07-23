import { google } from 'googleapis';

const SHEETS_SCOPE =
  'https://www.googleapis.com/auth/spreadsheets';

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value.trim();
}

function getGooglePrivateKey() {
  const privateKey = getRequiredEnvironmentVariable(
    'GOOGLE_PRIVATE_KEY'
  );

  /*
   * รองรับทั้งสองรูปแบบ:
   *
   * 1. Private key ที่ Render เก็บแบบหลายบรรทัดจริง
   * 2. Private key ที่เก็บ newline เป็นข้อความ \n
   */
  return privateKey.replace(/\\n/g, '\n');
}

function createGoogleAuth() {
  const serviceAccountEmail =
    getRequiredEnvironmentVariable(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL'
    );

  const privateKey = getGooglePrivateKey();

  return new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: [SHEETS_SCOPE],
  });
}

function escapeSheetName(sheetName) {
  return sheetName.replace(/'/g, "''");
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 9999
  ) {
    throw new Error(
      `Invalid pallet quantity: ${value}`
    );
  }

  return quantity;
}

export async function appendPalletTransaction(
  data
) {
  const spreadsheetId =
    getRequiredEnvironmentVariable(
      'GOOGLE_SPREADSHEET_ID'
    );

  const sheetName =
    process.env.GOOGLE_SHEET_NAME?.trim() ||
    'Actual data';

  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    throw new Error(
      'Pallet transaction data is required'
    );
  }

  if (
    typeof data.stampTime !== 'string' ||
    !data.stampTime.trim()
  ) {
    throw new Error('Stamp time is required');
  }

  if (
    typeof data.route !== 'string' ||
    !data.route.trim()
  ) {
    throw new Error('Route is required');
  }

  if (
    typeof data.sub !== 'string' ||
    data.sub.length > 5000
  ) {
    throw new Error('Invalid Sub pallet data');
  }

  const row = [
    data.stampTime.trim(),
    data.route.trim(),
    normalizeQuantity(data.green),
    normalizeQuantity(data.cream),
    normalizeQuantity(data.blue),
    normalizeQuantity(data.boxSleeve),
    normalizeQuantity(data.wing),
    normalizeQuantity(data.glass),
    normalizeQuantity(data.wood),
    data.sub,
    normalizeQuantity(data.palletReturn),
  ];

  const auth = createGoogleAuth();

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  const range =
    `'${escapeSheetName(sheetName)}'!A:K`;

  const response =
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        range,
        majorDimension: 'ROWS',
        values: [row],
      },
    });

  return {
    spreadsheetId:
      response.data.spreadsheetId || spreadsheetId,

    tableRange:
      response.data.tableRange || null,

    updatedRange:
      response.data.updates?.updatedRange || null,

    updatedRows:
      response.data.updates?.updatedRows || 0,

    updatedColumns:
      response.data.updates?.updatedColumns || 0,

    updatedCells:
      response.data.updates?.updatedCells || 0,
  };
}
