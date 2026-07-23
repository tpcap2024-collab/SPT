import { getAccessToken } from './firebase';

export async function appendToSheet(spreadsheetId: string, sheetName: string, values: any[][]) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('Not authenticated with Google');

  const range = `${sheetName}!A:Z`;
  
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Google Sheets API Error:', errorText);
    throw new Error('Failed to save to Google Sheets');
  }

  return await res.json();
}
