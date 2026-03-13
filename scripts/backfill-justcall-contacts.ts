/**
 * Backfill script to enrich existing JustCall campaign contacts with
 * missing fields (company, address, occupation, LinkedIn URL) from SmartLead.
 *
 * Run with:
 *   npx dotenv -e .env.local -- npx tsx scripts/backfill-justcall-contacts.ts
 *
 * Requires .env.local with DATABASE_URL and ENCRYPTION_KEY.
 */

import { db } from '../src/lib/db';
import {
  integrations,
  apiCredentials,
  apiKeyRegistry,
} from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '../src/lib/crypto';
import {
  listCampaignContacts,
  updateContact,
} from '../src/lib/services/justcall';
import axios from 'axios';

const INTEGRATION_SLUG = 'smartlead-justcall';

// JustCall custom field IDs (from your account)
const JC_CUSTOM_FIELDS = {
  LINKEDIN_PROFILE_URL: 1163071, // "LinkedIn/Profile URL" (Link)
  COMPANY: 1163072,              // "Company" (Text)
  LEAD_SOURCE: 1163073,          // "Lead Source" (Text)
  LINKEDIN_URL: 1181489,         // "Linkedin URL" (Text)
};

interface JCContact {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  occupation: string;
  address: string;
  custom_fields: Array<{ key: number; label: string; type: string; value: string }>;
}

function getCustomFieldValue(contact: JCContact, key: number): string {
  return contact.custom_fields?.find((f) => f.key === key)?.value ?? '';
}

// SmartLead search by email - returns a single lead object directly
async function searchSmartLeadByEmail(
  email: string,
  apiKey: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await axios.get(
      `https://server.smartlead.ai/api/v1/leads`,
      { params: { api_key: apiKey, email } }
    );
    const data = response.data;
    // API returns a single lead object with an 'id' field, or an array
    if (data && typeof data === 'object' && !Array.isArray(data) && data.id) {
      // Custom fields come as an object like { Title: "Co-CEO", Position: "Managing Director" }
      // Flatten them to top-level for easy access
      const customFields = data.custom_fields ?? {};
      return {
        ...data,
        title: customFields.Title ?? data.title ?? '',
        position: customFields.Position ?? data.position ?? '',
      };
    }
    if (Array.isArray(data) && data.length > 0) return data[0];
    if (data?.data && Array.isArray(data.data) && data.data.length > 0)
      return data.data[0];
    return null;
  } catch {
    return null;
  }
}

async function getDecryptedCredentials(integrationId: number) {
  const creds = await db
    .select()
    .from(apiCredentials)
    .where(eq(apiCredentials.integrationId, integrationId));

  const result: Record<string, Record<string, string>> = {};
  for (const cred of creds) {
    if (!result[cred.service]) result[cred.service] = {};

    if (cred.registryKeyId) {
      const [regKey] = await db
        .select()
        .from(apiKeyRegistry)
        .where(eq(apiKeyRegistry.id, cred.registryKeyId));
      if (regKey) {
        result[cred.service][cred.credentialType] = decrypt(
          regKey.encryptedValue,
          regKey.iv
        );
      }
    } else if (cred.encryptedValue && cred.iv) {
      result[cred.service][cred.credentialType] = decrypt(
        cred.encryptedValue,
        cred.iv
      );
    }
  }
  return result;
}

