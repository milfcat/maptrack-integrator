import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, apiCredentials } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, maskValue, decrypt } from '@/lib/crypto';

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

    const creds = await db
      .select()
      .from(apiCredentials)
      .where(eq(apiCredentials.integrationId, integration.id));

    // Return masked values
    const masked = creds.map((c) => ({
      id: c.id,
      service: c.service,
      credentialType: c.credentialType,
      maskedValue: maskValue(decrypt(c.encryptedValue, c.iv)),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json(masked);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json();
    const { service, credentialType, value } = body;

    if (!service || !credentialType || !value) {
      return NextResponse.json(
        { error: 'service, credentialType, and value are required' },
        { status: 400 }
      );
    }

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

    const { encrypted, iv } = encrypt(value);

    // Upsert credential
    const [existing] = await db
      .select()
      .from(apiCredentials)
      .where(
        and(
          eq(apiCredentials.integrationId, integration.id),
          eq(apiCredentials.service, service),
          eq(apiCredentials.credentialType, credentialType)
        )
      );

    if (existing) {
      await db
        .update(apiCredentials)
        .set({ encryptedValue: encrypted, iv, updatedAt: new Date() })
        .where(eq(apiCredentials.id, existing.id));
    } else {
      await db.insert(apiCredentials).values({
        integrationId: integration.id,
        service,
        credentialType,
        encryptedValue: encrypted,
        iv,
      });
    }

    return NextResponse.json({ status: 'saved' });
  } catch (error) {
    console.error('Error saving credential:', error);
    return NextResponse.json(
      { error: 'Failed to save credential' },
      { status: 500 }
    );
  }
}
