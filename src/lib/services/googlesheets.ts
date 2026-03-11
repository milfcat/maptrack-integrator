import { google } from 'googleapis';

export interface GoogleSheetsAppendResult {
  updatedRange: string;
  updatedRows: number;
}

export async function appendRow(
  serviceAccountJson: string,
  spreadsheetId: string,
  sheetName: string,
  values: string[]
): Promise<GoogleSheetsAppendResult> {
  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });

  return {
    updatedRange: response.data.updates?.updatedRange ?? '',
    updatedRows: response.data.updates?.updatedRows ?? 0,
  };
}
