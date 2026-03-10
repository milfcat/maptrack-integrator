import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, apiCredentials, apiKeyRegistry } from '@/lib/db/schema';
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

    // For credentials linked to registry, resolve the registry entry
    const masked = await Promise.all(
      creds.map(async (c) => {
        let maskedValue = '';
        let registryLabel: string | null = null;

        if (c.registryKeyId) {
          const [regKey] = await db
            .select()
            .from(apiKeyRegistry)
            .where(eq(apiKeyRegistry.id, c.registryKeyId));
          if (regKey) {
            maskedValue = maskValue(decrypt(regKey.encryptedValue, regKey.iv));
            registryLabel = regKey.label;
          }
        } else if (c.encryptedValue && c.iv) {
          maskedValue = maskValue(decrypt(c.encryptedValue, c.iv));
        }

        return {
          id: c.id,
          service: c.service,
          credentialType: c.credentialType,
          maskedValue,
          registryKeyId: c.registryKeyId,
          registryLabel,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      })
    );

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
    const { service, credentialType, value, registryKeyId } = body;

    if (!service || !credentialType) {
      return NextResponse.json(
        { error: 'service and credentialType are required' },
        { status: 400 }
      );
    }

    if (!value && !registryKeyId) {
      return NextResponse.json(
        { error: 'Either value or registryKeyId must be provided' },
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

    // If linking to registry, verify the key exists
    if (registryKeyId) {
      const [regKey] = await db
        .select()
        .from(apiKeyRegistry)
        .where(eq(apiKeyRegistry.id, registryKeyId));

      if (!regKey) {
        return NextResponse.json(
          { error: 'Registry key not found' },
          { status: 404 }
        );
      }
    }

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

    if (registryKeyId) {
      // Link to registry key (clear any inline value)
      const data = {
        registryKeyId,
        encryptedValue: null,
        iv: null,
        updatedAt: new Date(),
      };

      if (existing) {
        await db
          .update(apiCredentials)
          .set(data)
          .where(eq(apiCredentials.id, existing.id));
      } else {
        await db.insert(apiCredentials).values({
          integrationId: integration.id,
          service,
          credentialType,
          ...data,
        });
      }
    } else {
      // Store inline value (clear any registry link)
      const { encrypted, iv } = encrypt(value);
      const data = {
        encryptedValue: encrypted,
        iv,
        registryKeyId: null,
        updatedAt: new Date(),
      };

      if (existing) {
        await db
          .update(apiCredentials)
          .set(data)
          .where(eq(apiCredentials.id, existing.id));
      } else {
        await db.insert(apiCredentials).values({
          integrationId: integration.id,
          service,
          credentialType,
          ...data,
        });
      }
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