async function main() {
  console.log('=== JustCall Contact Backfill ===\n');

  // 1. Get integration + credentials
  const [integration] = await db
    .select()
    .from(integrations)
    .where(eq(integrations.slug, INTEGRATION_SLUG));

  if (!integration) {
    console.error(`Integration "${INTEGRATION_SLUG}" not found`);
    process.exit(1);
  }

  const destConfig = (integration.destinationConfig ?? {}) as Record<
    string,
    string
  >;
  const campaignId = destConfig.campaign_id;
  if (!campaignId) {
    console.error('No campaign_id configured in destinationConfig');
    process.exit(1);
  }

  const allCreds = await getDecryptedCredentials(integration.id);
  const jcKey = allCreds.justcall?.api_key;
  const jcSecret = allCreds.justcall?.api_secret;
  const slKey = allCreds.smartlead?.api_key;

  if (!jcKey || !jcSecret) {
    console.error('JustCall credentials not found');
    process.exit(1);
  }
  if (!slKey) {
    console.error('SmartLead API key not found');
    process.exit(1);
  }

  console.log(`Campaign ID: ${campaignId}`);

  // 2. Fetch all contacts from JustCall campaign
  // JustCall API has a pagination bug — page 2 returns 0 even when total > 50.
  // Workaround: fetch with both 'asc' and 'desc' order to get different slices,
  // then deduplicate by contact ID.
  const contactMap = new Map<number, JCContact>();

  console.log('Fetching JustCall campaign contacts...');
  for (const order of ['asc', 'desc', undefined]) {
    let page = 1;
    while (true) {
      const params: Record<string, unknown> = {
        campaign_id: Number(campaignId),
        page,
        per_page: 50,
      };
      if (order) params.order = order;

      const { contacts, total } = await listCampaignContacts(
        campaignId,
        jcKey,
        jcSecret,
        page,
        50,
        order
      );
      const typed = contacts as unknown as JCContact[];
      let newCount = 0;
      for (const c of typed) {
        if (!contactMap.has(c.id)) {
          contactMap.set(c.id, c);
          newCount++;
        }
      }
      console.log(
        `  order=${order ?? 'default'} page=${page}: ${contacts.length} contacts (${newCount} new, total: ${total})`
      );
      if (contacts.length === 0) break;
      page++;
    }
  }

  const allContacts = Array.from(contactMap.values());
  console.log(`\nTotal unique contacts found: ${allContacts.length}`);

  // 3. For each contact missing data, look up SmartLead and update
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const contact of allContacts) {
    const hasOccupation = !!contact.occupation;
    const hasAddress = !!contact.address;
    const hasCompany = !!getCustomFieldValue(
      contact,
      JC_CUSTOM_FIELDS.COMPANY
    );
    const hasLinkedIn = !!getCustomFieldValue(
      contact,
      JC_CUSTOM_FIELDS.LINKEDIN_PROFILE_URL
    );

    if (hasOccupation && hasAddress && hasCompany && hasLinkedIn) {
      skipped++;
      continue;
    }

    const email = contact.email;
    if (!email) {
      console.log(
        `  SKIP ${contact.name} (${contact.phone_number}) - no email`
      );
      skipped++;
      continue;
    }

    try {
      const lead = await searchSmartLeadByEmail(email, slKey);
      if (!lead) {
        console.log(
          `  SKIP ${contact.name} (${email}) - not found in SmartLead`
        );
        skipped++;
        continue;
      }

      // Build update payload
      const fields: Record<string, unknown> = {};
      const customFields: Array<{ id: number; value: string }> = [];

      if (!hasAddress && lead.location)
        fields.address = lead.location;
      if (!hasOccupation && (lead.position || lead.title))
        fields.occupation = (lead.position || lead.title) as string;
      if (!hasCompany && lead.company_name)
        customFields.push({
          id: JC_CUSTOM_FIELDS.COMPANY,
          value: lead.company_name as string,
        });
      if (!hasLinkedIn && lead.linkedin_profile) {
        customFields.push({
          id: JC_CUSTOM_FIELDS.LINKEDIN_PROFILE_URL,
          value: lead.linkedin_profile as string,
        });
        customFields.push({
          id: JC_CUSTOM_FIELDS.LINKEDIN_URL,
          value: lead.linkedin_profile as string,
        });
      }

      if (Object.keys(fields).length === 0 && customFields.length === 0) {
        console.log(
          `  SKIP ${contact.name} (${email}) - SmartLead has no additional data`
        );
        skipped++;
        continue;
      }

      if (customFields.length > 0) {
        fields.custom_fields = customFields;
      }

      const summary = {
        ...(fields.address ? { address: fields.address } : {}),
        ...(fields.occupation ? { occupation: fields.occupation } : {}),
        ...(customFields.length > 0
          ? {
              custom: customFields.map(
                (cf) => `${cf.id}=${cf.value}`
              ),
            }
          : {}),
      };
      console.log(
        `  UPDATE ${contact.name} (${email}) -> ${JSON.stringify(summary)}`
      );
      await updateContact(contact.id, fields, jcKey, jcSecret);
      updated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (axios.isAxiosError(err) && err.response) {
        console.error(
          `  ERROR ${contact.name} (${email}): ${err.response.status} ${JSON.stringify(err.response.data)}`
        );
      } else {
        console.error(`  ERROR ${contact.name} (${email}): ${msg}`);
      }
      errors++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors:  ${errors}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
