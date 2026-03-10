import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeyRegistry } from '@/lib/db/schema';
import { encrypt, decrypt, maskValue } from '@/lib/crypto';

export async function GET() {
  try {
    const keys = await db.select().from(apiKeyRegistry);

    const masked = keys.map((k) => ({
      id: k.id,
      label: k.label,
      service: k.service,
      credentialType: k.credentialType,
      maskedValue: maskValue(decrypt(k.encryptedValue, k.iv)),
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    }));

    return NextResponse.json(masked);
  } catch (error) {
    console.error('Error fetching registry keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registry keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, service, credentialType, value } = body;

    if (!label || !service || !credentialType || !value) {
      return NextResponse.json(
        { error: 'label, service, credentialType, and value are required' },
        { status: 400 }
      );
    }

    const { encrypted, iv } = encrypt(value);

    const [key] = await db
      .insert(apiKeyRegistry)
      .values({
        label,
        service,
        credentialType,
        encryptedValue: encrypted,
        iv,
      })
      .returning();

    return NextResponse.json({
      id: key.id,
      label: key.label,
      service: key.service,
      credentialType: key.credentialType,
      maskedValue: maskValue(value),
      createdAt: key.createdAt,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes('idx_registry_service_type')
    ) {
      return NextResponse.json(
        {
          error: `A key for ${(await request.clone().json()).service}/${(await request.clone().json()).credentialType} already exists. Update it instead.`,
        },
        { status: 409 }
      );
    }
    console.error('Error creating registry key:', error);
    return NextResponse.json(
      { error: 'Failed to create registry key' },
      { status: 500 }
    );
  }
}
