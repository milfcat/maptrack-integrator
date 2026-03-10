import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, apiCredentials, apiKeyRegistry } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { listCampaigns } from '@/lib/services/justcall';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

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

    // Fetch and decrypt JustCall credentials
    const creds = await db
      .select()
      .from(apiCredentials)
      .where(
        and(
          eq(apiCredentials.integrationId, integration.id),
          eq(apiCredentials.service, 'justcall')
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

    const apiKey = credMap.api_key;
    const apiSecret = credMap.api_secret;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'JustCall API key and secret must be configured before loading campaigns' },
        { status: 400 }
      );
    }

    const campaigns = await listCampaigns(apiKey, apiSecret);

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching JustCall campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns from JustCall' },
      { status: 502 }
    );
  }
}
