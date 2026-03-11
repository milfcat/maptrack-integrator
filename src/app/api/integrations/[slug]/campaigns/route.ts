import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, apiCredentials, apiKeyRegistry } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { listCampaigns as listJustCallCampaigns } from '@/lib/services/justcall';
import { listCampaigns as listSmartLeadCampaigns } from '@/lib/services/smartlead';

async function getDecryptedCreds(
  integrationId: number,
  service: string
): Promise<Record<string, string>> {
  const creds = await db
    .select()
    .from(apiCredentials)
    .where(
      and(
        eq(apiCredentials.integrationId, integrationId),
        eq(apiCredentials.service, service)
      )
    );

  const credMap: Record<string, string> = {};
  for (const cred of creds) {
    if (cred.registryKeyId) {
      const [regKey] = await db
        .select()
        .from(apiKeyRegistry)
        .where(eq(apiKeyRegistry.id, cred.registryKeyId));
      if (regKey) {
        credMap[cred.credentialType] = decrypt(regKey.encryptedValue, regKey.iv);
      }
    } else if (cred.encryptedValue && cred.iv) {
      credMap[cred.credentialType] = decrypt(cred.encryptedValue, cred.iv);
    }
  }
  return credMap;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const service = request.nextUrl.searchParams.get('service') ?? 'justcall';

  try {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.slug, slug));

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    if (service === 'smartlead') {
      const credMap = await getDecryptedCreds(integration.id, 'smartlead');
      const apiKey = credMap.api_key;

      if (!apiKey) {
        return NextResponse.json(
          { error: 'SmartLead API key must be configured before loading campaigns' },
          { status: 400 }
        );
      }

      const campaigns = await listSmartLeadCampaigns(apiKey);
      return NextResponse.json(campaigns);
    }

    // Default: JustCall campaigns
    const credMap = await getDecryptedCreds(integration.id, 'justcall');
    const apiKey = credMap.api_key;
    const apiSecret = credMap.api_secret;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'JustCall API key and secret must be configured before loading campaigns' },
        { status: 400 }
      );
    }

    const campaigns = await listJustCallCampaigns(apiKey, apiSecret);
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error(`Error fetching ${service} campaigns:`, error);
    return NextResponse.json(
      { error: `Failed to fetch campaigns from ${service}` },
      { status: 502 }
    );
  }
}
