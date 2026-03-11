/**
 * Seed script to create the JustCall → Google Sheets integration.
 * Run with: npx tsx scripts/seed-justcall-googlesheets.ts
 *
 * Alternatively, POST to /api/integrations with the same payload.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function seed() {
  const response = await fetch(`${BASE_URL}/api/integrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'JustCall → Google Sheets',
      slug: 'justcall-googlesheets',
      description:
        'Logs JustCall call transcripts and contact info to a Google Sheets spreadsheet',
      sourceService: 'justcall',
      destinationService: 'googlesheets',
      destinationConfig: {
        spreadsheet_id: '',
        sheet_name: 'Sheet1',
      },
      enabled: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create integration:', error);
    process.exit(1);
  }

  const integration = await response.json();
  console.log('Integration created:', integration);
}

seed();
