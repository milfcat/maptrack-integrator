/**
 * Seed script to create the SmartLead → HubSpot integration.
 * Run with: npx tsx scripts/seed-smartlead-hubspot.ts
 *
 * Alternatively, POST to /api/integrations with the same payload.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function seed() {
  const response = await fetch(`${BASE_URL}/api/integrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'SmartLead → HubSpot',
      slug: 'smartlead-hubspot',
      description:
        'Syncs SmartLead email leads to HubSpot CRM contacts. Creates new contacts or updates existing ones based on email address.',
      sourceService: 'smartlead',
      destinationService: 'hubspot',
      destinationConfig: {},
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
